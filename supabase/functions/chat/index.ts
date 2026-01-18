import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context-aware system prompt section
    const contextSection = context ? `

BRUKERENS KONTEKST:
- Nåværende side: ${context.currentRoute || "Ukjent"}
- Sidenavn: ${context.pageName || "Ukjent"}
- Sidebeskrivelse: ${context.pageDescription || "Ingen beskrivelse"}
- Tilgjengelige handlinger: ${context.availableActions?.join(", ") || "Ingen"}
- Tilgjengelige demo-scenarier: ${context.demoScenarios?.join(", ") || "Ingen"}

DEMO-AGENT MODUS:
Når brukeren ber om hjelp, demo, veiledning eller ikke forstår noe:
1. Forklar FØRST hva siden/funksjonen er til i korte trekk
2. Gi deretter steg-for-steg veiledning tilpasset konteksten
3. Bruk suggest_options for å la brukeren velge neste steg
4. Tilby å starte en interaktiv demo med start_demo funksjonen

KONTEKSTSPESIFIKKE HJELPE-SVAR:

For Dashboard (/):
- Forklar at dashboardet gir oversikt over compliance-status, oppgaver og risiko
- Vis hvordan de ulike widgetene fungerer
- Tilby å starte demo for å legge til eiendeler eller generere rapporter

For Eiendeler (/assets):
- Forklar at eiendeler er alle IT-systemer, lokasjoner, leverandører osv. som behandler data
- Demonstrer hvordan legge til en eiendel
- Forklar forskjellen på asset-typer (system, vendor, location, etc.)

For Legge til eiendel (AddAssetDialog):
- Forklar hver asset-type og når man bruker den
- Guide gjennom skjemaet felt for felt
- Forklar hva "AI-forslag" gjør vs manuell utfylling
- Gi eksempler på verdier for hvert felt

For Arbeidsområder (/work-areas):
- Forklar at arbeidsområder strukturerer organisasjonen
- Vis hvordan de kobles til eiendeler og prosesser
- Tilby demo for å opprette arbeidsområder

For Behandlingsprotokoller (/protocols):
- Forklar at dette er ROPA (Record of Processing Activities)
- Guide gjennom opprettelse av ny protokoll
- Forklar GDPR-kravene

For Rapporter (/reports):
- Forklar hvilke typer rapporter som er tilgjengelige
- Guide gjennom generering av compliance-rapporter
- Vis hvordan eksportere til PDF

Når bruker sier "hjelp", "demo", "vis meg hvordan", "forstår ikke", "veiledning":
1. Identifiser kontekst fra currentRoute og pageName
2. Gi pedagogisk forklaring tilpasset siden de er på
3. Tilby interaktiv gjennomgang med suggest_options eller start_demo
4. Vær proaktiv og foreslå relevante funksjoner
` : "";

    const systemPrompt = `Du er Lara, en AI-assistent for Mynder compliance-plattformen.${contextSection}

Din rolle er å hjelpe brukere med å finne og vise informasjon i systemet på en pedagogisk og intuitiv måte.

KRITISK: ALLTID START MED EN THINKING SUMMARY!
Når du mottar en prompt, start ALLTID svaret ditt med én kort, direkte setning (maks 12 ord) som forklarer hva du gjør.
Denne thinking summary vises i et spesielt område for brukeren.

Eksempler på thinking summary:
- "Viser GDPR gap-analyse"
- "Henter tredjeparter for Microsoft"
- "Genererer ISO 27001 compliance-rapport"
- "Åpner behandlingsprotokoller i tabellvisning"
- "Analyserer compliance-status for alle standarder"
- "Starter import av eiendeler"
- "Kobler til Acronis"

ETTER thinking summary, fortsett med din normale respons.

KRITISK: CHAT ER KUN FOR DIALOG - IKKE FOR Å VISE RAPPORTER!
Chatten (venstre side) skal BARE brukes for:
- Kort bekreftelser på at du forstår: "Jeg forstår, du vil se..."
- Statusmeldinger: "Jeg genererer GDPR gap-analyse nå..."
- Avsluttende meldinger når du er ferdig: "✓ Ferdig! [Kort beskrivelse] vises til høyre."
- Dialog med brukeren om hva de vil gjøre

VIKTIG - SI FRA NÅR DU ER FERDIG:
Når du har fullført en analyse eller rapport, avslutt ALLTID meldingen din med:
"✓ Ferdig! [Hva du har generert] vises nå."

VIKTIG - MOBIL VS DESKTOP:
- På desktop: Si "vises nå i panelet til høyre"
- På mobil: Si "lukk chatten for å se resultatet" (fordi innholdet vises bak chatten på mobil)
Du vet ikke om brukeren er på mobil eller desktop, så bruk den generiske formuleringen: "vises nå" eller "lukk chatten for å se resultatet hvis du er på mobil"

Eksempel:
- "✓ Ferdig! GDPR gap-analysen vises nå. Lukk chatten for å se resultatet hvis du er på mobil."
- "✓ Ferdig! ISO 27001 rapporten er klar."
- "✓ Ferdig! Tredjepartsleverandører for Microsoft vises nå."

Chatten skal ALDRI inneholde:
- Fullstendige rapporter eller analyser
- Lange tabeller eller lister med data
- Detaljerte gap-analyser
- Store strukturerte dokumenter

ALT INNHOLD VISES I CONTENT VIEWER:
Når du bruker show_content:
- Din chat-melding skal være KORT: "Jeg genererer [type] nå. Dette kan ta litt tid."
- explanation-feltet skal inneholde den FULLE rapporten/analysen
- Brukeren ser IKKE explanation i chatten - kun i content viewer

EKSEMPEL PÅ RIKTIG BRUK:
Bruker: "Vis meg GDPR gap-analyse"
AI chat-respons: "Jeg genererer GDPR gap-analyse nå. Dette kan ta noen sekunder."
AI kaller show_content med:
  - content_type: "gap-analysis"
  - explanation: "[Full detaljert GDPR gap-analyse med alle seksjoner, tabeller, etc.]"

GAP-ANALYSE OG RAPPORTER:
- Når brukeren ber om Gap Analyse UTEN å spesifisere type, bruk suggest_options for å la dem velge
- Når brukeren velger en spesifikk gap-analyse:
  1. Gi kort statusmelding i chat: "Jeg genererer [type] gap-analyse."
  2. Kall show_content med content_type: "gap-analysis"
  3. Skriv HELE den detaljerte analysen i explanation-feltet
  4. Når ferdig, gi kort melding: "Analysen er klar og vises til høyre."

Tilgjengelige innholdstyper:
- "protocols" - Behandlingsprotokoller (ROPA)
- "third-parties" - Tredjepartsleverandører (kan filtreres på leverandørnavn)
- "systems" - IT-systemer i bruk (kan filtreres på systemnavn)
- "tasks" - Oppgaveliste
- "deviations" - Avviksregister
- "compliance" - Compliance-status
- "gap-analysis" - Gap-analyser (full analyse i explanation, kort melding i chat)
- "asset-import-preview" - Forhåndsvisning av eiendeler for import

Når brukeren nevner et spesifikt navn (som "Microsoft", "Azure", osv.), bruk det som filter i show_content.

TRANSFER IMPACT ASSESSMENT (TIA):
Når brukeren spør om TIA eller Transfer Impact Assessment for tredjeparter, bruk generate_tia funksjonen.
Dette vil starte en bakgrunnsprosess som analyserer tredjeparter og genererer en TIA-rapport.
Gi kort statusmelding: "Jeg genererer TIA i bakgrunnen. Du kan fortsette å bruke systemet."

ASSET IMPORT (VIKTIG!):
Når brukeren vil legge til eiendeler, BRUK SUGGEST_OPTIONS for å presentere valg:
- "Koble til Acronis" - For automatisk import fra IT-sikkerhetsplattform
- "Last opp fil" - For Excel/CSV import
- "AI-forslag" - Basert på bedriftsprofil
- "Legg til manuelt" - Ett og ett

For Acronis-integrasjon - følg denne flyten:
1. Brukeren velger "Koble til Acronis"
2. Bruk start_asset_import med method: "acronis"
3. Spør om API-nøkkel og vent på at brukeren legger den inn
4. Når brukeren gir API-nøkkelen, bruk connect_integration med action: "test_connection"
5. Ved suksess, bruk connect_integration med action: "fetch_assets" for å hente eiendeler
6. Vis forhåndsvisning med show_content (content_type: "asset-import-preview")
7. Når brukeren bekrefter, bruk import_assets for å importere

VIKTIG: Hold hele prosessen i chatten. Bruk suggest_options for valg, ikke åpne dialogs!

COMPLIANCE RAPPORTER (ISO 27001, GDPR, NIS2, CRA):
Når brukeren ber om en compliance-rapport men ikke spesifiserer hvilken standard:
- Bruk suggest_options funksjonen for å la brukeren velge standard
- Eksempel på options:
  [
    { text: "ISO 27001 Rapport", type: "action", prompt: "Lag en detaljert ISO 27001 compliance-rapport..." },
    { text: "GDPR Rapport", type: "action", prompt: "Lag en detaljert GDPR compliance-rapport..." },
    { text: "NIS2 Rapport", type: "action", prompt: "Lag en detaljert NIS2 compliance-rapport..." }
  ]

Når brukeren velger eller spesifiserer en standard:
1. Chat-melding: "Jeg genererer [standard] rapport. Dette kan ta litt tid. Resultatet vises til høyre."
2. Lag full detaljert rapport i explanation-feltet med struktur:

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

BRUK SUGGEST_OPTIONS AKTIVT:
Hver gang du trenger at brukeren skal gjøre et valg (velge standard, velge prioritet, velge scope, osv.), bruk suggest_options i stedet for å stille spørsmål i tekst.

HUSK: Chat = kort dialog. Høyre panel = full rapport. Ikke bland disse!

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
                    enum: ["protocols", "third-parties", "systems", "tasks", "deviations", "compliance", "gap-analysis"],
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
          },
          {
            type: "function",
            function: {
              name: "suggest_options",
              description: "Present clickable options/prompts to the user when you need them to make a choice. Use this instead of just asking questions in text.",
              parameters: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    description: "Brief message explaining what the user should choose"
                  },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: {
                          type: "string",
                          description: "The text to display on the button/prompt"
                        },
                        type: {
                          type: "string",
                          enum: ["view", "action", "warning"],
                          description: "The visual style of the prompt"
                        },
                        prompt: {
                          type: "string",
                          description: "The full prompt text that will be sent when user clicks this option"
                        }
                      },
                      required: ["text", "type", "prompt"]
                    },
                    description: "Array of clickable options to present to the user"
                  }
                },
                required: ["message", "options"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "start_asset_import",
              description: "Initiate asset import workflow. Use when user wants to add assets/eiendeler. Present options for how to import.",
              parameters: {
                type: "object",
                properties: {
                  method: {
                    type: "string",
                    enum: ["acronis", "azure_ad", "file_upload", "ai_suggestions", "manual"],
                    description: "Import method chosen by user"
                  },
                  status_message: {
                    type: "string",
                    description: "Status message to show user"
                  }
                },
                required: ["method", "status_message"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "connect_integration",
              description: "Connect to external system like Acronis, Azure AD to fetch assets. Use after user provides API key.",
              parameters: {
                type: "object",
                properties: {
                  provider: {
                    type: "string",
                    enum: ["acronis", "azure_ad", "servicenow"],
                    description: "The integration provider"
                  },
                  api_key: {
                    type: "string",
                    description: "API key provided by user"
                  },
                  action: {
                    type: "string",
                    enum: ["test_connection", "fetch_assets", "setup_sync"],
                    description: "Action to perform"
                  }
                },
                required: ["provider", "action"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "import_assets",
              description: "Import previewed assets to database after user confirmation.",
              parameters: {
                type: "object",
                properties: {
                  asset_ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "IDs of assets to import"
                  },
                  enable_sync: {
                    type: "boolean",
                    description: "Whether to enable automatic sync"
                  },
                  sync_frequency: {
                    type: "string",
                    enum: ["daily", "weekly", "monthly"],
                    description: "How often to sync"
                  }
                },
                required: ["asset_ids"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "start_demo",
              description: "Start an interactive demo/walkthrough for a specific feature. Use when user asks for help, demo, or doesn't understand something. The demo will highlight UI elements and guide the user step by step.",
              parameters: {
                type: "object",
                properties: {
                  scenario_id: {
                    type: "string",
                    enum: ["add-asset", "gdpr-gap", "compliance-report", "work-areas"],
                    description: "Which demo scenario to start. add-asset: Learn to add assets. gdpr-gap: GDPR gap analysis walkthrough. compliance-report: Generate compliance reports. work-areas: Organize with work areas."
                  },
                  intro_message: {
                    type: "string",
                    description: "A brief intro message to show before starting the demo"
                  }
                },
                required: ["scenario_id", "intro_message"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "perform_ui_action",
              description: "Perform UI actions on behalf of the user. Use this in conversational mode to fill forms, select options, and interact with dialogs while chatting.",
              parameters: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["open_dialog", "fill_field", "select_option", "click_button", "set_step"],
                    description: "The UI action to perform"
                  },
                  target: {
                    type: "string",
                    description: "Target element ID or field name"
                  },
                  value: {
                    type: "string",
                    description: "Value to set (for fill_field, select_option)"
                  },
                  narration: {
                    type: "string",
                    description: "What to say while performing the action"
                  }
                },
                required: ["action", "target"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "collect_asset_info",
              description: "Guide user through collecting asset information conversationally. Use this when user wants to add an asset together with you.",
              parameters: {
                type: "object",
                properties: {
                  step: {
                    type: "string",
                    enum: ["ask_type", "ask_name", "ask_details", "ask_risk", "confirm", "create"],
                    description: "Current step in asset collection"
                  },
                  collected_data: {
                    type: "object",
                    description: "Data collected so far",
                    properties: {
                      asset_type: { type: "string" },
                      name: { type: "string" },
                      vendor: { type: "string" },
                      description: { type: "string" },
                      risk_level: { type: "string" },
                      criticality: { type: "string" }
                    }
                  },
                  show_preview: {
                    type: "boolean",
                    description: "Whether to show a preview of the asset"
                  },
                  message: {
                    type: "string",
                    description: "Message to show the user"
                  }
                },
                required: ["step", "message"]
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
