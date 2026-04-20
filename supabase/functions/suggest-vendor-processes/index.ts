import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { vendorName, vendorCategory, vendorDescription, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isNb = language !== "en";

    // Fetch industry context
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: companyProfile } = await supabase
      .from("company_profile")
      .select("industry, name")
      .maybeSingle();

    const industry = companyProfile?.industry || (isNb ? "generell virksomhet" : "general business");

    const systemPrompt = isNb
      ? `Du er ekspert på forretningsprosesser. Foreslå hvilke interne prosesser som typisk bruker denne leverandøren.

Returner KUN en kompakt liste (maks 5 punkter) med korte, konkrete prosessnavn og en kort forklaring. Bruk bindestrek-punkter. Ikke skriv innledning eller oppsummering.

Format eksempel:
- Kundekommunikasjon: Daglig oppfølging av kundehenvendelser via e-post
- HR-administrasjon: Behandling av søknader og ansattdata
- Markedsføring: Utsending av nyhetsbrev og kampanjer`
      : `You are a business process expert. Suggest which internal processes typically use this vendor.

Return ONLY a compact list (max 5 bullets) with short, concrete process names and a brief explanation. Use dash bullets. Do not write introduction or summary.

Example format:
- Customer communication: Daily handling of customer inquiries via email
- HR administration: Processing of applications and employee data
- Marketing: Sending newsletters and campaigns`;

    const userMessage = isNb
      ? `Leverandør: ${vendorName}\nKategori: ${vendorCategory || "ukjent"}\n${vendorDescription ? `Beskrivelse: ${vendorDescription}\n` : ""}Bransje: ${industry}\n\nForeslå prosesser i virksomheten som bruker denne leverandøren.`
      : `Vendor: ${vendorName}\nCategory: ${vendorCategory || "unknown"}\n${vendorDescription ? `Description: ${vendorDescription}\n` : ""}Industry: ${industry}\n\nSuggest processes in the business that use this vendor.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: isNb ? "For mange forespørsler. Prøv igjen om litt." : "Too many requests. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: isNb ? "AI-kreditt oppbrukt. Legg til kreditt i arbeidsområdet." : "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-vendor-processes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
