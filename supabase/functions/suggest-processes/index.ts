import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { work_area_id, system_id, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isNorwegian = language === "nb";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: workArea } = await supabase
      .from("work_areas")
      .select("*")
      .eq("id", work_area_id)
      .single();

    const { data: companyProfile } = await supabase
      .from("company_profile")
      .select("*")
      .single();

    const { data: systems } = await supabase
      .from("systems")
      .select("id, name, description, category, vendor")
      .eq("work_area_id", work_area_id);

    const systemIds = systems?.map(s => s.id) || [];
    const { data: existingProcesses } = await supabase
      .from("system_processes")
      .select("name, system_id")
      .in("system_id", systemIds.length > 0 ? systemIds : ['none']);

    const existingNames = existingProcesses?.map(p => p.name.toLowerCase()) || [];

    const industryContext = companyProfile?.industry || (isNorwegian ? "generell virksomhet" : "general business");
    const workAreaName = workArea?.name || (isNorwegian ? "Ukjent arbeidsområde" : "Unknown work area");
    const workAreaDesc = workArea?.description || "";
    
    const systemsList = systems?.map(s => `- ${s.name}${s.description ? `: ${s.description}` : ''}`).join("\n") || (isNorwegian ? "Ingen systemer registrert" : "No systems registered");

    const systemPrompt = isNorwegian
      ? `Du er en ekspert på forretningsprosesser og IT-styring for norske virksomheter.

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

For hver prosess, vurder om AI kan være involvert (f.eks. automatisk beslutningsstøtte, analyse, chatbot, etc.)`
      : `You are an expert in business processes and IT governance.

You should suggest processes for the work area "${workAreaName}" in the company ${companyProfile?.name || "Unknown"}.

CONTEXT:
- Industry: ${industryContext}
- Work area: ${workAreaName}
${workAreaDesc ? `- Description: ${workAreaDesc}` : ''}
- Systems in use:
${systemsList}

SUGGEST 5-8 PROCESSES that:
1. Are typical for this work area in the industry
2. Use the registered systems
3. May involve AI usage (mark clearly)
4. Are relevant for GDPR and AI Act compliance

IMPORTANT: Do not suggest processes that already exist: ${existingNames.join(", ") || "none"}

For each process, assess whether AI may be involved (e.g. automated decision support, analysis, chatbot, etc.)`;

    const userMessage = isNorwegian
      ? `Gi meg forslag til prosesser for arbeidsområdet "${workAreaName}".`
      : `Give me process suggestions for the work area "${workAreaName}".`;

    const nameDesc = isNorwegian ? "Process name in Norwegian" : "Process name in English";
    const descDesc = isNorwegian ? "Brief description of the process in Norwegian" : "Brief description of the process in English";
    const aiUseDesc = isNorwegian ? "How AI might be used if applicable, in Norwegian" : "How AI might be used if applicable, in English";
    const reasonDesc = isNorwegian ? "Why this process is relevant, in Norwegian" : "Why this process is relevant, in English";

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
          { role: "user", content: userMessage },
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
                        name: { type: "string", description: nameDesc },
                        description: { type: "string", description: descDesc },
                        likely_has_ai: { type: "boolean", description: "Whether this process likely uses AI" },
                        ai_use_description: { type: "string", description: aiUseDesc },
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
                        reason: { type: "string", description: reasonDesc }
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
        return new Response(JSON.stringify({ error: isNorwegian ? "Rate limits exceeded, prøv igjen senere." : "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: isNorwegian ? "Kreditt oppbrukt, vennligst legg til kreditt." : "Credits exhausted, please add credits." }), {
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
