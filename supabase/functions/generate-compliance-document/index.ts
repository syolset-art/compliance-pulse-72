import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Body {
  documentName?: string;
  frameworkLabel?: string;
  articleLabel?: string;
  areaTitle?: string;
  customerName?: string;
  industry?: string;
  businessDescription?: string;
  employees?: number | string;
  country?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Body;
    const documentName = (body.documentName ?? "").trim();

    if (!documentName) {
      return new Response(JSON.stringify({ error: "documentName er påkrevd" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY mangler" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const context = [
      `Dokument som skal utarbeides: ${documentName}`,
      body.frameworkLabel ? `Regelverk: ${body.frameworkLabel}` : "",
      body.articleLabel ? `Kravreferanse: ${body.articleLabel}` : "",
      body.areaTitle ? `Kontrollområde: ${body.areaTitle}` : "",
      body.customerName ? `Virksomhet: ${body.customerName}` : "",
      body.industry ? `Bransje: ${body.industry}` : "",
      body.employees ? `Antall ansatte: ${body.employees}` : "",
      body.country ? `Land: ${body.country}` : "",
      body.businessDescription ? `Om virksomheten: ${body.businessDescription}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `Du er compliance-rådgiver i et norsk MSP/MSSP-selskap og skriver dokumentutkast på vegne av partneren, til partnerens kunde.

Skriv et konkret, praktisk førsteutkast til dokumentet det bes om. Krav til svaret:
- Norsk (bokmål), markdown, med tydelig overskriftsstruktur.
- Start med dokumenttittel, deretter en kort formålsseksjon.
- Bruk alle kapitler som er nødvendige for at dokumentet faktisk oppfyller kravet.
- Der informasjon mangler, sett inn tydelige plassholdere i formen [FYLLES UT: ...] i stedet for å finne på fakta.
- Avslutt med en kort seksjon "Til partneren – dette må kvalitetssikres" med 3–6 punkter.
- Ingen innledende småprat, ingen forklaring av hva du gjør. Bare dokumentet.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: context },
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error(`AI gateway feilet [${response.status}]: ${details}`);
      return new Response(
        JSON.stringify({ error: "AI-generering feilet", status: response.status, details }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ content, documentName }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-compliance-document error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
