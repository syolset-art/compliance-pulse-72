# Vis kontrollpunkter i partnertilbudet

I dag viser `MSPCreateOfferDialog` kun aktivitetene/oppgavene Lara har foreslått. Tilbudet skal også vise hvilke regelverk-kontrollpunkter leveransen dekker, slik kunden ser hva de faktisk betaler for.

## Hva som endres (kun UI/presentasjon)

**1. `MSPCreateOfferDialog.tsx`**

- Ny prop `coveredControls?: Array<{ frameworkId: string; frameworkLabel: string; controlIds: string[] }>` (samme struktur som `ServiceFrameworkMapping` i serviceCatalog).
- Ny seksjon **"Dekker kontrollpunkter"** vises tre steder:
  - **Edit-visning**: rett under "Aktiviteter", før "Vedlegg". Kompakt liste pr rammeverk: rammeverk-pille (samme `getFrameworkTheme`-stil som `ServiceEvidenceSection` bruker) + linje per `controlId` med ID + menneskelig navn via `getControlLabel(frameworkId, controlId)` (fra `src/lib/serviceControlLabels.ts`). Read-only — partneren redigerer ikke disse.
  - **Preview-visning** (papir-utseende): egen blokk over "Vedlegg" med samme innhold, mer formell stil (rammeverk-overskrift + bulletpunkter).
  - **PDF (`handleDownloadPdf`)**: ny seksjon "DEKKER KONTROLLPUNKTER" rett etter totals-blokken, før vedlegg. Pr rammeverk: en linje med rammeverk-label, så `• ID — Etikett` per kontrollpunkt. Bruker eksisterende `doc.splitTextToSize` + sideskift-håndtering (`if (y > 760) doc.addPage()`).
- Liten oppsummering ved totals: "Dekker N kontrollpunkter på tvers av M regelverk".
- Hvis `coveredControls` mangler/er tom: seksjonen skjules helt (ingen tom tilstand).

**2. `MSPMaturityServiceMatrix.tsx`**

- Utvid `offerCtx`-state med `coveredControls?`.
- Der `setOfferCtx({...})` kalles fra tjenesteforslag/leveranse: hent kontrollpunkter fra `getService(serviceId)?.frameworkMappings` og send inn. For anbefalinger uten serviceId, fall tilbake til recommendation-ens `frameworkId` matchet mot relevante service-mappings, eller hopp over.
- Send `coveredControls={offerCtx.coveredControls}` videre til `<MSPCreateOfferDialog />`.

**3. `QuestionnaireDispatchCard.tsx`**

- Send med `coveredControls` der dialogen åpnes (basert på relatert service/framework). Hvis ikke tilgjengelig, la prop være undefined — dialogen skjuler seksjonen automatisk.

## Filer som endres

- `src/components/msp/MSPCreateOfferDialog.tsx` — ny prop + 3 visningssteder + PDF-seksjon.
- `src/components/msp/MSPMaturityServiceMatrix.tsx` — utvid `offerCtx`, propager.
- `src/components/msp/QuestionnaireDispatchCard.tsx` — propager `coveredControls` der mulig.

## Ut av scope

- Ingen endringer i datamodell, serviceCatalog eller tasks.
- Ingen redigering av kontrollpunkter fra partneren — disse styres fortsatt av Lara/katalogen.
- Ingen endring i selve gap-analyse-vedlegget.
