# Les og godkjenn dokument — full flyt med Lara-vurdering

I dag åpner "Les og godkjenn dokument" bare et lite Lara-utkast i aktivitetsraden. Vi gjør om dette til en tydelig 4-stegs dialog som speiler hva Mynder faktisk gjør med dokumentet.

## Terminologivalg: «Berikelse»

Etablert ord i Mynder (brukes i `enrichmentPercent`, `MynderGuidanceTab`, `BulkGapAnalysisDialog`). Andre vurderte alternativer:

- **Kunnskapsgrunnlag** — for langt, mindre presist
- **Datakilde / Kilde** — teknisk, men mister koblingen til at det *forbedrer* analysen
- **Bevis / Evidens** — kolliderer med "Evidence level" i Trust-terminologien
- **Innsikt** — for vag

**Konklusjon:** behold **«Berikelse»** som primærord, men forklar det første gang i dialogen: *"Berikelse betyr at Lara bruker dokumentet som kilde i fremtidige analyser av leverandøren."* Dette holder konsistent språk på tvers av modulene.

## Ny flyt — 4 steg i én dialog

```text
[1 Les]  →  [2 Lara analyserer]  →  [3 Foreslått påvirkning]  →  [4 Lagt til]
 Sammendrag    Spinner ~1 sek         Kontroller / modenhet /     Bekreftelse
 + Godkjenn                           risiko + "Legg til som      + toast
                                       berikelse"-knapp
```

**Steg 1 — Les og godkjenn**
- Lara's sammendrag (3 nøkkelpunkter trukket ut av dokumentet)
- Info-tekst: *"Når du godkjenner, vurderer Lara hvordan dokumentet påvirker leverandørens analyse — du bestemmer deretter om det skal brukes som berikelse."*
- Knapper: **Avbryt** · **Godkjenn dokument**

**Steg 2 — Lara analyserer (~1 sek)**
- Pulserende Sparkles-ikon + spinner
- Tekst: *"Lara vurderer påvirkning på kontroller, modenhet og risiko …"*

**Steg 3 — Foreslått påvirkning**
- Kort i primær-tone med tre konkrete punkter:
  - `ShieldCheck` Påvirker 4 kontroller i området «Tredjepart»
  - `TrendingUp` Foreslår modenhet «Databehandleravtaler»: 2 → 3
  - `↓` Senker avledet risiko: Middels → Lav
- Forklaring av berikelse (én setning)
- Knapper: **Ikke nå** · **Legg til som berikelse**

**Steg 4 — Ferdig**
- Grønn check + "Berikelse lagt til"
- Sonner-toast: *"Lagt til som berikelse — Lara bruker nå dokumentet som kilde i leverandøranalysen."*
- Dialog lukker seg automatisk etter ~0.9 sek

## Filer som endres

**Ny fil:** `src/components/asset-profile/ApproveDocumentDialog.tsx`
- Stateful dialog som håndterer alle 4 steg internt
- Props: `open`, `onOpenChange`, `activity`, `onApproved`, `onAddedAsEnrichment`
- Bruker `sonner` toast for bekreftelse
- i18n NB/EN

**Endres:** `src/components/asset-profile/ActivityActionAffordance.tsx`
- For `activity.type === "document"`: erstatt dagens inline-popover med å åpne den nye dialogen
- Når `onApproved` triggres → marker aktiviteten som `closed` (via eksisterende `onLaraStart`-callback eller ny `onApproved`-callback)
- Andre aktivitetstyper beholder dagens flyt uendret

**Lett endring:** `src/components/asset-profile/tabs/VendorActivityTab.tsx`
- Hvis vi trenger en ny callback (`onAddedAsEnrichment`) for å oppdatere `enrichmentPercent` lokalt, sendes den ned via `ActivityActionAffordance`. Foreløpig holder vi oss til en toast og lar Lara-jobben vise seg via eksisterende statusoppdatering.

## Designnotater
- Bruker semantiske tokens (`bg-primary/5`, `text-success`, `border-primary/20`) — ingen hardkodede farger
- Apple-minimal: én dialog, tydelige steg, ingen skjemafelter
- WCAG: ikoner har tekst ved siden av seg, knapper har klare labels
