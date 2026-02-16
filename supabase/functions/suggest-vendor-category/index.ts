import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { vendorName, description, industry, country } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Du er en compliance-ekspert. Basert på følgende leverandørinformasjon, foreslå:
1. En kort beskrivelse av leverandøren (maks 2 setninger, på norsk)
2. Leverandørtype
3. GDPR-rolle

Leverandørinformasjon:
- Navn: ${vendorName}
${description ? `- Brukerens beskrivelse: ${description}` : ""}
${industry ? `- Bransje: ${industry}` : ""}
${country ? `- Land: ${country}` : ""}

Svar ved å kalle suggest_vendor_category-funksjonen.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du er en compliance-ekspert som klassifiserer leverandører." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_vendor_category",
              description: "Return vendor categorization suggestions",
              parameters: {
                type: "object",
                properties: {
                  suggested_description: {
                    type: "string",
                    description: "Short description of the vendor in Norwegian (max 2 sentences)",
                  },
                  vendor_category: {
                    type: "string",
                    enum: ["saas", "infrastructure", "consulting", "it_operations", "facilities", "other"],
                    description: "The suggested vendor category",
                  },
                  vendor_category_reason: {
                    type: "string",
                    description: "Brief reason for the suggestion in Norwegian (1 sentence)",
                  },
                  gdpr_role: {
                    type: "string",
                    enum: ["databehandler", "underdatabehandler", "ingen"],
                    description: "The suggested GDPR role",
                  },
                  gdpr_role_reason: {
                    type: "string",
                    description: "Brief reason for the GDPR role suggestion in Norwegian (1 sentence)",
                  },
                },
                required: ["suggested_description", "vendor_category", "vendor_category_reason", "gdpr_role", "gdpr_role_reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_vendor_category" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const suggestion = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(suggestion), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "No suggestion returned" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-vendor-category error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
