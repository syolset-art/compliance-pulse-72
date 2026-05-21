
# Styre-dashbord (Board Dashboard)

Et nytt, dedikert dashbord skreddersydd for styre og styreleder. Fokus: strategisk overblikk, lovpålagt etterlevelse, risiko og beredskap — ikke operative detaljer.

## Bakgrunn

Styret har et juridisk ansvar (aksjeloven §6-12, NIS2 art. 20, GDPR art. 24) for at virksomheten har kontroll på etterlevelse, risiko og beredskap. Dagens dashbord (DashboardV2, Lederoversikt) er operativt og for detaljert. Styret trenger:
- Få, store tall som kan leses på 30 sekunder
- Klare svar på "leverer vi på det lovpålagte?"
- Dokumenterbar beslutningsstøtte (eksportbar til styremøte)
- Tydelig markering av hva som krever styrets beslutning vs. hva administrasjonen håndterer

## Ny rute og inngang

- Ny side: `src/pages/BoardDashboard.tsx` på `/board` (norsk: "Styrerom")
- Tilgjengelig fra sidebar under "Mynder Me" eller eget toppnivå-element for roller `board_member` / `chair`
- Egen PDF-eksport "Styrerapport" (gjenbruker `pdfBranding` + `generateExecutivePortfolioReport` mønster)

## Innholds-soner (top-to-bottom)

### Sone 1 — Lovpålagt etterlevelse (Hero)
Stor "trafikklys"-statuskort per lovpålagt regelverk styret hefter for:
- GDPR, NIS2, AI Act, Sikkerhetsloven, Internkontrollforskriften, Åpenhetsloven, Bokføringsloven (det som er aktivert i `active_frameworks`)
- Hvert kort viser: status (grønn/gul/rød basert på modenhet ≥75/50/<50), siste vurderingsdato, neste frist, ansvarlig (DPO/CISO/Compliance Lead fra `key_personnel`)
- Med landflagg-tag (gjenbruker `FrameworkCountryTag`)

### Sone 2 — Styrets beslutningspunkter
Liste over saker som eksplisitt krever styrebehandling:
- Høyrisiko AI-systemer som venter godkjenning (`ai_system_registry` der `risk_category in ('high','unacceptable')` og `status='pending_approval'`)
- Kritiske avvik > 30 dager (`deviations` med `severity='critical'`)
- Leverandører med kritisk risiko (`vendors` der derivedRisk = critical og `criticality='critical'`)
- Manglende DPIA på prosesser med høy risiko
- Hvert punkt med "Behandlet i styremøte ___" felt og knapp "Marker som behandlet"

### Sone 3 — Risiko-eksponering (top-3)
Tre kort side om side:
- **Operasjonell risiko**: Antall kritiske systemer uten beredskapsplan / siste BCP-test
- **Cyberrisiko**: NIS2-modenhet, antall åpne sikkerhetshendelser siste 90 dager, MTTR
- **Tredjepartsrisiko**: Antall kritiske leverandører uten gyldig DPA/SOC2, leverandørkonsentrasjon

Gjenbruker `BusinessRiskExposureWidget`, `SecurityBreachWidget`, `ThirdPartyManagementWidget` med komprimert "board view"-variant.

### Sone 4 — Beredskap og kontinuitet
- Status på beredskapsplan (sist oppdatert, sist testet)
- Antall gjennomførte beredskapsøvelser siste 12 mnd
- Hendelseslogg: 5 siste alvorlige hendelser med utfall (lukket/åpen)
- NIS2 hendelsesrapportering: tidsfrister overholdt? (24t/72t/30d)

### Sone 5 — Modenhets-trend (12 mnd)
Linje-graf over total compliance score per kvartal + per domene (Governance, Operations, Privacy, Third-Party). Viser om styret er på vei opp eller ned. Gjenbruker `scoringEngine` historikk; hvis ingen historikk: vis "Baseline registrert {dato}".

### Sone 6 — Ansvar og rolledekning
Tabell over nøkkelroller med status:
- Daglig leder, Styreleder, DPO, CISO, Compliance Lead, Beredskapskoordinator
- Kolonner: Rolle | Navn | Sist bekreftet | Stedfortreder | Status
- Rødt om rolle mangler stedfortreder eller ikke er bekreftet siste 12 mnd

### Sone 7 — Neste styresak (footer)
- "Forberedelse til neste styremøte" boks
- Foreslåtte saker generert av Lara basert på sone 1–6
- Knapp: "Generer styrerapport (PDF)"

## Teknisk

**Nye filer:**
- `src/pages/BoardDashboard.tsx` — rutekomponent
- `src/components/board-dashboard/LegalComplianceHero.tsx` — sone 1
- `src/components/board-dashboard/BoardDecisionsWidget.tsx` — sone 2
- `src/components/board-dashboard/RiskExposureTriad.tsx` — sone 3
- `src/components/board-dashboard/PreparednessWidget.tsx` — sone 4
- `src/components/board-dashboard/MaturityTrendChart.tsx` — sone 5 (recharts)
- `src/components/board-dashboard/RoleCoverageTable.tsx` — sone 6
- `src/components/board-dashboard/NextBoardMeetingCard.tsx` — sone 7
- `src/components/board-dashboard/BoardReportButton.tsx` — PDF-eksport
- `src/hooks/useBoardMetrics.ts` — aggregerer data fra eksisterende tabeller

**Endringer:**
- `src/App.tsx` — ny rute `/board`
- `src/components/Sidebar.tsx` — nytt menypunkt "Styrerom" (ikon: `Landmark` eller `Gavel`)
- i18n-nøkler i `src/lib/i18n.ts` (board.*) for NO/EN

**Datakilder (eksisterende tabeller, ingen DB-endringer nødvendig i v1):**
- `active_frameworks`, `requirement_status`, `compliance_requirements`
- `ai_system_registry`, `deviations`, `vendors`, `system_processes`
- `system_incidents`, `key_personnel`, `tasks`

**Design:**
- Apple-minimalisme, deep purple primary (#5A3184)
- Større typografi enn vanlig dashbord (`text-3xl`/`text-4xl` for nøkkeltall)
- Risiko-farger: success/warning/destructive (gjenbruker tokens)
- Mer luft — `space-y-8` mellom soner
- Print-vennlig (styret skriver ut)

## Avgrensning v1

- Ingen drill-down — alt skal kunne forklares av tallet selv
- Ingen redigering inline (unntatt "marker som behandlet" i sone 2)
- Historikk-graf bruker dummy/baseline hvis ingen tidsserie finnes ennå
- Tilgangsstyring: gjenbruker eksisterende roller; egen `board_member`-rolle kan komme senere
