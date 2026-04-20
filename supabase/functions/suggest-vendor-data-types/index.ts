import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { vendorName, vendorCategory, vendorDescription, vendorUrl, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isNb = language !== "en";

    const systemPrompt = isNb
      ? `Du er en personvernekspert. Foreslå hvilke typer personopplysninger en leverandør typisk behandler basert på leverandørtype.

Returner KUN en kompakt liste (maks 5 punkter) med konkrete datatyper. Bruk korte punktlister med bindestrek. Marker tydelig om opplysningene er ordinære, sensitive eller særlige kategorier (GDPR art. 9). Ikke skriv lange forklaringer.

Format eksempel:
- Navn og kontaktinformasjon (ordinær)
- E-postadresse (ordinær)
- IP-adresse og enhets-ID (ordinær)
- Helseopplysninger (særlig kategori, GDPR art. 9)`
      : `You are a privacy expert. Suggest what types of personal data a vendor typically processes based on the vendor type.

Return ONLY a compact list (max 5 bullets) with concrete data types. Use short dash bullets. Clearly mark whether data is ordinary, sensitive, or special category (GDPR art. 9). Do not write long explanations.

Example format:
- Name and contact info (ordinary)
- Email address (ordinary)
- IP address and device ID (ordinary)
- Health data (special category, GDPR art. 9)`;

    const userMessage = isNb
      ? `Leverandør: ${vendorName}\nKategori: ${vendorCategory || "ukjent"}\n${vendorDescription ? `Beskrivelse: ${vendorDescription}\n` : ""}${vendorUrl ? `Nettside: ${vendorUrl}\n` : ""}\nForeslå hvilke personopplysninger denne leverandøren sannsynligvis behandler.`
      : `Vendor: ${vendorName}\nCategory: ${vendorCategory || "unknown"}\n${vendorDescription ? `Description: ${vendorDescription}\n` : ""}${vendorUrl ? `Website: ${vendorUrl}\n` : ""}\nSuggest what personal data this vendor likely processes.`;

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
    console.error("suggest-vendor-data-types error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
