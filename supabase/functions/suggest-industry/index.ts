// Suggests a Norwegian industry description (NACE-like) for a company
// when BrReg cannot provide one. Only called as fallback.

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
    const { name, org_number, country_code } = await req.json();

    if (!name || typeof name !== "string") {
      return new Response(JSON.stringify({ error: "name required" }), {
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

    const systemPrompt = `Du er en bransjeekspert. Basert på virksomhetsnavn (og ev. org.nr og land) skal du gjette den mest sannsynlige bransjebeskrivelsen på norsk – i stil med NACE/SN2007-tekst.

Regler:
- Svar KUN med selve bransjebeskrivelsen, ingen forklaring.
- Maks 60 tegn.
- Norsk språk.
- Hvis navnet er helt intetsigende, svar "Ukjent bransje".
- Sett confidence: "medium" hvis navnet gir tydelig indikasjon (f.eks. "Regnskap", "Bygg", "IT"), ellers "low".

Returner strengt JSON: { "industry": "...", "confidence": "low"|"medium" }`;

    const userPrompt = `Virksomhet: ${name}\nOrg.nr: ${org_number || "ukjent"}\nLand: ${country_code || "NO"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI request failed", status: response.status }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    logAiUsage("suggest-industry", data);
    const content = data.choices?.[0]?.message?.content || "{}";
    let parsed: { industry?: string; confidence?: string } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    const industry = (parsed.industry || "").trim().slice(0, 60) || "Ukjent bransje";
    const confidence = parsed.confidence === "medium" ? "medium" : "low";

    return new Response(
      JSON.stringify({ industry, confidence, source: "ai_suggested" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("suggest-industry error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
