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
    const { processName, existingPurpose, systemNames, aiFeatures } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemContext = systemNames?.length
      ? `Tilknyttede systemer: ${systemNames.join(", ")}.`
      : "";
    const featureContext = aiFeatures?.length
      ? `AI-funksjoner i bruk: ${aiFeatures.join(", ")}.`
      : "";

    let userPrompt: string;
    if (existingPurpose?.trim()) {
      userPrompt = `Forbedre og omformuler denne formålsbeskrivelsen for AI-bruk i prosessen "${processName}":

"${existingPurpose}"

${systemContext}
${featureContext}

Gjør teksten mer presis, profesjonell og tilpasset compliance-dokumentasjon. Behold kjerneinnholdet men forbedre formuleringen. Svar KUN med den forbedrede teksten, ingen innledning eller forklaring.`;
    } else {
      userPrompt = `Skriv en kort formålsbeskrivelse (2-4 setninger) for bruk av AI i prosessen "${processName}".

${systemContext}
${featureContext}

Beskrivelsen skal være på norsk, presis og tilpasset compliance-dokumentasjon (f.eks. AI Act, GDPR). Forklar hva AI brukes til og hvorfor. Svar KUN med beskrivelsen, ingen innledning eller forklaring.`;
    }

    const response = await fetch(
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
            {
              role: "system",
              content:
                "Du er Lara, en AI-assistent som hjelper med compliance-dokumentasjon. Du skriver korte, presise formålsbeskrivelser for AI-bruk i forretningsprosesser. Skriv alltid på norsk bokmål. Aldri inkluder innledninger som 'Her er...' – skriv kun selve beskrivelsen.",
            },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "For mange forespørsler. Prøv igjen om litt." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kreditt oppbrukt. Legg til mer i Lovable-innstillinger." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Kunne ikke generere forslag." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const purpose = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ purpose }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-ai-purpose error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Ukjent feil" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
