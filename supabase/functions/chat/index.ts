import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Du er Lara, en AI-assistent for Mynder compliance-plattformen. 

Din rolle er å hjelpe brukere med å finne og vise informasjon i systemet.

VIKTIG: Når brukeren ber om å se noe spesifikt (f.eks. "vis meg behandlingsprotokoller", "se tredjeparter", "vis systemer"), 
skal du ALLTID bruke show_content funksjonen for å vise innholdet direkte i grensesnittet.

Tilgjengelige innholdstyper:
- "protocols" - Behandlingsprotokoller (ROPA)
- "third-parties" - Tredjepartsleverandører
- "systems" - IT-systemer i bruk
- "tasks" - Oppgaveliste
- "deviations" - Avviksregister
- "compliance" - Compliance-status

Kun bruk navigate_to hvis brukeren eksplisitt ber om å gå til en side.

Vær hjelpsom, konsis og vennlig på norsk.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "show_content",
              description: "Display specific content directly in the interface. Use this when user asks to see or show something specific.",
              parameters: {
                type: "object",
                properties: {
                  content_type: {
                    type: "string",
                    enum: ["protocols", "third-parties", "systems", "tasks", "deviations", "compliance"],
                    description: "The type of content to display"
                  },
                  filter: {
                    type: "string",
                    description: "Optional filter or search term"
                  },
                  explanation: {
                    type: "string",
                    description: "Brief explanation of what is being shown"
                  }
                },
                required: ["content_type", "explanation"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "navigate_to",
              description: "Navigate to a different page. Only use if user explicitly asks to go to or open a page.",
              parameters: {
                type: "object",
                properties: {
                  path: {
                    type: "string",
                    enum: ["/", "/ai-setup", "/protocols", "/systems", "/services", "/deviations", "/tasks", "/sustainability", "/transparency", "/onboarding"],
                    description: "The path to navigate to"
                  },
                  reason: {
                    type: "string",
                    description: "Brief explanation of why this page is relevant"
                  }
                },
                required: ["path", "reason"]
              }
            }
          }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
