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
    const { processName, purpose, systemNames } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemContext = systemNames?.length
      ? `Tilknyttede systemer: ${systemNames.join(", ")}.`
      : "";

    const purposeContext = purpose?.trim()
      ? `Formål med AI-bruk: ${purpose}`
      : "";

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
                      description: "List of 4-6 AI feature names in Norwegian",
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
            {
              role: "system",
              content:
                "Du er Lara, en AI-assistent for compliance-dokumentasjon. Foreslå 4-6 konkrete, relevante AI-funksjoner for den gitte prosessen. Funksjonene skal være korte navn (2-4 ord) på norsk bokmål som beskriver spesifikke AI-kapasiteter. Eksempler: 'Automatisk dokumentklassifisering', 'Prediktiv risikoanalyse', 'Sentimentanalyse', 'Anomalideteksjon'. Ikke inkluder generiske funksjoner som ikke er relevante for prosessen.",
            },
            {
              role: "user",
              content: `Foreslå AI-funksjoner for prosessen "${processName}".
${purposeContext}
${systemContext}`.trim(),
            },
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
    
    // Extract from tool call response
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
      JSON.stringify({ error: e instanceof Error ? e.message : "Ukjent feil" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
