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

Din rolle er å hjelpe brukere med å navigere og finne informasjon i systemet.

Tilgjengelige sider og funksjoner:
- Dashboard (/) - Oversikt over compliance status
- AI-agent (/ai-setup) - AI-agentinnstillinger
- Behandlingsprotokoller (/protocols) - ROPA dokumentasjon
- Systemer (/systems) - Systemoversikt
- Tjenesteområder (/services) - Tjenesteoversikt
- Avviksregister (/deviations) - Compliance avvik
- Mine oppgaver (/tasks) - Oppgaveliste
- Bærekraft (/sustainability) - Bærekraftsrapportering
- Åpenhetsloven (/transparency) - Åpenhetsloven compliance
- Onboarding (/onboarding) - Organisasjonsoppsett

Når brukeren spør om noe, skal du:
1. Forstå hva de leter etter
2. Foreslå relevant side eller funksjonalitet
3. Bruk navigate_to funksjonen for å sende dem til riktig sted

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
              name: "navigate_to",
              description: "Navigate the user to a specific page in the application",
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
