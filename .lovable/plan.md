# Plan: Agentisk gap-analyse for sikkerhetssjef

## Mål
Den nåværende `BulkGapAnalysisDialog` viser kun score + tre tall (implementert/delvis/mangler). En sikkerhetssjef trenger mer kontekst, og Lara skal automatisk foreslå en handlingsplan som kan godkjennes med ett klikk – eller utdypes med kort dialog hvis viktig info mangler.

## Endringer

### 1. Utvidet resultatvisning (sikkerhetssjef-perspektiv)
I `BulkGapAnalysisDialog.tsx` byttes flat liste ut med en to-nivå visning:

**Toppsammendrag (over listen):**
- Porteføljescore (snitt) + delta vs. forrige kjøring
- Antall kritiske gap totalt, fordeling per domene (Governance / Drift / Personvern / Tredjepart)
- "Største risiko nå" – topp 3 leverandører med høyest forretningsrisiko (kritikalitet × gap-vekt)
- Estimert tid-til-compliance basert på antall åpne gap

**Per leverandør (utvidbar rad):**
- Score + risikoring (grønn/orange/rød etter terskler i Core-memory)
- Mini-strek per domene (4 søyler) som viser hvor gapene ligger
- Knapp "Vis detaljer" → ekspanderer til:
  - Topp 3 manglende kontroller (kravreferanse + alvorlighet)
  - Sist mottatt bevis + alder
  - Hvilke regulatoriske artikler som trigges (NIS2 art., GDPR art.)
  - DPA / SLA / sertifiseringsstatus i klartekst

### 2. Lara-plan etter analyse (agentisk lag)
Når kjøringen er ferdig vises et nytt panel **"Laras forslag til plan"** øverst i dialogen:

```text
┌─ Lara har laget et utkast til oppfølgingsplan ────────────┐
│ Basert på 12 åpne gap foreslår jeg 5 tiltak.              │
│ Estimert effekt: +18 % portefølje-score, 4 uker.          │
│                                                            │
│ [ ] 1. Be om DPA fra 3 leverandører  · kritisk · e-post   │
│ [ ] 2. Risikomøte med Acme AS        · høy     · møte     │
│ [ ] 3. Innhent ISO 27001-bevis (×4)  · høy     · e-post   │
│ [ ] 4. Oppdater SLA hos 2 leverandører· medium · e-post   │
│ [ ] 5. Planlegg revisjon av Beta Inc · medium  · audit    │
│                                                            │
│ [Godkjenn alle]  [Juster]  [Spør meg først]               │
└────────────────────────────────────────────────────────────┘
```

- Forslagene genereres ved å mappe gap-resultater mot `vendorGuidanceData.ts` (som allerede har maler for DPA, SLA, risiko-møte) og berikes med kontaktperson + foreslått kanal.
- "Godkjenn alle" oppretter aktiviteter via samme path som `VendorActionCards` bruker i dag.
- "Juster" lar bruker fjerne enkelt-tiltak og endre eier/frist inline.
- "Spør meg først" trigger en mini-wizard (samme mønster som `ConfirmRiskDialog`) for tiltak hvor Lara mangler info – f.eks. "Hvem eier oppfølgingen av Acme?" eller "Skal vi godta selv-deklarert ISO eller kreve sertifikat?".

### 3. Lara-status under kjøring
I stedet for bare progress-bar viser vi tekstlinjer ("Henter bevis for Acme AS…", "Sammenligner kontroll 7.5.1…", "Foreslår tiltak…") – samme agentiske språk som brukes i Innboks-prosjektet.

### 4. Tom-tilstand etter godkjenning
Når planen er godkjent: dialogen viser kvittering med "5 aktiviteter opprettet · se i Aktivitet" + lenke, og et lite kort "Lara fortsetter å overvåke disse leverandørene".

## Tekniske detaljer

**Filer som endres:**
- `src/components/vendor-dashboard/BulkGapAnalysisDialog.tsx` – utvides betydelig; deles opp i:
  - `BulkGapAnalysisDialog.tsx` (orchestrator + state)
  - `GapAnalysisSummary.tsx` (ny – toppsammendrag)
  - `GapAnalysisVendorRow.tsx` (ny – ekspanderbar rad)
  - `LaraPlanProposal.tsx` (ny – agentisk planforslag + godkjenn-knapper)
  - `LaraPlanClarifyDialog.tsx` (ny – mini-wizard for manglende info)

**Datakilder:**
- Eksisterende edge function `analyze-vendor-gap` brukes som før, men responsen utvides med `top_missing_controls`, `domain_breakdown`, og `evidence_age` (oppdatering i `supabase/functions/analyze-vendor-gap/index.ts`).
- Plan-generering skjer klient-side ved å kombinere gap-resultat + `generateGuidanceForVendor` fra `src/utils/vendorGuidanceData.ts`. Ingen ny tabell.
- Aktiviteter opprettes via samme mønster som i `VendorActivityData` / eksisterende activity-create-flow.

**i18n:** Alle nye strenger legges til i `src/locales/nb.json` og `src/locales/en.json` under `vendor.gapAnalysis.*`.

**Designtokens:** Følger Core – primær lilla, status-farger via `bg-success`/`bg-warning`/`bg-destructive`, Apple-aktig minimalisme, runde badges for risiko (samme som risikofanen vi nettopp bygde).

## Hva sikkerhetssjefen får
1. Ett blikk: porteføljerisiko + hvor gapene ligger per domene.
2. Drill-down per leverandør med de faktiske manglende kontrollene og bevis-status.
3. En ferdig plan fra Lara – godkjenn med ett klikk, eller svar på 1-2 spørsmål når Lara er usikker.
4. Sporbarhet: alle godkjente tiltak havner som aktiviteter knyttet til riktig leverandør.
