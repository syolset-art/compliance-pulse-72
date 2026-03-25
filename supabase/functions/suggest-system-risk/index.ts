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
    const { systemName, vendor, category, description, hasAi } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Du er en sikkerhetsrådgiver som vurderer risikonivå for IT-systemer i en virksomhet.
Basert på informasjonen om systemet, vurder risikonivået og gi en kort begrunnelse på norsk.

Vurder følgende faktorer:
- Typen data systemet behandler (personopplysninger, finansdata, helseopplysninger etc.)
- Systemets rolle i virksomheten (kritisk infrastruktur vs. støtteverktøy)
- Leverandørens lokasjon og omdømme
- Om systemet bruker AI/maskinlæring
- Potensielle konsekvenser ved databrudd eller nedetid

Svar ALLTID med et JSON-objekt med denne strukturen:
{ "risk_level": "low" | "medium" | "high" | "critical", "reasoning": "kort begrunnelse (1-2 setninger)" }`;

    const userPrompt = `System: ${systemName}
Leverandør: ${vendor || "Ukjent"}
Kategori: ${category || "Ukjent"}
Beskrivelse: ${description || "Ingen beskrivelse"}
Bruker AI: ${hasAi ? "Ja" : "Nei/ukjent"}`;

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
              name: "suggest_risk",
              description: "Suggest a risk level for the system",
              parameters: {
                type: "object",
                properties: {
                  risk_level: {
                    type: "string",
                    enum: ["low", "medium", "high", "critical"],
                  },
                  reasoning: {
                    type: "string",
                    description: "Short reasoning in Norwegian (1-2 sentences)",
                  },
                },
                required: ["risk_level", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_risk" } },
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

    // Fallback: try parsing from content
    const content = data.choices?.[0]?.message?.content || "";
    try {
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(
        JSON.stringify({ risk_level: "medium", reasoning: "Kunne ikke analysere systemet automatisk." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("suggest-system-risk error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
