# Gruppering av krav etter kontrollområde

## Problem

I «Krav og evaluatorer» finnes valget «Grupper etter kontrollområde», men listen rendres flat: `grouping`-tilstanden i `FrameworkRequirementsList.tsx` (linje 104) styrer ingenting — kravene rendres i én `filtered.map(...)` uten seksjoner. Derfor ser brukeren aldri de fem kontrollområdene.

Koblingen fra krav til område finnes allerede: hvert krav har `sla_category`, og `toCanonicalArea()` i `src/lib/controlAreas.ts` mapper den til en av de fem kanoniske nøklene (Styring og ansvar, Drift og sikkerhet, Identitet og tilgang, Personvern og datahåndtering, Tredjepart og verdikjede).

## Hva som bygges

1. **Faktisk gruppering.** Når «Grupper etter kontrollområde» er valgt, deles de filtrerte kravene inn i de fem områdene i kanonisk rekkefølge, via `toCanonicalArea(req.sla_category)`.
2. **Seksjonsoverskrifter.** Hver gruppe får en kompakt, sticky-lett overskrift med områdeikon (fra `CONTROL_AREAS`), navn på valgt språk og teller i formen «(oppfylt/totalt)», f.eks. «STYRING OG ANSVAR (0/5)» — samme uttrykk som i dagens stage-visning.
3. **Tomme områder skjules** når filter/søk gir null treff i området.
4. **Grupper etter status** gjøres tilsvarende reell: seksjoner for Ikke oppfylt / Delvis / Oppfylt / Ikke relevant, slik at begge fanene oppfører seg likt.
5. **Sammenleggbare seksjoner.** Klikk på overskriften folder gruppen sammen; alle er åpne som standard.
6. **Språk.** Overskrifter bruker `labelNb`/`labelEn` fra `CONTROL_AREAS`, slik at engelsk visning fungerer.

Kortene i seg selv (status til høyre, dokumentasjon, «Oppdater status») endres ikke — kun listen får struktur.

## Teknisk

- Fil: `src/components/regulations/FrameworkRequirementsList.tsx`.
- Trekk ut kortrenderingen i `filtered.map(...)` til en lokal `renderRequirement(req)`-funksjon, slik at samme markup gjenbrukes i begge grupperingsmoduser uten duplisering.
- Ny `useMemo` som bygger `groups: { key, label, Icon, accentClass, items }[]` av `filtered` for aktiv grupperingsmodus.
- Import `CONTROL_AREAS`, `CONTROL_AREA_KEYS`, `toCanonicalArea` fra `@/lib/controlAreas`; teller «oppfylt» via eksisterende `bucketOf(uiStates[id].progress) === "met"`.
- Ingen datamodell- eller backend-endringer.
