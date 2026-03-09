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
    const { processName, existingPurpose, systemNames, aiFeatures, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isNorwegian = language === "nb";

    const systemContext = systemNames?.length
      ? (isNorwegian ? `Tilknyttede systemer: ${systemNames.join(", ")}.` : `Associated systems: ${systemNames.join(", ")}.`)
      : "";
    const featureContext = aiFeatures?.length
      ? (isNorwegian ? `AI-funksjoner i bruk: ${aiFeatures.join(", ")}.` : `AI features in use: ${aiFeatures.join(", ")}.`)
      : "";

    let userPrompt: string;
    if (existingPurpose?.trim()) {
      userPrompt = isNorwegian
        ? `Forbedre og omformuler denne formålsbeskrivelsen for AI-bruk i prosessen "${processName}":\n\n"${existingPurpose}"\n\n${systemContext}\n${featureContext}\n\nGjør teksten mer presis, profesjonell og tilpasset compliance-dokumentasjon. Behold kjerneinnholdet men forbedre formuleringen. Svar KUN med den forbedrede teksten, ingen innledning eller forklaring.`
        : `Improve and rephrase this purpose description for AI usage in the process "${processName}":\n\n"${existingPurpose}"\n\n${systemContext}\n${featureContext}\n\nMake the text more precise, professional, and suitable for compliance documentation. Keep the core content but improve the wording. Reply ONLY with the improved text, no introduction or explanation.`;
    } else {
      userPrompt = isNorwegian
        ? `Skriv en kort formålsbeskrivelse (2-4 setninger) for bruk av AI i prosessen "${processName}".\n\n${systemContext}\n${featureContext}\n\nBeskrivelsen skal være på norsk, presis og tilpasset compliance-dokumentasjon (f.eks. AI Act, GDPR). Forklar hva AI brukes til og hvorfor. Svar KUN med beskrivelsen, ingen innledning eller forklaring.`
        : `Write a short purpose description (2-4 sentences) for the use of AI in the process "${processName}".\n\n${systemContext}\n${featureContext}\n\nThe description should be in English, precise, and suitable for compliance documentation (e.g. AI Act, GDPR). Explain what AI is used for and why. Reply ONLY with the description, no introduction or explanation.`;
    }

    const systemPrompt = isNorwegian
      ? "Du er Lara, en AI-assistent som hjelper med compliance-dokumentasjon. Du skriver korte, presise formålsbeskrivelser for AI-bruk i forretningsprosesser. Skriv alltid på norsk bokmål. Aldri inkluder innledninger som 'Her er...' – skriv kun selve beskrivelsen."
      : "You are Lara, an AI assistant helping with compliance documentation. You write short, precise purpose descriptions for AI usage in business processes. Always write in English. Never include introductions like 'Here is...' – write only the description itself.";

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
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: isNorwegian ? "For mange forespørsler. Prøv igjen om litt." : "Too many requests. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: isNorwegian ? "Kreditt oppbrukt. Legg til mer i Lovable-innstillinger." : "Credits exhausted. Please add more in Lovable settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: isNorwegian ? "Kunne ikke generere forslag." : "Could not generate suggestion." }),
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
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
