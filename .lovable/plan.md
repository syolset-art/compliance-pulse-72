# Leverandørmodulen som eget menypunkt

I dag ligger Leverandører som en underlenke inne i "Mynder Core"-seksjonen i sidemenyen. Leverandørmodulen er et eget produkt som aktiveres og faktureres separat, og skal derfor ligge på samme nivå som Mynder Core.

## Endringer

1. Fjern Leverandører fra Mynder Core-seksjonen — Core viser da Systemer, Arbeidsområder, Oppgaver, Avvik, Behandlingsprotokoll og Rapporter.
2. Legg Leverandører inn som eget toppnivå-punkt i menyen, rett etter Mynder Core-seksjonen, med samme visuelle stil som Trust Center og Styrerom (aktiv-markering med prikk og venstre kantlinje).
3. Punktet vises kun når leverandørmodulen er aktivert (samme tilgangsregel som i dag), og viser aktiverings-skjelettet mens modulen holder på å aktiveres.

## Teknisk

Alt skjer i `src/components/Sidebar.tsx`:

- `coreSectionItems` endres fra `[systemsLink, vendorLink, ...coreNav]` til `[systemsLink, ...coreNav]`.
- Ny toppnivå-lenke rendres fra `vendorLink` betinget av `showVendorsNormal && !partnerHides("registries")`, med `isVendorsActivating` → `ModuleSkeletonRow`.
- Aktiv-tilstand matcher `/vendors` og undersider (`/vendors/...`), slik at leverandørprofiler holder punktet markert.
- Separator-logikken justeres så seksjonsskillene fortsatt ser riktige ut når Core er skjult men Leverandører er aktiv.

Ingen ruter, tilganger eller prismodell endres.
