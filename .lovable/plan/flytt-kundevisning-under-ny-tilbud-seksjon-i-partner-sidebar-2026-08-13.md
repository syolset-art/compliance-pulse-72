Flytt Kundevisning under ny «Tilbud»-seksjon i partner-sidebaren

1. Endre `PartnerNav` i `src/components/Sidebar.tsx`:
   - Fjern `Kundevisning` fra toppnivå-listen (`items`).
   - Legg til en sammenleggbar seksjon «Tilbud» (norsk) / «Offers» (engelsk) rett under «Produkter og tjenester».
   - Plasser `Kundevisning` med samme `Eye`-ikon, lenke til `/msp-customer-view` og aktiv markering som underpunkt under seksjonen.
   - Sørg for at seksjonen åpnes automatisk når brukeren er på `/msp-customer-view`.
   - Behold gjeldende i18n-mønster (inline `isNb`-sjekk eller oversettelsesnøkler).