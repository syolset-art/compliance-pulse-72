
## Endring

I `src/components/msp/MSPServiceCatalogTab.tsx` (foreslåtte tjenester-tabellen):

1. **Fjern** den nye info-knappen med klartekst-linjen ("Gjør det enklere å oppfylle kravene · …") under regelverks-chipsene i «Krav tjenesten støtter»-kolonnen.

2. **Legg til en ny kolonne** «Rolle» mellom «Krav tjenesten støtter» og handlings-kolonnen:
   - Viser rollene som små pills (f.eks. `Dokumenterende`, `Muliggjørende`), basert på `getMappingRoles` aggregert over alle mappings for malen.
   - Kompakt bredde (~w-40), pills bryter til ny linje ved behov.
   - Hver pill har tooltip med `ROLE_META[role].description` (klartekst-forklaring) slik at brukeren kan lese mer ved hover.
   - Hvis ingen roller: vis «—».

3. **Oppdater `<thead>`** med den nye kolonnen.

## Teknisk

- Kolonnene blir: [ikon] · Tjeneste · Krav tjenesten støtter · Rolle · [handling]
- Pills bruker eksisterende `bg-muted` stil som chipsene, med `Tooltip` fra shadcn.
- Ingen endringer i `serviceLibrary.ts` — bruker eksisterende `ROLE_META` og `getMappingRoles`.
- `formatRoleVerbs` og `ServiceRole`-importen kan beholdes (brukes andre steder) eller ryddes hvis ubrukt.

Vil du at rollene også skal vises per rad i «Mine tjenester»-tabellen lenger ned, eller kun i foreslåtte tjenester?
