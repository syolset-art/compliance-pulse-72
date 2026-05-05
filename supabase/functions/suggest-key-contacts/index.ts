import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const roleDescriptions: Record<string, string> = {
  compliance: "compliance-ansvarlig (oppfølging av etterlevelse og kontroller)",
  dpo: "personvernombud (DPO) eller personvernansvarlig",
  ciso: "sikkerhetskontakt for hendelser (CISO eller incident-team)",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { role, companyName, industry, employees, domain } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const roleDesc = roleDescriptions[role] || roleDescriptions.compliance;
    const safeDomain = (domain || "selskapet.no").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const fallbackEmailPrefix = role === "dpo" ? "personvern" : role === "ciso" ? "sikkerhet" : "compliance";

    const systemPrompt = `Du er Lara, en AI-assistent som hjelper norske organisasjoner med å fylle ut kontaktinformasjon i et compliance-verktøy. Du foreslår en plausibel placeholder-kontakt basert på selskapsdata når brukeren ikke har registrert noen ennå. Du finner ALDRI på ekte personer — bruk generiske placeholder-navn (f.eks. "Ikke utnevnt", "Compliance Team") og en domenebasert e-postadresse. Svar alltid på norsk.`;

    const userPrompt = `Foreslå en placeholder for rollen ${roleDesc} hos selskapet "${companyName || "(ukjent)"}".

Kontekst:
- Bransje: ${industry || "ukjent"}
- Antall ansatte: ${employees || "ukjent"}
- Domene: ${safeDomain}

Bruk e-post-format som ${fallbackEmailPrefix}@${safeDomain}. Bruk navn som "Compliance Team", "Personvernteam", "Sikkerhetsansvarlig" e.l. Forklar kort at dette er et forslag som bør erstattes med en faktisk person.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_contact",
            description: "Returnerer et placeholder-kontaktforslag",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Navn eller team-betegnelse" },
                email: { type: "string", description: "E-postadresse" },
                rationale: { type: "string", description: "Kort forklaring (1-2 setninger)" },
              },
              required: ["name", "email", "rationale"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_contact" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit nådd, prøv igjen om litt." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-kreditter er tomme. Legg til kreditter i arbeidsområdet." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!args) {
      return new Response(JSON.stringify({
        name: role === "dpo" ? "Personvernteam" : role === "ciso" ? "Sikkerhetsansvarlig" : "Compliance Team",
        email: `${fallbackEmailPrefix}@${safeDomain}`,
        rationale: "Forslag basert på domene. Erstatt med en faktisk person.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("suggest-key-contacts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
