import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workAreaId, templateType, language = "nb" } = await req.json();

    if (!workAreaId || !templateType) {
      return new Response(JSON.stringify({ error: "Missing workAreaId or templateType" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch work area
    const { data: workArea } = await supabase
      .from("work_areas")
      .select("*")
      .eq("id", workAreaId)
      .single();

    // Fetch systems linked to this work area
    const { data: systems } = await supabase
      .from("systems")
      .select("name, vendor, category, description, status")
      .eq("work_area_id", workAreaId);

    // Fetch assets linked to this work area
    const { data: assets } = await supabase
      .from("assets")
      .select("name, vendor, asset_type, description, gdpr_role, country")
      .eq("work_area_id", workAreaId);

    // Fetch company profile
    const { data: company } = await supabase
      .from("company_profile")
      .select("name, org_number, industry, employees, dpo_name, dpo_email")
      .single();

    const contextParts = [
      `Arbeidsområde: ${workArea?.name || "Ukjent"}`,
      `Beskrivelse: ${workArea?.description || "Ingen beskrivelse"}`,
      company ? `Selskap: ${company.name} (Org.nr: ${company.org_number || "N/A"}, Bransje: ${company.industry})` : "",
      company?.dpo_name ? `Personvernombud: ${company.dpo_name} (${company.dpo_email || ""})` : "",
      systems && systems.length > 0
        ? `Systemer i bruk:\n${systems.map((s: any) => `- ${s.name} (leverandør: ${s.vendor || "ukjent"}, kategori: ${s.category || "ukjent"})`).join("\n")}`
        : "Ingen systemer registrert.",
      assets && assets.length > 0
        ? `Eiendeler/leverandører:\n${assets.map((a: any) => `- ${a.name} (type: ${a.asset_type}, GDPR-rolle: ${a.gdpr_role || "ikke satt"}, land: ${a.country || "ukjent"})`).join("\n")}`
        : "Ingen eiendeler registrert.",
    ].filter(Boolean).join("\n\n");

    const templatePrompts: Record<string, string> = {
      privacy_declaration: `Du er en compliance-rådgiver. Lag et utkast til personvernerklæring (privacy declaration) på norsk for arbeidsområdet beskrevet nedenfor. Dokumentet skal dekke:
1. Hvem er behandlingsansvarlig
2. Hvilke personopplysninger behandles
3. Formål med behandlingen
4. Rettslig grunnlag
5. Hvem mottar opplysningene (databehandlere/underleverandører basert på systemene)
6. Overføring til tredjeland
7. Lagringstid
8. Den registrertes rettigheter
9. Kontaktinformasjon

Bruk informasjonen om systemer og leverandører til å fylle inn konkrete detaljer der mulig.`,

      dpa_template: `Du er en compliance-rådgiver. Lag et utkast til databehandleravtale (DPA) på norsk for arbeidsområdet beskrevet nedenfor. Dokumentet skal følge GDPR art. 28 og inneholde:
1. Parter (behandlingsansvarlig og databehandler)
2. Formål og omfang
3. Typer personopplysninger
4. Kategorier av registrerte
5. Databehandlerens plikter
6. Sikkerhetstiltak
7. Bruk av underleverandører
8. Overføring til tredjeland
9. Bistand til den behandlingsansvarlige
10. Varighet og opphør
11. Sletting og tilbakelevering

Bruk informasjonen om systemer og leverandører til å foreslå relevante sikkerhetstiltak og underleverandører.`,

      risk_assessment: `Du er en sikkerhetsrådgiver. Lag et sammendrag av risikovurdering på norsk for arbeidsområdet beskrevet nedenfor. Dokumentet skal dekke:
1. Oversikt over arbeidsområdet
2. Identifiserte risikoer basert på systemene og leverandørene
3. Vurdering av sannsynlighet og konsekvens for hver risiko
4. Foreslåtte tiltak for å redusere risiko
5. Anbefalinger for videre oppfølging

Vurder spesielt:
- Tredjepartsrisiko fra leverandører
- Datalagringsrisiko
- Tilgangsstyring
- Personvernrisiko`,
    };

    const systemPrompt = templatePrompts[templateType];
    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: "Invalid templateType" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai-gateway.lovable.dev/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Her er konteksten for dokumentet:\n\n${contextParts}` },
        ],
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "Kunne ikke generere dokument.";

    return new Response(
      JSON.stringify({
        content,
        templateType,
        workAreaName: workArea?.name || "Ukjent",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
