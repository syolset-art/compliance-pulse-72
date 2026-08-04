import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logAiUsage } from "../_shared/ai-usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { assetId } = await req.json();
    if (!assetId) {
      return new Response(JSON.stringify({ error: "assetId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [{ data: documents }, { data: frameworks }, { data: asset }] = await Promise.all([
      supabase
        .from("vendor_documents")
        .select("file_name, document_type, valid_to, created_at")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("selected_frameworks")
        .select("framework_name")
        .eq("is_selected", true),
      supabase.from("assets").select("id, name, metadata").eq("id", assetId).maybeSingle(),
    ]);

    if (!documents || documents.length === 0) {
      return new Response(JSON.stringify({ error: "Ingen dokumenter å analysere" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const frameworkList = (frameworks || []).map((f: any) => f.framework_name).join(", ") || "GDPR";

    const systemPrompt = `Du er Lara, en compliance-ekspert. Vurder om en virksomhets opplastede compliance-dokumentasjon er tilstrekkelig i henhold til pålagte rammeverk. Vær konkret og handlingsrettet. Svar på norsk.`;

    const userPrompt = `Pålagte rammeverk: ${frameworkList}

Opplastede dokumenter:
${documents.map((d: any, i: number) => `${i + 1}. ${d.file_name} (type: ${d.document_type}${d.valid_to ? `, gyldig til ${d.valid_to}` : ""})`).join("\n")}

Vurder om dokumentasjonen dekker kravene. Identifiser hull og foreslå oppdateringer.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_gap_analysis",
              description: "Rapporter gap-analyse av dokumentasjon",
              parameters: {
                type: "object",
                properties: {
                  overallStatus: {
                    type: "string",
                    enum: ["sufficient", "needs_improvement", "significant_gaps"],
                  },
                  summary: { type: "string", description: "Én setning som oppsummerer status" },
                  findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        documentName: { type: "string" },
                        coversRequirement: { type: "string", description: "Hvilket krav dokumentet dekker, f.eks. 'GDPR Art. 28'" },
                        coverage: { type: "string", enum: ["full", "partial", "outdated", "insufficient"] },
                        recommendation: { type: "string" },
                      },
                      required: ["documentName", "coversRequirement", "coverage", "recommendation"],
                    },
                  },
                  missingDocuments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        requirement: { type: "string" },
                        framework: { type: "string" },
                        recommendation: { type: "string" },
                      },
                      required: ["requirement", "framework", "recommendation"],
                    },
                  },
                },
                required: ["overallStatus", "summary", "findings", "missingDocuments"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_gap_analysis" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI-analyse feilet", status: aiRes.status }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    logAiUsage("analyze-doc-gap", aiData);
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!result) {
      return new Response(JSON.stringify({ error: "Tomt AI-svar" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analyzed_at = new Date().toISOString();
    if (asset) {
      const nextMeta = { ...(asset.metadata || {}), doc_gap_analysis: { result, analyzed_at } };
      await supabase.from("assets").update({ metadata: nextMeta }).eq("id", assetId);
    }

    return new Response(JSON.stringify({ result, analyzed_at }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
