import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      processName,
      processDescription,
      aiPurpose,
      aiFeatures,
      checklistSummary,
      affectedPersons,
      automatedDecisions,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Du er en compliance-rådgiver med spesialkompetanse på EU KI-forordningen (AI Act).
Du skal vurdere risikonivået for KI-bruk i en arbeidsprosess basert på informasjonen som gis.

KI-forordningens risikonivåer:
- "minimal": Ingen obligatoriske krav. KI brukes til enkle oppgaver uten innvirkning på personers rettigheter.
- "limited": Transparenskrav (Art. 50). Brukere må vite at de interagerer med KI. Typisk: chatboter, innholdsgenerering.
- "high": Strenge krav (Art. 6, Annex III). KI som påvirker helse, sikkerhet, grunnleggende rettigheter. Typisk: HR-screening, kredittvurdering, biometrisk identifikasjon, kritisk infrastruktur.
- "unacceptable": Forbudt (Art. 5). Sosial scoring, manipulering av sårbare grupper, sanntids ansiktsgjenkjenning i offentlig rom.

Vurder:
1. Hvem som berøres og hvordan
2. Om det tas automatiserte beslutninger med juridisk eller vesentlig effekt
3. Hvilke KI-funksjoner som brukes
4. Sjekklistesvarene (nei/vet ikke indikerer mangler)
5. Annex III-kategorier som kan være relevante

Svar med et JSON-objekt.`;

    const checklistInfo = checklistSummary
      ? `\nSjekklistesvar:\n${checklistSummary}`
      : "";

    const userPrompt = `Prosess: ${processName}
${processDescription ? `Beskrivelse: ${processDescription}` : ""}
${aiPurpose ? `Formål med KI: ${aiPurpose}` : ""}
KI-funksjoner: ${aiFeatures?.length > 0 ? aiFeatures.join(", ") : "Ikke spesifisert"}
Berørte personer: ${affectedPersons?.length > 0 ? affectedPersons.join(", ") : "Ikke spesifisert"}
Automatiserte beslutninger: ${automatedDecisions ? "Ja" : "Nei"}${checklistInfo}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_process_risk",
              description: "Suggest an AI Act risk level for a business process",
              parameters: {
                type: "object",
                properties: {
                  risk_category: {
                    type: "string",
                    enum: ["minimal", "limited", "high", "unacceptable"],
                    description: "The suggested risk category under the EU AI Act",
                  },
                  reasoning: {
                    type: "string",
                    description: "Kort begrunnelse på norsk (2-3 setninger) som refererer til relevante artikler",
                  },
                  key_factors: {
                    type: "array",
                    items: { type: "string" },
                    description: "Liste med 2-4 nøkkelfaktorer som påvirker risikovurderingen",
                  },
                },
                required: ["risk_category", "reasoning", "key_factors"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_process_risk" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit nådd. Prøv igjen om litt." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-kreditter brukt opp." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback
    const content = data.choices?.[0]?.message?.content || "";
    try {
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(
        JSON.stringify({
          risk_category: "limited",
          reasoning: "Kunne ikke analysere prosessen automatisk. Standard risikonivå er satt til begrenset.",
          key_factors: ["Automatisk vurdering feilet"],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("suggest-process-risk error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
