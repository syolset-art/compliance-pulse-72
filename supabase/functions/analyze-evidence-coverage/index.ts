// Analyzes an uploaded evidence document against a specific requirement's
// list of articles/control points, and returns which are covered and which
// are missing. Also detects whether the document is signed (which only
// strengthens the trust tier — it does NOT affect the compliance score).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { logAiUsage } from "../_shared/ai-usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      documentText,
      fileName,
      requirementId,
      requirementName,
      requirementDescription,
      coveredArticles,
    } = await req.json();

    if (!documentText) {
      return new Response(JSON.stringify({ error: "documentText required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const articleList: string[] = Array.isArray(coveredArticles) ? coveredArticles : [];

    const systemPrompt = `Du er Lara, en compliance-ekspert som analyserer om et opplastet bevis dekker kravet fra et regelverk.

Oppgaven din:
1. Vurder om dokumentet dekker HVER av kravets artikler/punkter (returner både dekt og manglende).
2. Oppdag om dokumentet er signert (digital signatur, håndsignatur, godkjenner nevnt eksplisitt).
3. Signatur påvirker IKKE score — den forsterker kun tillitsgrad. Vær ærlig.
4. Returner en dekningsratio 0..1 og en kort norsk oppsummering.

Vær konservativ: hvis dokumentet bare NEVNER en artikkel, men ikke beskriver hvordan den er ivaretatt, marker som IKKE dekket.

Dagens dato: ${new Date().toISOString().split("T")[0]}.`;

    const userPrompt = `Krav: ${requirementName ?? requirementId ?? "(ukjent)"}
${requirementDescription ? `Beskrivelse: ${requirementDescription}\n` : ""}
Artikler/punkter kravet skal dekke:
${articleList.length > 0 ? articleList.map((a) => `- ${a}`).join("\n") : "(ingen eksplisitt liste — vurder hele kravet som én enhet)"}

Filnavn: ${fileName ?? "(ukjent)"}

Dokumentinnhold:
${String(documentText).substring(0, 12000)}

Analyser dekningen.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              name: "report_coverage",
              description: "Rapporter dekningsanalyse for kravet.",
              parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                  coveredArticles: {
                    type: "array",
                    items: { type: "string" },
                    description: "Artikler AI mener dokumentet dekker.",
                  },
                  missingArticles: {
                    type: "array",
                    items: { type: "string" },
                    description: "Artikler dokumentet ikke dekker.",
                  },
                  coverageRatio: {
                    type: "number",
                    description: "0..1. Andel av kravets artikler som er dekket.",
                  },
                  confidence: { type: "number" },
                  docType: { type: "string" },
                  summary: { type: "string" },
                  signature: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      isSigned: { type: "boolean" },
                      signedBy: { type: "string" },
                      signedAt: { type: "string" },
                      issuer: { type: "string" },
                    },
                    required: ["isSigned"],
                  },
                },
                required: [
                  "coveredArticles",
                  "missingArticles",
                  "coverageRatio",
                  "confidence",
                  "summary",
                  "signature",
                ],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_coverage" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI call failed", status: aiResponse.status }), {
        status: aiResponse.status === 429 || aiResponse.status === 402 ? aiResponse.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResponse.json();
    logAiUsage("analyze-evidence-coverage", aiJson);
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No coverage returned" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const coverage = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ coverage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-evidence-coverage error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
