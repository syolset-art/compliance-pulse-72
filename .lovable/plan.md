# Smalere bransjekolonne og responsive kolonner i kundetabellen

## Mål
Modenhet skal alltid være synlig, bransjekolonnen skal ta mindre plass, og på brett/mobil skal tabellen som standard kun vise Kunde, Salgspotensial og Modenhet — med mulighet til å slå på de andre kolonnene selv.

## Hva som endres

1. **Bransje smalere**
   - Kolonnebredden reduseres fra 140px til ca. 96–110px, med avkortet tekst (ellipsis) og full bransje i tooltip ved hover.

2. **Modenhet forsvinner ikke ut av bildet**
   - Kolonnene "Anbefalte produkter og tjenester" og "Aktivert" får tak på bredden (maks-bredde i stedet for kun min-bredde), slik at de ikke presser Modenhet ut.
   - Modenhet og Salgspotensial beholder fast bredde til høyre.

3. **Standardkolonner per skjermstørrelse**
   - Mobil og brett (under 1024px): Kunde, Salgspotensial, Modenhet.
   - Desktop (1024px og over): som i dag — alle kolonner.
   - Brukeren kan fortsatt skru på/av kolonner via "Kolonner"-menyen, og valget huskes.
   - På smale skjermer kan tabellen scrolles vannrett hvis brukeren slår på flere kolonner.

## Teknisk

- Fil: `src/pages/MSPDashboard.tsx`
- `COLUMN_MIN_BP` justeres: `customer: 0`, `potential: 0`, `score: 0`, `recommendations/activated/industry: 1024`, `country: 1280`.
- `COLUMN_STORAGE_KEY` bumpes til `msp_dashboard_columns_v6` slik at eksisterende brukere får de nye standardene.
- Bransje-`TableHead`/celle: `w-[100px]` + `truncate` + tooltip.
- Anbefalinger: `min-w-[280px]` erstattes av `w-[300px]`; Aktivert: `w-[200px]`; badge-containere får tilsvarende `max-w`.
