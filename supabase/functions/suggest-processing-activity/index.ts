import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logAiUsage } from "../_shared/ai-usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { system_id, language } = await req.json();
    if (!system_id) {
      return new Response(JSON.stringify({ error: "system_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isNorwegian = language !== "en";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: system } = await supabase
      .from("systems")
      .select("id, name, description, category, vendor, work_area_id")
      .eq("id", system_id)
      .single();

    if (!system) {
      return new Response(JSON.stringify({ error: "System not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let workAreaName = "";
    let workAreaDesc = "";
    if (system.work_area_id) {
      const { data: wa } = await supabase
        .from("work_areas")
        .select("name, description")
        .eq("id", system.work_area_id)
        .single();
      workAreaName = wa?.name || "";
      workAreaDesc = wa?.description || "";
    }

    const { data: companyProfile } = await supabase
      .from("company_profile")
      .select("name, legal_name, org_number, industry, brreg_industry, country")
      .single();

    const industry = companyProfile?.industry || companyProfile?.brreg_industry || (isNorwegian ? "generell virksomhet" : "general business");
    const country = companyProfile?.country || "Norge";

    const systemPrompt = isNorwegian
      ? `Du er en personvernekspert (GDPR) som hjelper norske virksomheter med å dokumentere behandlingsaktiviteter (behandlingsprotokoll, art. 30).

KONTEKST:
- Virksomhet: ${companyProfile?.legal_name || companyProfile?.name || "Ukjent"} (${country})
- Bransje: ${industry}
- Arbeidsområde: ${workAreaName || "Ikke angitt"}${workAreaDesc ? ` — ${workAreaDesc}` : ""}
- System: ${system.name}${system.vendor ? ` (leverandør: ${system.vendor})` : ""}${system.category ? `, kategori: ${system.category}` : ""}
${system.description ? `- Systembeskrivelse: ${system.description}` : ""}

OPPGAVE: Foreslå innhold til en behandlingsaktivitet for bruk av dette systemet i denne virksomheten.

REGLER:
1. Formålet skal være konkret og typisk for hvordan en virksomhet i denne bransjen bruker et slikt system.
2. Foreslått behandlingsgrunnlag skal være realistisk (typisk art. 6(1)(b) avtale eller art. 6(1)(f) berettiget interesse for interne verktøy). Dette er KUN et forslag — et menneske må alltid bekrefte.
3. Vurder sannsynlig datatype-klassifisering: "none" (ingen personopplysninger), "ordinary" (ordinære) eller "sensitive" (særlige kategorier, art. 9/10).
4. Svar på norsk.`
      : `You are a GDPR privacy expert helping companies document processing activities (records of processing, Art. 30).

CONTEXT:
- Company: ${companyProfile?.legal_name || companyProfile?.name || "Unknown"} (${country})
- Industry: ${industry}
- Work area: ${workAreaName || "Not specified"}${workAreaDesc ? ` — ${workAreaDesc}` : ""}
- System: ${system.name}${system.vendor ? ` (vendor: ${system.vendor})` : ""}${system.category ? `, category: ${system.category}` : ""}
${system.description ? `- System description: ${system.description}` : ""}

TASK: Suggest content for a processing activity for the use of this system.

RULES:
1. The purpose should be concrete and typical for how a company in this industry uses such a system.
2. The suggested legal basis should be realistic (typically Art. 6(1)(b) contract or Art. 6(1)(f) legitimate interest for internal tools). This is ONLY a suggestion — a human must always confirm.
3. Assess the likely data classification: "none" (no personal data), "ordinary" or "sensitive" (special categories, Art. 9/10).
4. Answer in English.`;

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
          {
            role: "user",
            content: isNorwegian
              ? `Foreslå formål, behandlingsgrunnlag og datatype for bruk av systemet "${system.name}".`
              : `Suggest purpose, legal basis and data class for the use of the system "${system.name}".`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_processing_activity",
              description: "Return a suggested processing activity draft for a system",
              parameters: {
                type: "object",
                properties: {
                  purpose: {
                    type: "string",
                    description: isNorwegian ? "Formål med behandlingen, på norsk" : "Purpose of the processing, in English",
                  },
                  purpose_reason: {
                    type: "string",
                    description: isNorwegian ? "Kort begrunnelse for formålsforslaget" : "Short rationale for the purpose suggestion",
                  },
                  legal_basis: {
                    type: "string",
                    description: isNorwegian
                      ? "Foreslått behandlingsgrunnlag med GDPR-hjemmel, f.eks. 'Berettiget interesse (art. 6(1)(f))'"
                      : "Suggested legal basis with GDPR reference, e.g. 'Legitimate interest (Art. 6(1)(f))'",
                  },
                  legal_basis_reason: {
                    type: "string",
                    description: isNorwegian ? "Kort begrunnelse for valg av grunnlag" : "Short rationale for the legal basis",
                  },
                  suggested_data_class: {
                    type: "string",
                    enum: ["none", "ordinary", "sensitive"],
                    description: "Most likely personal data classification for this system usage",
                  },
                  data_class_reason: {
                    type: "string",
                    description: isNorwegian ? "Kort begrunnelse for datatype-forslaget" : "Short rationale for the data class suggestion",
                  },
                  description: {
                    type: "string",
                    description: isNorwegian ? "Kort beskrivelse av behandlingsaktiviteten" : "Short description of the processing activity",
                  },
                },
                required: ["purpose", "purpose_reason", "legal_basis", "legal_basis_reason", "suggested_data_class", "description"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_processing_activity" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: isNorwegian ? "Forespørselsgrense nådd, prøv igjen senere." : "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: isNorwegian ? "Kreditt oppbrukt, vennligst legg til kreditt." : "Credits exhausted, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    logAiUsage("suggest-processing-activity", data);

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({
          suggestion: result,
          system: { id: system.id, name: system.name },
          controller_name: companyProfile?.legal_name || companyProfile?.name || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ suggestion: null, error: "No suggestion generated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-processing-activity error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
