import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyName, industry, existingDescription, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isNorwegian = language === "nb";

    const systemPrompt = isNorwegian
      ? `Du er en profesjonell tekstforfatter spesialisert på virksomhetsbeskrivelser for compliance og digital tillit. Skriv korte, profesjonelle og tillitvekkende beskrivelser på 2-3 setninger som egner seg for en digital tillitsprofil (Trust Profile). Fokuser på virksomhetens formål, bransje og engasjement for sikkerhet og etterlevelse. Svar kun med selve beskrivelsen – ingen forklaringer, ingen introduksjon.`
      : `You are a professional copywriter specializing in business descriptions for compliance and digital trust. Write short, professional, and trust-inspiring descriptions of 2-3 sentences suitable for a Digital Trust Profile. Focus on the company's purpose, industry, and commitment to security and compliance. Reply only with the description itself – no explanations, no introduction.`;

    const userPrompt = isNorwegian
      ? `Skriv en virksomhetsbeskrivelse for: "${companyName}", bransje: "${industry || "generell"}"${existingDescription ? `\n\nEksisterende beskrivelse (forbedre denne):\n${existingDescription}` : ""}`
      : `Write a company description for: "${companyName}", industry: "${industry || "general"}"${existingDescription ? `\n\nExisting description (improve this):\n${existingDescription}` : ""}`;

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
        stream: false,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `AI gateway error: ${status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-company-description error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
