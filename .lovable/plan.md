# Gap-analyse av leverandører mot rammeverk

## Mål
Bruker skal kunne velge en (eller flere) av sine leverandører i Leverandør-modulen og kjøre en gap-analyse mot et valgt rammeverk (f.eks. **Normen** for helsesektoren eller **NIS2**). Resultatet vises som en strukturert oversikt over hvilke krav leverandøren oppfyller, hvilke som er delvis dekket og hvilke som mangler — med konkrete handlinger for å lukke gapene.

## Hvor det plasseres
Ny fane **"Gap-analyse"** på leverandørens Trust Profile (`/assets/:id`), ved siden av eksisterende «Veiledning», «Bruk», «Dokumenter», «Forespørsler» m.fl. Den blir en av de valgbare fanene i tab-customizeren (max 7 synlige).

I tillegg en **bulk-inngang** fra leverandørdashbordet: "Kjør gap-analyse på prioriterte leverandører" som lar brukeren velge flere leverandører + ett rammeverk og få en samlet rapport.

## Hvordan analysen fungerer

Tre lag av input kombineres til en score per krav:

1. **Leverandør-metadata** vi allerede har på `assets`-tabellen: `gdpr_role`, `country`, `risk_level`, `vendor_category`, dokumenter (DPA, ISO-sertifikat, SOC2, pentest-rapporter), `metadata` (sub-prosessorer, datalokasjon, MFA, kryptering, m.m.) og eksisterende Trust-control-evaluering fra `useTrustControlEvaluation`.

2. **Rammeverkskrav** fra `compliance_requirements`-tabellen (allerede i bruk på dashbord). Vi mapper hvert krav til ett eller flere "datasignaler" via en ny mapping-tabell (se Teknisk).

3. **AI-tolkning av dokumenter** via Lovable AI (Gemini 2.5 Flash) som leser opplastede leverandørdokumenter og avgjør om de gir bevis for spesifikke krav (f.eks. "Er kryptering i hvile dokumentert?"). Dette gir status `implemented`/`partial`/`missing` med en kort begrunnelse og sitat.

Hvert krav får:
- **Status**: oppfylt / delvis / mangler / ikke relevant
- **Bevis**: hvilke dokumenter eller felter som ble brukt
- **Gap-handling**: konkret neste steg ("Be om SOC 2 Type II-rapport", "Verifiser DPA art. 28", "Be om pentest fra siste 12 mnd")
- **Lara-knapp**: «La Lara håndtere det» — gjenbruker eksisterende e-post-flyt for å sende forespørsel til leverandøren

## UI

**Gap-analyse-fanen:**
```text
┌─────────────────────────────────────────────────────┐
│ Velg rammeverk:  [Normen ▼]  [Kjør analyse]         │
│                                                     │
│ Resultat: Visma Software AS  vs  Normen             │
│ ┌──────────────────────────────────────┐            │
│ │ Score 64%   ████████████░░░░░░░      │            │
│ │ 18 oppfylt · 7 delvis · 5 mangler    │            │
│ └──────────────────────────────────────┘            │
│                                                     │
│ ▼ Styring (4/6)                                     │
│   ✓  Krav 5.1 Sikkerhetsledelse — DPA dekker        │
│   ⚠  Krav 5.4 Risikovurdering — Mangler oppdatert   │
│        → [Be Lara hente] [Last opp selv]            │
│   ✗  Krav 5.7 Gjennomgang — Ikke dokumentert        │
│ ▶ Drift og sikkerhet (8/10)                         │
│ ▶ Personvern (4/6)                                  │
│ ▶ Tredjepart (2/3)                                  │
│                                                     │
│ [Eksporter PDF]   [Del med leverandør]              │
└─────────────────────────────────────────────────────┘
```

Mangler det dokumentasjon, viser et **«Forbedre score»-banner** med snarvei til "Be om dokumenter" som bruker eksisterende dokumentforespørsel-flyt.

**Bulk-inngang fra dashboard:**
- Ny knapp på `/vendors`: "Gap-analyse på prioriterte" → wizard:
  1. Velg leverandører (forhåndsvalgt: alle med kritikalitet «høy»/«kritisk»)
  2. Velg ett rammeverk
  3. Kjør → sammenstilt rapport med score per leverandør + nedlastbar PDF

## Rammeverkskatalog

I tillegg til eksisterende rammeverk (NIS2, ISO 27001, GDPR, SOC2, NSM, DORA m.fl.) legges **Normen for informasjonssikkerhet og personvern i helse- og omsorgssektoren** til i `frameworkDefinitions.ts`, slik at den kan velges både i onboarding og i gap-analyser.

Initialt rulles gap-analyse-mappingene ut for fire rammeverk: **Normen, NIS2, ISO 27001, GDPR**. Resten kommer "snart" med en låsetilstand.

## Teknisk

**Nye tabeller (migration):**

- `framework_control_mappings` — mapper hvert `compliance_requirements.requirement_id` til ett eller flere "kontroll-signaler" (samme nøkler som brukes i `useTrustControlEvaluation`, f.eks. `dpa_verified`, `vendor_data_location`, `system_access_logging`). Inneholder `framework_id`, `requirement_id`, `signal_key`, `weight`, `evidence_doc_types[]` (f.eks. `["dpa","soc2"]`).

- `vendor_gap_analyses` — lagrer kjørte analyser: `id`, `asset_id`, `framework_id`, `created_at`, `created_by`, `score`, `summary jsonb` (per-domene), `results jsonb` (per-krav status + bevis + AI-begrunnelse). RLS: lese/skrive for autentiserte brukere i samme org.

**Ny edge function:** `analyze-vendor-gap`
- Input: `{ asset_id, framework_id }`
- Henter leverandør, dokumenter (`vendor_documents` + Storage), kontrollsignaler fra `useTrustControlEvaluation`-logikken (flyttes til delt util `src/lib/trustControlSignals.ts` så både client og function bruker samme regler), og rammeverkets krav.
- For dokumentbaserte krav: kaller Lovable AI Gateway (`google/gemini-2.5-flash`) med dokument-utdrag + spørsmål "Gir dette bevis for krav X?". Returnerer status + sitat + tillit (0–1).
- Lagrer resultat i `vendor_gap_analyses`, returnerer rapporten.
- Bruker eksisterende `LOVABLE_API_KEY`. Kostnad estimeres og trekkes fra `company_credits` (~3–8 credits per analyse avhengig av antall dokumenter).

**Nye komponenter:**
- `src/components/asset-profile/tabs/VendorGapAnalysisTab.tsx` — fanen
- `src/components/vendor-dashboard/BulkGapAnalysisDialog.tsx` — bulk-wizard
- `src/components/vendor-dashboard/generateGapAnalysisReport.ts` — PDF-eksport (jsPDF, samme stil som `generateVendorPortfolioReport.ts`)
- `src/hooks/useVendorGapAnalysis.ts` — react-query hook for å hente/kjøre analyse
- `src/lib/trustControlSignals.ts` — ekstrahert signal-evaluering (delt med edge function via lett kopi siden edge functions ikke kan importere fra `src/`)

**Endringer i eksisterende filer:**
- `src/pages/AssetTrustProfile.tsx`: legg til `gap-analysis` som ny entry i `allVendorTabs` + render `<TabsContent>` for den.
- `src/lib/frameworkDefinitions.ts`: legg til Normen.
- `src/components/vendor-dashboard/VendorPortfolioActions.tsx` (eller dashbord-header): legg til "Gap-analyse"-knapp som åpner bulk-dialogen.
- `supabase/config.toml`: ingen endring (default `verify_jwt = false`).

**Seeding av mappings:** Migration inkluderer initialt seed for ~30 sentrale krav i Normen, NIS2, ISO 27001 og GDPR, mappet til signal-nøkler vi allerede evaluerer. Resten kan utvides senere.

## Estimert omfang
- 1 migration (2 tabeller + seed)
- 1 edge function (~250 linjer)
- 4 nye komponenter + 1 hook + 1 util
- Endringer i 3 eksisterende filer

## Spørsmål før vi bygger
1. Skal gap-analyser **lagres historisk** (vise utvikling over tid) eller bare siste? Foreslår: lagres alle, siste vises som standard.
2. Skal **kreditter trekkes per analyse** (foreslått), eller skal det være gratis innenfor abonnementet?
3. Bulk-analyse: **én PDF samlet** eller én PDF per leverandør i et zip? Foreslår: én samlet rapport.