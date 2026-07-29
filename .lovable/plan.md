# Søkefelt: skriv en tjeneste → se regelverk og krav → legg til i katalogen

## Mål
Alltid-synlig søkefelt der partneren skriver inn et tjenestenavn og umiddelbart får en filtrert liste over regelverk og konkrete kontrollpunkter tjenesten sannsynligvis dekker — med mulighet for å legge tjenesten fast til i egen katalog.

## Plassering
Inline i `MSPServiceCatalogTab.tsx`, på «Mine»-fanen, som en kompakt seksjon rett over katalog-listen. Ikke en dialog — søkefeltet står synlig hele tiden, og resultatpanelet dukker opp under feltet så snart det er tekst.

## UI
- Input med søkeikon, placeholder: «Beskriv en tjeneste — se hvilke regelverk og krav den dekker».
- Tomt felt: ingenting under (ren tilstand, tar ikke plass).
- Med tekst (debounced ~250 ms → `suggestControlPoints({ name })` fra `src/lib/serviceMappingSuggester.ts`):
  - Resultater gruppert per regelverk:
    - Framework-chip (via `getFrameworkTheme`)
    - Kontrollpunkter som små chips: `A.5.15 · Tilgangsstyring`
    - Matchede nøkkelord som muted mikro-tekst
  - Toppresultatet markert med tynn primær-ramme.
- Ingen treff: «Ingen tydelige treff. Prøv nøkkelord som beskriver aktiviteten (patch, awareness, DPO, backup …).»
- Primær-CTA når det finnes treff: **«Legg til i katalogen»**
  - Bygger en `PartnerService` med navn fra søkefeltet og `frameworkMappings` aggregert fra treffene (gruppert per `frameworkId`, med `controlIds` og `frameworkLabel`).
  - To varianter av CTA:
    - Rask: legger direkte til i «Min tjenestekatalog» via samme add-flyt som brukes ellers på siden, med toast «Lagt til i katalogen».
    - Rediger først: sekundærknapp «Rediger før lagring» → åpner eksisterende `CustomServiceDialog`/`ServiceForm` forhåndsutfylt.
  - Etter lagring: søkefeltet tømmes og den nye tjenesten scrolles inn i katalog-listen.
- Duplikat-vakt: hvis en tjeneste med samme navn allerede ligger i katalogen, byttes primær-CTA til «Allerede i katalogen» (disabled) med lenke til kortet.

## Filer
- Endre: `src/components/msp/MSPServiceCatalogTab.tsx` — søkefelt-seksjon, state, add-handler som gjenbruker eksisterende add-logikk.
- Ny (for lesbarhet): `src/components/msp/ServiceCoverageSearch.tsx` — eier input, resultatpanel og CTA-er, mottar `onAdd(service)` og `existingServices` som props.
- Gjenbruk: `suggestControlPoints`, `getFrameworkTheme`, `CustomServiceDialog`/`ServiceForm`, eksisterende «legg til tjeneste»-flyt og toast.

## Ikke-mål
- Ingen ny edge function / AI-kall — regelbasert suggester holder.
- Ingen endringer i datamodell, lagring eller playbook-tester.
