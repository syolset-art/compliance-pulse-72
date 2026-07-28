## Mål
Gjøre "La Lara foreslå tjenester" mindre dominerende. Knappen skal være fremtredende første gang partneren er inne, men trekke seg tilbake etter det.

## Endringer i `src/components/msp/MSPServiceCatalogTab.tsx`

1. **Persistér "har sett Lara-veiviseren"-tilstand**
   - Ny `localStorage`-flagg `msp-lara-wizard-seen-v1`.
   - Settes til `true` når wizarden åpnes eller når partneren allerede har adopterte tjenester / curatedPicks.

2. **To visningsmoduser for Lara-knappen**
   - **Førstegang (flagget ikke satt, ingen adopterte tjenester):** vises som i dag — tydelig `outline`-knapp med Sparkles + tekst "La Lara foreslå tjenester", plassert oppe til høyre. Beholder dagens vekt slik at nye partnere finner den umiddelbart.
   - **Etter første gang:** kollapses til et lite, subtilt ikon-only trigger:
     - `variant="ghost"`, `size="icon"`, kun Sparkles-ikon i muted farge.
     - Plassert diskret i samme høyre-linje, ved siden av eksisterende Info-knapp.
     - Tooltip: "La Lara foreslå tjenester på nytt".
     - Hover gir svak bakgrunn slik at den er oppdagbar uten å konkurrere med "Beskriv egen tjeneste" og tabellen.

3. **Ingen andre endringer**
   - "Beskriv egen tjeneste"-knappen, Info-tooltip og Lara-banner (som allerede vises når det finnes anbefalinger) står som før.
   - Lara-banneret fungerer fortsatt som primær CTA for å nullstille/filtrere anbefalinger etter første kartlegging.

## Resultat
Nye partnere ser fortsatt tydelig CTA. Erfarne partnere får en ren side der Lara-triggeren er tilgjengelig som et lite ikon — ikke en permanent, dominerende knapp.
