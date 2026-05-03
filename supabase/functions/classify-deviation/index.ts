// Lara: agentic deviation classifier
// Inputs a free-text description of an incident and returns a structured
// proposal incl. category, criticality, normative deadlines (GDPR, NIS2, ISO),
// suggested responsible person and immediate measures.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CATEGORY_IDS = [
  "datainnbrudd",
  "tilgangskontroll",
  "hendelseshåndtering",
  "prosess_og_rutiner",
  "personvern",
  "ai_avvik",
  "sikkerhet",
  "hms",
  "kvalitet",
  "miljo",
  "annet",
];

const FRAMEWORKS = [
  "GDPR",
  "ISO27001",
  "NIS2",
  "AI Act",
  "ISO42001",
  "NSM",
  "SOC2",
  "HMS",
  "ISO9001",
  "ISO14001",
];

const SYSTEM_PROMPT = `Du er Lara, en agentisk compliance-assistent for norske virksomheter.
Brukeren beskriver en hendelse / et avvik. Din oppgave er å:
1. Klassifisere avviket (kategori + alvorlighetsgrad).
2. Identifisere normative regler og frister som gjelder, spesielt:
   - GDPR art. 33 (melding til Datatilsynet innen 72 timer ved brudd på personopplysningssikkerheten)
   - GDPR art. 34 (varsling av registrerte ved sannsynlig høy risiko)
   - NIS2 art. 23 (vesentlige/viktige enheter: tidlig varsling 24t, full melding 72t, sluttrapport 1 mnd)
   - ISO/IEC 27001 A.5.24–A.5.27 (incident management lifecycle)
   - AI Act art. 73 (alvorlige hendelser med AI-systemer)
3. Foreslå 2–4 umiddelbare tiltak.
4. Stille maks 2 oppfølgingsspørsmål kun når svaret kan endre normativ klassifisering
   (f.eks. antall berørte registrerte, om særlige kategorier er involvert).
Svar alltid på norsk. Vær konkret og kortfattet. Ikke gjett ansvarlig hvis du ikke har grunnlag.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const description: string = body.description || "";
    const quickCategory: string | undefined = body.quickCategory;
    const followUpAnswers: Record<string, string> | undefined =
      body.followUpAnswers;
    const industry: string | undefined = body.industry;
    const workAreas: Array<{ name: string; responsible_person?: string }> =
      body.workAreas || [];

    if (!description || description.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Beskrivelse er for kort" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userContext = [
      `Beskrivelse: ${description}`,
      quickCategory ? `Brukers hurtigvalg av kategori: ${quickCategory}` : "",
      industry ? `Bransje: ${industry}` : "",
      workAreas.length
        ? `Tilgjengelige arbeidsområder/ansvarlige:\n${workAreas
            .map(
              (w) =>
                `- ${w.name}${
                  w.responsible_person ? ` (${w.responsible_person})` : ""
                }`,
            )
            .join("\n")}`
        : "",
      followUpAnswers && Object.keys(followUpAnswers).length
        ? `Svar på oppfølging:\n${Object.entries(followUpAnswers)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const tool = {
      type: "function",
      function: {
        name: "propose_deviation",
        description: "Strukturert forslag til avviksregistrering",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Kort tittel, maks 90 tegn" },
            description: {
              type: "string",
              description: "Ryddet og presis beskrivelse",
            },
            category: { type: "string", enum: CATEGORY_IDS },
            criticality: {
              type: "string",
              enum: ["critical", "high", "medium", "low"],
            },
            frameworks: {
              type: "array",
              items: { type: "string", enum: FRAMEWORKS },
            },
            normativeRules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  label: { type: "string" },
                  deadlineHours: { type: "number" },
                  action: { type: "string" },
                  triggered: { type: "boolean" },
                },
                required: ["code", "label", "action", "triggered"],
              },
            },
            suggestedResponsible: {
              type: "object",
              properties: {
                name: { type: "string" },
                reason: { type: "string" },
              },
            },
            suggestedMeasures: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              maxItems: 4,
            },
            followUpQuestions: {
              type: "array",
              maxItems: 2,
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                  },
                  affects: { type: "string" },
                },
                required: ["id", "question", "options"],
              },
            },
            reasoning: {
              type: "string",
              description: "1–2 setninger som forklarer Laras vurdering",
            },
          },
          required: [
            "title",
            "description",
            "category",
            "criticality",
            "frameworks",
            "normativeRules",
            "suggestedMeasures",
            "reasoning",
          ],
        },
      },
    };

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContext },
          ],
          tools: [tool],
          tool_choice: {
            type: "function",
            function: { name: "propose_deviation" },
          },
        }),
      },
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({
            error: "For mange forespørsler. Prøv igjen om litt.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "Ingen AI-kreditt igjen. Legg til kreditter i arbeidsområdet.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "AI-feil" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Ingen forslag fra AI");
    const proposal = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ proposal }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-deviation error", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Ukjent feil",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
