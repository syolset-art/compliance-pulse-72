import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AssetSuggestion {
  name: string;
  description: string | null;
  vendor: string | null;
  has_ai: boolean;
  reason: string;
  source: "template" | "ai_suggestion";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { work_area_name, work_area_description } = await req.json();
    
    if (!work_area_name) {
      return new Response(
        JSON.stringify({ error: "work_area_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Suggesting assets for work area:", work_area_name);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get company profile for industry context
    const { data: companyProfile } = await supabase
      .from("company_profile")
      .select("industry, name")
      .single();

    const industry = companyProfile?.industry || "general";
    const companyName = companyProfile?.name || "";

    // Get matching system templates
    const { data: templates } = await supabase
      .from("system_templates")
      .select("*")
      .or(`work_area_type.ilike.%${work_area_name}%,work_area_type.eq.${mapWorkAreaToType(work_area_name)}`);

    const templateAssets: AssetSuggestion[] = (templates || []).map((t: any) => ({
      name: t.name,
      description: t.description,
      vendor: t.vendor,
      has_ai: t.likely_has_ai || false,
      reason: `Standard system for ${work_area_name}`,
      source: "template" as const,
    }));

    // Get AI suggestions using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let aiSuggestions: AssetSuggestion[] = [];

    if (LOVABLE_API_KEY) {
      try {
        const systemPrompt = `Du er en ekspert på IT-systemer og forretningsapplikasjoner. 
Du skal foreslå relevante systemer/eiendeler for et arbeidsområde i en norsk virksomhet.
Returner forslag som JSON via tool_calls.`;

        const userPrompt = `Virksomhet: ${companyName}
Bransje: ${industry}
Arbeidsområde: ${work_area_name}
${work_area_description ? `Beskrivelse: ${work_area_description}` : ""}

Foreslå 3-5 relevante IT-systemer eller applikasjoner som typisk brukes i dette arbeidsområdet.
Fokuser på vanlige systemer i norske virksomheter.`;

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
                  name: "suggest_systems",
                  description: "Return system suggestions for the work area",
                  parameters: {
                    type: "object",
                    properties: {
                      suggestions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string", description: "System name" },
                            description: { type: "string", description: "Brief description" },
                            vendor: { type: "string", description: "Vendor name if known" },
                            has_ai: { type: "boolean", description: "Whether the system uses AI" },
                            reason: { type: "string", description: "Why this system is relevant" },
                          },
                          required: ["name", "description", "reason"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["suggestions"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "suggest_systems" } },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
          
          if (toolCall?.function?.arguments) {
            const parsed = JSON.parse(toolCall.function.arguments);
            aiSuggestions = (parsed.suggestions || []).map((s: any) => ({
              name: s.name,
              description: s.description || null,
              vendor: s.vendor || null,
              has_ai: s.has_ai || false,
              reason: s.reason,
              source: "ai_suggestion" as const,
            }));
          }
        } else {
          console.error("AI API error:", response.status, await response.text());
        }
      } catch (aiError) {
        console.error("AI suggestion error:", aiError);
      }
    }

    // Filter out duplicates (prefer templates over AI suggestions)
    const templateNames = new Set(templateAssets.map(t => t.name.toLowerCase()));
    const uniqueAiSuggestions = aiSuggestions.filter(
      s => !templateNames.has(s.name.toLowerCase())
    );

    return new Response(
      JSON.stringify({
        template_assets: templateAssets,
        ai_suggestions: uniqueAiSuggestions,
        work_area_type: mapWorkAreaToType(work_area_name),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in suggest-work-area-assets:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function mapWorkAreaToType(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("hr") || lowerName.includes("personal")) return "HR";
  if (lowerName.includes("it") || lowerName.includes("informasjon")) return "IT";
  if (lowerName.includes("økonomi") || lowerName.includes("finans")) return "Finance";
  if (lowerName.includes("ledelse") || lowerName.includes("management")) return "Management";
  if (lowerName.includes("salg") || lowerName.includes("marked")) return "Sales";
  if (lowerName.includes("kunde") || lowerName.includes("service")) return "CustomerService";
  if (lowerName.includes("produksjon") || lowerName.includes("lager")) return "Production";
  if (lowerName.includes("innkjøp") || lowerName.includes("leverandør")) return "Procurement";
  if (lowerName.includes("kvalitet")) return "Quality";
  if (lowerName.includes("hms") || lowerName.includes("sikkerhet")) return "HSE";
  
  return "General";
}
