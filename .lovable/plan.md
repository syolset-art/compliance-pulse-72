## Problem
Sparkles-knappen (linje 496) lar Lara foreslå tjenester på nytt, men wizardens resultat legger bare til nye anbefalinger. Hvis partneren utvider markedet (nye land, nye bransjer, nye regelverk), får de ingen hjelp til å **endre eksisterende tjenester** — bare til å legge til flere. Katalogen blir uendret selv om scope har flyttet seg.

## Løsning — «Oppdater scope med Lara» ved siden av re-forslag
Kun frontend, i `src/components/msp/MSPServiceCatalogTab.tsx`, `MSPLaraServiceWizard.tsx` og en ny liten diff-dialog. Ingen datamodell-endringer — vi bruker samme `extras`-state.

### 1. Fange scope-endringer i wizarden
Utvide `WizardAnswers` (allerede brukt) med et implisitt «forrige svar» lagret i `localStorage` (`msp-lara-wizard-answers-v1`).
Når partneren åpner wizarden på nytt:
- Forhåndsutfyll svarene med forrige runde.
- Etter fullføring sammenlign nytt vs. gammelt svar → produser et **scope-diff** (nye markeder, nye regelverk, nye bransjer, endret størrelse).

### 2. Diff-dialog «Lara har oppdaget endringer i scope»
Åpnes automatisk etter wizarden hvis diffen ikke er tom, i stedet for å bare legge til nye rader stille.
Innhold:
- **Kort oppsummering** av endringen: «Du har lagt til NIS2 og det svenske markedet.»
- **Anbefalte handlinger** i tre grupper med sjekkbokser (alle på som default):
  1. **Legg til** N nye tjenester som dekker de nye kravene (samme som i dag).
  2. **Utvid** M eksisterende tjenester med nye kontroll-mappinger (f.eks. legge til NIS2-mapping på «SOC-overvåkning»).
  3. **Marker for gjennomgang** K tjenester som ikke lenger er relevante for nytt scope (foreslå «Avvikle»).
- «Bruk valgte endringer» commit-knapp + «Avvis» + «Se detaljer» (åpner en tekstlig endringslogg).

### 3. Vis Lara-oppdateringer i «Min tjenestekatalog»
- Rader som ble utvidet får en subtil `Sparkles`-chip: «Lara har utvidet mappinger — se endring» → åpner endringsloggen.
- Rader som er markert for gjennomgang får en gul `AlertTriangle`-chip: «Foreslått avviklet — nytt scope dekker ikke lenger dette» med knapp «Avvikle» / «Behold».

### 4. Endring på Sparkles-knappen (den valgte)
- Skift label/tooltip fra «La Lara foreslå tjenester på nytt» → **«Oppdater tjenester med Lara»**.
- Under tooltip-linjen: «Bruk når du endrer marked, bransje eller regelverk.»
- Ingen endring på førstegangs-CTA (full outline-knapp beholder «La Lara foreslå tjenester»).

## Ikke i scope
- Ingen endring på datamodell, tilbud-låsing eller Mynder-produkter.
- Ingen backend/edge-funksjon — diffen kjører klient-side mot lagrede wizard-svar.
- Ingen automatisk avvikling — Lara foreslår, partneren bekrefter.

## Tekniske detaljer
- `WizardAnswers` persistert i `localStorage` som JSON.
- Ny fil `src/lib/laraScopeDiff.ts` med `diffAnswers(prev, next)` → `{ addedMarkets, addedFrameworks, removedFrameworks, addedIndustries, sizeChanged }` og `buildRecommendations(diff, extras, SERVICE_LIBRARY)` → `{ toAdd, toExtend, toReview }`.
- Ny komponent `src/components/msp/LaraScopeChangeDialog.tsx` (shadcn `Dialog` + `Checkbox` + `ScrollArea`).
- Utvide `ExtraService` runtime-metadata (in-memory) med `laraReviewReason?: string` og `laraExtendedMappings?: ServiceMapping[]` for chip-visning — ingen schema-endring.
- Wizard-callback `onComplete(answers)` beholder eksisterende oppførsel når diffen er tom (bakoverkompatibel).
