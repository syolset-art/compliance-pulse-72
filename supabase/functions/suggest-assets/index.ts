import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { asset_type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch company profile for context
    const { data: companyProfile } = await supabase
      .from("company_profile")
      .select("*")
      .single();

    // Fetch existing assets to avoid duplicates
    const { data: existingAssets } = await supabase
      .from("assets")
      .select("name, asset_type")
      .eq("asset_type", asset_type);

    const existingNames = existingAssets?.map(a => a.name.toLowerCase()) || [];

    // Get asset type display name
    const { data: template } = await supabase
      .from("asset_type_templates")
      .select("display_name, display_name_plural")
      .eq("asset_type", asset_type)
      .single();

    const assetTypeName = template?.display_name || asset_type;
    const assetTypePluralName = template?.display_name_plural || assetTypeName;

    // Build context-aware prompt
    const industryContext = companyProfile?.industry === "energi" 
      ? "energiselskap (kraftproduksjon, nettdrift, fornybar energi)"
      : companyProfile?.industry || "generell virksomhet";

    const employeeContext = companyProfile?.employees || "ukjent størrelse";

    let typeSpecificPrompt = "";
    switch (asset_type) {
      case "system":
        typeSpecificPrompt = `Foreslå 6-8 typiske IT-systemer som brukes av ${industryContext}. 
        Inkluder både:
        - Kjernesystemer (f.eks. SCADA, energihandel, nettdrift)
        - Forretningssystemer (f.eks. ERP, CRM, HR)
        - Produktivitetsverktøy (f.eks. Microsoft 365, Slack)
        - Spesialiserte bransjeverktøy
        For hvert system, angi typisk leverandør og kort formål.`;
        break;
      case "vendor":
        typeSpecificPrompt = `Foreslå 6-8 typiske leverandører for ${industryContext}.
        Inkluder både IT-leverandører og bransjessspesifikke leverandører.`;
        break;
      case "hardware":
        typeSpecificPrompt = `Foreslå 6-8 typiske hardware-eiendeler for ${industryContext}.
        Inkluder servere, nettverksutstyr, arbeidsstasjoner, og bransjespesifikk hardware.`;
        break;
      case "network":
        typeSpecificPrompt = `Foreslå 6-8 typiske nettverkskomponenter for ${industryContext}.
        Inkluder både intern infrastruktur og sky-tjenester.`;
        break;
      default:
        typeSpecificPrompt = `Foreslå 6-8 typiske ${assetTypePluralName} for ${industryContext}.`;
    }

    const systemPrompt = `Du er en ekspert på IT-arkitektur og asset management for norske virksomheter.
    
Du skal foreslå ${assetTypePluralName} for et selskap med følgende profil:
- Selskap: ${companyProfile?.name || "Ukjent"}
- Bransje: ${industryContext}
- Antall ansatte: ${employeeContext}

${typeSpecificPrompt}

VIKTIG: Ikke foreslå disse som allerede finnes: ${existingNames.join(", ") || "ingen"}

Returner svaret som en JSON-array med objekter som har følgende struktur:
{
  "suggestions": [
    {
      "name": "Systemets navn",
      "vendor": "Leverandør (hvis relevant)",
      "description": "Kort beskrivelse av formål og bruksområde",
      "category": "Kategori (f.eks. 'ERP', 'CRM', 'SCADA')",
      "risk_level": "low|medium|high",
      "criticality": "low|medium|high|critical",
      "reason": "Hvorfor dette er relevant for selskapet"
    }
  ]
}`;

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
          { role: "user", content: `Gi meg forslag til ${assetTypePluralName} for dette selskapet.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_assets",
              description: "Return asset suggestions",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        vendor: { type: "string" },
                        description: { type: "string" },
                        category: { type: "string" },
                        risk_level: { type: "string", enum: ["low", "medium", "high"] },
                        criticality: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        reason: { type: "string" }
                      },
                      required: ["name", "description", "category", "risk_level", "criticality", "reason"]
                    }
                  }
                },
                required: ["suggestions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_assets" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const suggestions = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({
        suggestions: suggestions.suggestions,
        company: companyProfile?.name,
        industry: companyProfile?.industry
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ suggestions: [], error: "No suggestions generated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("suggest-assets error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
