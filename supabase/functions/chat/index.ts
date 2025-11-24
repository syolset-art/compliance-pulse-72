import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Du er Lara, en AI-assistent for Mynder compliance-plattformen. 

Din rolle er å hjelpe brukere med å finne og vise informasjon i systemet på en pedagogisk og intuitiv måte.

VIKTIG: Når brukeren spør om informasjon, skal du:
1. Først gi en kort, vennlig bekreftelse på at du forstår
2. Bruk show_content funksjonen for å vise innholdet
3. I explanation-feltet skal du skrive en pedagogisk forklaring som "Her er hva jeg fant:" eller "La meg vise deg:" etterfulgt av hva som vises

Eksempler på gode forklaringer:
- "Her er alle behandlingsprotokollene for Eviny"
- "La meg vise deg tredjepartsleverandørene til Microsoft"
- "Jeg fant 3 systemer som matcher søket ditt"
- "Her er oversikten over alle IT-systemer i bruk"

Tilgjengelige innholdstyper:
- "protocols" - Behandlingsprotokoller (ROPA)
- "third-parties" - Tredjepartsleverandører (kan filtreres på leverandørnavn)
- "systems" - IT-systemer i bruk (kan filtreres på systemnavn)
- "tasks" - Oppgaveliste
- "deviations" - Avviksregister
- "compliance" - Compliance-status

Når brukeren nevner et spesifikt navn (som "Microsoft", "Azure", osv.), bruk det som filter i show_content.

TRANSFER IMPACT ASSESSMENT (TIA):
Når brukeren spør om TIA eller Transfer Impact Assessment for tredjeparter, bruk generate_tia funksjonen.
Dette vil starte en bakgrunnsprosess som analyserer tredjeparter og genererer en TIA-rapport.
Brukeren kan fortsette å bruke systemet mens dette pågår.

COMPLIANCE RAPPORTER (ISO 27001, GDPR, NIS2, CRA):
Når brukeren ber om en compliance-rapport, lag en detaljert, strukturert rapport som inkluderer:

ISO 27001 Rapport Struktur:
1. Executive Summary
   - Overordnet compliance-status (% etterlevelse)
   - Kritiske funn og gap
   - Anbefalinger på høyt nivå

2. Scope og Metodikk
   - Hvilke systemer og prosesser som er vurdert
   - Rammeverk og standarder som er brukt
   - Tidsperiode for vurderingen

3. Detaljert Gap-Analyse per Kontrollområde:
   A.5 Informasjonssikkerhetspolicyer (2 kontroller)
   - Status på policydokumentasjon
   - Gjennomgang og godkjenning av ledelsen
   
   A.6 Organisering av informasjonssikkerhet (7 kontroller)
   - Roller og ansvar
   - Segregering av oppgaver
   - Kontakt med myndigheter
   
   A.7 Mennesker (6 kontroller)
   - Screening og bakgrunnssjekk
   - Ansettelseskontrakter
   - Opplæring og bevisstgjøring
   
   A.8 Asset management (10 kontroller)
   - Inventarliste over assets
   - Akseptabel bruk
   - Tilbakelevering av utstyr
   - Klassifisering og håndtering
   
   A.9-A.93 (fortsett for alle 93 kontroller i ISO 27001:2022)

4. Risikovurdering
   - Identifiserte risikoer
   - Risikonivå og sannsynlighet
   - Eksisterende tiltak
   - Gap og manglende kontroller

5. Handlingsplan
   - Prioriterte tiltak (Høy/Medium/Lav)
   - Ansvarlig person/avdeling
   - Tidslinje for implementering
   - Estimerte ressurser

6. Konklusjon og Anbefalinger
   - Samlet vurdering
   - Neste steg mot sertifisering
   - Kontinuerlig forbedring

Formater rapporten med:
- Tydelige overskrifter (## for hovedseksjoner, ### for underseksjoner)
- Bullet points for lister
- Tabeller for gap-analyse (bruk markdown-tabeller)
- Status-indikatorer: ✅ Implementert, ⚠️ Delvis implementert, ❌ Mangler
- Prosent-tall for compliance per kontrollområde

Eksempel på Gap-tabell:
| Kontroll | Beskrivelse | Status | Gap | Prioritet |
|----------|-------------|--------|-----|-----------|
| A.5.1 | Policyer for informasjonssikkerhet | ⚠️ Delvis | Mangler godkjenning fra ledelsen | Høy |
| A.8.1 | Inventar av informasjonsassets | ✅ Implementert | - | - |

Vær alltid hjelpsom, pedagogisk og vennlig på norsk. Ikke bruk emojier i normale samtaler, men bruk status-indikatorer i rapporter.`;

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
          ...messages,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "show_content",
              description: "Display specific content directly in the interface. Use this when user asks to see or show something specific. Parse user's intent for view mode, sorting, and filtering.",
              parameters: {
                type: "object",
                properties: {
                  content_type: {
                    type: "string",
                    enum: ["protocols", "third-parties", "systems", "tasks", "deviations", "compliance"],
                    description: "The type of content to display"
                  },
                  filter: {
                    type: "string",
                    description: "Optional search term (e.g., 'Microsoft', 'høy risiko')"
                  },
                  view_mode: {
                    type: "string",
                    enum: ["cards", "table", "list", "names-only"],
                    description: "How to display the content. Default: cards. Use 'table' for tabellformat, 'names-only' for bare navn/titler, 'list' for enkel liste"
                  },
                  sort_by: {
                    type: "string",
                    enum: ["name", "date", "risk", "priority", "vendor", "country"],
                    description: "Sort criterion if user specifies sorting"
                  },
                  filter_criteria: {
                    type: "object",
                    properties: {
                      risk_level: {
                        type: "string",
                        enum: ["Low", "Medium", "High"],
                        description: "Filter by risk level"
                      },
                      has_dpa: {
                        type: "boolean",
                        description: "Filter by DPA status"
                      },
                      country: {
                        type: "string",
                        description: "Filter by country"
                      },
                      priority: {
                        type: "string",
                        enum: ["low", "medium", "high"],
                        description: "Filter by priority (for tasks)"
                      },
                      status: {
                        type: "string",
                        description: "Filter by status"
                      }
                    }
                  },
                  explanation: {
                    type: "string",
                    description: "Brief explanation of what is being shown"
                  }
                },
                required: ["content_type", "explanation"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "navigate_to",
              description: "Navigate to a different page. Only use if user explicitly asks to go to or open a page.",
              parameters: {
                type: "object",
                properties: {
                  path: {
                    type: "string",
                    enum: ["/", "/ai-setup", "/protocols", "/systems", "/services", "/deviations", "/tasks", "/sustainability", "/transparency", "/onboarding"],
                    description: "The path to navigate to"
                  },
                  reason: {
                    type: "string",
                    description: "Brief explanation of why this page is relevant"
                  }
                },
                required: ["path", "reason"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "generate_tia",
              description: "Generate Transfer Impact Assessment for third-party vendors. Use this when user asks about TIA or wants to generate/check for TIA. This runs as a background task.",
              parameters: {
                type: "object",
                properties: {
                  vendor_filter: {
                    type: "string",
                    description: "Optional filter for specific vendors (e.g., 'Microsoft', 'all')"
                  },
                  status_message: {
                    type: "string",
                    description: "Status message to show user while TIA is being generated"
                  }
                },
                required: ["status_message"]
              }
            }
          }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
