import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { work_area_id, system_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch work area info
    const { data: workArea } = await supabase
      .from("work_areas")
      .select("*")
      .eq("id", work_area_id)
      .single();

    // Fetch company profile for context
    const { data: companyProfile } = await supabase
      .from("company_profile")
      .select("*")
      .single();

    // Fetch systems in work area
    const { data: systems } = await supabase
      .from("systems")
      .select("id, name, description, category, vendor")
      .eq("work_area_id", work_area_id);

    // Fetch existing processes to avoid duplicates
    const systemIds = systems?.map(s => s.id) || [];
    const { data: existingProcesses } = await supabase
      .from("system_processes")
      .select("name, system_id")
      .in("system_id", systemIds.length > 0 ? systemIds : ['none']);

    const existingNames = existingProcesses?.map(p => p.name.toLowerCase()) || [];

    // Build context
    const industryContext = companyProfile?.industry || "generell virksomhet";
    const workAreaName = workArea?.name || "Ukjent arbeidsområde";
    const workAreaDesc = workArea?.description || "";
    
    const systemsList = systems?.map(s => `- ${s.name}${s.description ? `: ${s.description}` : ''}`).join("\n") || "Ingen systemer registrert";

    const systemPrompt = `Du er en ekspert på forretningsprosesser og IT-styring for norske virksomheter.

Du skal foreslå prosesser for arbeidsområdet "${workAreaName}" i selskapet ${companyProfile?.name || "Ukjent"}.

KONTEKST:
- Bransje: ${industryContext}
- Arbeidsområde: ${workAreaName}
${workAreaDesc ? `- Beskrivelse: ${workAreaDesc}` : ''}
- Systemer i bruk:
${systemsList}

FORESLÅ 5-8 PROSESSER som:
1. Er typiske for dette arbeidsområdet i bransjen
2. Bruker de registrerte systemene
3. Kan involvere AI-bruk (marker tydelig)
4. Er relevante for GDPR og AI Act compliance

VIKTIG: Ikke foreslå prosesser som allerede finnes: ${existingNames.join(", ") || "ingen"}

For hver prosess, vurder om AI kan være involvert (f.eks. automatisk beslutningsstøtte, analyse, chatbot, etc.)`;

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
          { role: "user", content: `Gi meg forslag til prosesser for arbeidsområdet "${workAreaName}".` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_processes",
              description: "Return process suggestions for a work area",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Process name in Norwegian" },
                        description: { type: "string", description: "Brief description of the process" },
                        likely_has_ai: { type: "boolean", description: "Whether this process likely uses AI" },
                        ai_use_description: { type: "string", description: "How AI might be used if applicable" },
                        related_systems: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Names of systems from the list that are likely involved"
                        },
                        data_types: {
                          type: "array",
                          items: { type: "string" },
                          description: "Types of personal data likely processed"
                        },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        reason: { type: "string", description: "Why this process is relevant" }
                      },
                      required: ["name", "description", "likely_has_ai", "related_systems", "priority", "reason"]
                    }
                  }
                },
                required: ["suggestions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_processes" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, prøv igjen senere." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kreditt oppbrukt, vennligst legg til kreditt." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({
        suggestions: result.suggestions,
        work_area: workAreaName,
        systems: systems?.map(s => ({ id: s.id, name: s.name })) || []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ suggestions: [], error: "No suggestions generated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("suggest-processes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
