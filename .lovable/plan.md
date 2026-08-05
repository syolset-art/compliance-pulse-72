# Dekning og dokumentasjon i tilbudet

Når partneren har huket av anbefalte produkter og tjenester og åpner "Tilbud", skal tilbudsdialogen vise hva kunden faktisk får: hvilke krav tjenestene dekker, hvilken dokumentasjon som kan produseres, og hva som mangler uten et aktivert regelverk.

## Ny seksjon: "Dette dekker tilbudet"

Plasseres rett over Aktiviteter i tilbudsdialogen, kompakt og sammenleggbar.

For hver valgte tjeneste/modul vises én rad:

```text
Leverandørmodul                                   3 krav · 2 dokumenter
  GDPR › Art. 28 Databehandlere        Aktivert
  NIS2 › Art. 21 Leverandørkjede       Ikke aktivert
  Dokumentasjon: Databehandleroversikt, Leverandørvurdering   (Lara-utkast)
```

- Krav hentes fra eksisterende mapping-motor (tjenestenavn -> Regelverk › Krav), kun treff med høy/middels konfidens.
- Dokumentasjon hentes fra eksisterende dokumentasjonshint per krav, med markering av hva Lara kan lage førsteutkast av.
- Hvert krav merkes mot kundens regelverk: Aktivert eller Ikke aktivert.
- AI-forbehold vises via den eksisterende AI-mapping-opplysningen (forslag fra AI-agent, ikke juridisk fasit).

## Regelverk som ikke er aktivert

Under listen, én kort kommersiell linje når minst ett krav treffer et ikke-aktivert regelverk:

> Uten NIS2 aktivert får kunden leverandørmodulen — men ingen modenhetsscore eller rapport som viser hvor de står. Legg til NIS2 for målbar effekt.

Med en klikkbar knapp "Legg til NIS2 i tilbudet" som legger inn aktivering som en egen aktivitet med timeestimat. Det er valgfritt — tilbudet kan sendes uten, og ingenting blokkeres.

## Med i tilbudsdokumentet

En bryter "Vis dekning i tilbudet" (på som standard) tar med en kort dekningstabell (Tjeneste, Regelverk › Krav, Dokumentasjon) i forhåndsvisning og PDF, slik at kunden ser verdien.

## Teknisk

- `src/components/msp/MSPCreateOfferDialog.tsx`: nye props `activeFrameworkIds`, `recommendedFrameworkIds`, ny seksjon + PDF-blokk.
- Ny `src/components/msp/OfferCoveragePanel.tsx` for seksjonen (holder dialogfilen håndterbar).
- Ny ren funksjon i `src/lib/offerCoverage.ts` som kombinerer `serviceMappingSuggester.ts` (krav), `requirementDocumentationHints.ts` (dokumenter) og `documentDeliverables.ts` (timer/Lara-utkast) til dekning per tjeneste.
- `src/pages/MSPDashboard.tsx`: sender kundens aktive og anbefalte regelverk inn i dialogen.
- Ingen databaseendringer.
