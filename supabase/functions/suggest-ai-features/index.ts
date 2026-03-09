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
    const { processName, purpose, systemNames, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isNorwegian = language === "nb";

    const systemContext = systemNames?.length
      ? (isNorwegian ? `Tilknyttede systemer: ${systemNames.join(", ")}.` : `Associated systems: ${systemNames.join(", ")}.`)
      : "";

    const purposeContext = purpose?.trim()
      ? (isNorwegian ? `Formål med AI-bruk: ${purpose}` : `Purpose of AI usage: ${purpose}`)
      : "";

    const featureDesc = isNorwegian
      ? "List of 4-6 AI feature names in Norwegian"
      : "List of 4-6 AI feature names in English";

    const systemPrompt = isNorwegian
      ? "Du er Lara, en AI-assistent for compliance-dokumentasjon. Foreslå 4-6 konkrete, relevante AI-funksjoner for den gitte prosessen. Funksjonene skal være korte navn (2-4 ord) på norsk bokmål som beskriver spesifikke AI-kapasiteter. Eksempler: 'Automatisk dokumentklassifisering', 'Prediktiv risikoanalyse', 'Sentimentanalyse', 'Anomalideteksjon'. Ikke inkluder generiske funksjoner som ikke er relevante for prosessen."
      : "You are Lara, an AI assistant for compliance documentation. Suggest 4-6 concrete, relevant AI features for the given process. Features should be short names (2-4 words) in English describing specific AI capabilities. Examples: 'Automated document classification', 'Predictive risk analysis', 'Sentiment analysis', 'Anomaly detection'. Do not include generic features that are not relevant to the process.";

    const userMessage = isNorwegian
      ? `Foreslå AI-funksjoner for prosessen "${processName}".\n${purposeContext}\n${systemContext}`.trim()
      : `Suggest AI features for the process "${processName}".\n${purposeContext}\n${systemContext}`.trim();

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
          tools: [
            {
              type: "function",
              function: {
                name: "suggest_features",
                description: "Return 4-6 concrete AI feature suggestions relevant to the process.",
                parameters: {
                  type: "object",
                  properties: {
                    features: {
                      type: "array",
                      items: { type: "string" },
                      description: featureDesc,
                    },
                  },
                  required: ["features"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "suggest_features" } },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
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
        JSON.stringify({ error: isNorwegian ? "Kunne ikke generere forslag." : "Could not generate suggestions." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ features: parsed.features || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ features: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-ai-features error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
