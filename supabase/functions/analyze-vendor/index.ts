import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { assetId, assetName } = await req.json();
    if (!assetId) throw new Error("assetId required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch vendor documents
    const { data: docs, error: docError } = await supabase
      .from("vendor_documents")
      .select("*")
      .eq("asset_id", assetId);
    if (docError) throw docError;

    if (!docs || docs.length === 0) {
      return new Response(JSON.stringify({ error: "No documents found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build document summary for AI
    const docSummary = docs
      .map((d: any) => `- ${d.file_name} (Type: ${d.document_type}${d.notes ? `, Notes: ${d.notes}` : ""})`)
      .join("\n");

    const systemPrompt = `You are a vendor compliance analyst. You analyze third-party vendors based on their documentation and assess compliance across four categories: security, data_handling, privacy, and availability.

Return your analysis using the provided tool. Be specific and actionable in your findings. Scores should be 0-100 where 100 is fully compliant.`;

    const userPrompt = `Analyze the vendor "${assetName || "Unknown Vendor"}" based on the following uploaded documents:

${docSummary}

Based on the document types and metadata, provide:
1. An overall compliance score (0-100)
2. Scores per category (security, data_handling, privacy, availability)
3. 3-5 key findings or recommendations`;

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
              name: "submit_vendor_analysis",
              description: "Submit the structured vendor compliance analysis",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { type: "number", description: "Overall compliance score 0-100" },
                  category_scores: {
                    type: "object",
                    properties: {
                      security: { type: "number" },
                      data_handling: { type: "number" },
                      privacy: { type: "number" },
                      availability: { type: "number" },
                    },
                    required: ["security", "data_handling", "privacy", "availability"],
                    additionalProperties: false,
                  },
                  findings: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 key findings or recommendations",
                  },
                },
                required: ["overall_score", "category_scores", "findings"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_vendor_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const analysisData = JSON.parse(toolCall.function.arguments);

    // Store analysis
    const { error: insertError } = await supabase.from("vendor_analyses").insert({
      asset_id: assetId,
      overall_score: analysisData.overall_score,
      category_scores: analysisData.category_scores,
      analysis_result: { findings: analysisData.findings },
      source_documents: docs.map((d: any) => d.id),
    });
    if (insertError) throw insertError;

    // Update asset compliance_score
    await supabase
      .from("assets")
      .update({ compliance_score: analysisData.overall_score })
      .eq("id", assetId);

    return new Response(JSON.stringify({ success: true, ...analysisData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-vendor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
