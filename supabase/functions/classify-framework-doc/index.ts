import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileName, frameworkId, frameworkName, workAreaNames } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const workAreaList = (workAreaNames || []).join(", ") || "Ingen definert ennå";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Du er en compliance-ekspert som hjelper med dokumenthåndtering i et styringssystem.
Basert på filnavnet og regelverket, foreslå:
1. Dokumenttype (policy, procedure, guideline, soa, risk_assessment, report, other)
2. Hvem som typisk eier denne typen dokument (velg fra listen med roller)
3. Hvilke arbeidsområder dokumentet typisk gjelder for
4. Et kort tips til brukeren om hva slags metadata de bør legge til
5. En kort beskrivelse av hva dokumentet sannsynligvis inneholder

Tilgjengelige roller for eierskap:
- kari.nordmann = Compliance Officer
- ola.hansen = CISO (Informasjonssikkerhetsleder)
- erik.berg = DPO / Personvernombud
- lise.johansen = Kvalitetsleder
- thomas.dahl = IT-sjef
- marte.svendsen = HR-leder

Organisasjonens arbeidsområder: ${workAreaList}

Regelverket filen lastes opp til: ${frameworkName} (${frameworkId})`
          },
          {
            role: "user",
            content: `Filen som lastes opp heter: "${fileName}"\n\nForeslå metadata for dette dokumentet.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_metadata",
              description: "Foreslå metadata for et compliance-dokument",
              parameters: {
                type: "object",
                properties: {
                  suggestedType: {
                    type: "string",
                    enum: ["policy", "procedure", "guideline", "soa", "risk_assessment", "report", "other"],
                    description: "Foreslått dokumenttype"
                  },
                  suggestedTypeReason: {
                    type: "string",
                    description: "Kort begrunnelse for valgt dokumenttype (1 setning)"
                  },
                  suggestedOwner: {
                    type: "string",
                    enum: ["kari.nordmann", "ola.hansen", "erik.berg", "lise.johansen", "thomas.dahl", "marte.svendsen"],
                    description: "Foreslått eier basert på dokumenttype"
                  },
                  suggestedOwnerReason: {
                    type: "string",
                    description: "Kort begrunnelse for valgt eier (1 setning)"
                  },
                  suggestedWorkAreaMode: {
                    type: "string",
                    enum: ["all", "selected"],
                    description: "Om dokumentet typisk gjelder alle arbeidsområder eller bare utvalgte"
                  },
                  suggestedWorkAreas: {
                    type: "array",
                    items: { type: "string" },
                    description: "Navnene på arbeidsområdene dokumentet gjelder for (hvis utvalgte)"
                  },
                  workAreaTip: {
                    type: "string",
                    description: "Kort tips om typisk omfang for denne dokumenttypen (1-2 setninger)"
                  },
                  metadataTip: {
                    type: "string",
                    description: "Tips til brukeren om hva de bør tenke på når de fyller ut metadata (2-3 setninger)"
                  },
                  documentDescription: {
                    type: "string",
                    description: "Kort beskrivelse av hva dokumentet sannsynligvis inneholder (1-2 setninger)"
                  }
                },
                required: ["suggestedType", "suggestedTypeReason", "suggestedOwner", "suggestedOwnerReason", "suggestedWorkAreaMode", "suggestedWorkAreas", "workAreaTip", "metadataTip", "documentDescription"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_metadata" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "For mange forespørsler, prøv igjen." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-kreditter brukt opp." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI-analyse feilet" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Ingen forslag mottatt" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const suggestion = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-framework-doc error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Ukjent feil" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
