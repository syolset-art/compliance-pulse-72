import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { systemName, searchWeb } = await req.json();

    if (!systemName) {
      return new Response(JSON.stringify({ error: "systemName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Search Trust Engine (system_templates table)
    const { data: templates } = await supabase
      .from("system_templates")
      .select("*")
      .ilike("name", `%${systemName}%`);

    if (templates && templates.length > 0 && !searchWeb) {
      return new Response(JSON.stringify({
        source: "trust_engine",
        results: templates.map((t: any) => ({
          name: t.name,
          description: t.description,
          category: t.category,
          vendor: t.vendor,
          has_ai: t.has_ai,
          ai_features: t.ai_features,
          work_area_type: t.work_area_type,
        })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: No match in Trust Engine → use AI to research the system
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Du er en compliance- og IT-ekspert. Brukeren ønsker å registrere systemet "${systemName}".

Gi følgende informasjon basert på din kunnskap:
1. Offisielt navn på systemet/produktet
2. Leverandør/produsent
3. Kort beskrivelse av hva systemet gjør (maks 2 setninger, på norsk)
4. Foreslått kategori
5. Om systemet bruker AI
6. Hvilken type data systemet typisk behandler
7. Land/region leverandøren er basert i
8. Om systemet typisk er en databehandler under GDPR

Svar ved å kalle lookup_system-funksjonen.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du er en compliance- og IT-ekspert som hjelper med å kartlegge IT-systemer for compliance-formål." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "lookup_system",
              description: "Return system information lookup results",
              parameters: {
                type: "object",
                properties: {
                  official_name: {
                    type: "string",
                    description: "Official name of the system/product",
                  },
                  vendor: {
                    type: "string",
                    description: "Vendor/manufacturer name",
                  },
                  description: {
                    type: "string",
                    description: "Short description in Norwegian (max 2 sentences)",
                  },
                  suggested_category: {
                    type: "string",
                    enum: ["crm", "erp", "hr", "productivity", "communication", "storage", "security", "monitoring", "finance", "marketing", "e-commerce", "project_management", "development", "analytics", "other"],
                    description: "Suggested system category",
                  },
                  category_reason: {
                    type: "string",
                    description: "Brief reason for category suggestion in Norwegian",
                  },
                  has_ai: {
                    type: "boolean",
                    description: "Whether the system uses AI features",
                  },
                  ai_features: {
                    type: "string",
                    description: "Description of AI features if any, in Norwegian",
                  },
                  data_types: {
                    type: "array",
                    items: { type: "string" },
                    description: "Types of data the system typically processes",
                  },
                  vendor_country: {
                    type: "string",
                    description: "Country/region where vendor is based",
                  },
                  is_data_processor: {
                    type: "boolean",
                    description: "Whether the system typically acts as a data processor under GDPR",
                  },
                  gdpr_note: {
                    type: "string",
                    description: "Brief GDPR relevance note in Norwegian",
                  },
                  confidence: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Confidence level of the lookup result",
                  },
                },
                required: ["official_name", "vendor", "description", "suggested_category", "category_reason", "has_ai", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "lookup_system" } },
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
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({
        source: "web_lookup",
        result,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "No result returned" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lookup-system error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
