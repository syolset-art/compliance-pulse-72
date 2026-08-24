# Rådgivningstimer som del av regelverks­aktivering

Partneren skal kunne legge til oppstartskost på alle produkter (finnes allerede) — og for **Regelverk** skal oppstartskosten bli til «rådgivning ved aktivering»: timer som automatisk følger med når et regelverk slås på hos en kunde, og som kan legges i et tilbud.

## Slik formuleres det (brukervennlig språk)

**I produktlisten (klikk på «Regelverk»):**
- Seksjonen heter **«Rådgivning ved aktivering»** (ikke «Oppstartskost»).
- Bryter: *«Legg til rådgivningstimer når du aktiverer et regelverk»*
- Forklaring: *«Timene følger automatisk med når regelverket slås på hos kunden, og kan tas med i tilbudet. Du fakturerer dem som et engangsbeløp.»*
- Timer-felt med live-pris: «6 timer × 1 500 kr/t = 9 000 kr engangs per aktivering».

**Ved aktivering hos kunde (aktiveringsdialogen):**
- Under hvert regelverk står det: *«Inkluderer 6 t rådgivning ved aktivering · 9 000 kr engangs»* — med en liten «Fjern»-lenke hvis timene ikke skal med denne gangen.
- Bekreft-knappen viser hele bildet: «Aktiver for 290 kr/mnd + 9 000 kr engangs».
- Ny lenke i dialogen: **«Lag tilbud med rådgivningstimer i stedet»** — åpner tilbudsdialogen der timene ligger ferdig som tilbudslinjer.

## Flyt

1. Partner åpner «Regelverk» i produktlisten → slår på rådgivning ved aktivering, justerer timer.
2. Neste gang partner aktiverer et regelverk hos en kunde, vises timene tydelig i dialogen, kan fjernes per aktivering, og speiles i prisknappen.
3. Vil partner selge timene som oppdrag først, velger de «Lag tilbud med rådgivningstimer i stedet» — tilbudet åpnes forhåndsutfylt med aktiveringstimene (og rådgivningspakken hvis den finnes).

## Teknisk

- `src/components/msp/PartnerProductList.tsx`: For produktet `frameworks` byttes «Oppstartskost»-seksjonen i `ProductEditSheet` til «Rådgivning ved aktivering» med bryter + timer (bryter = timer > 0; slås på med standard 6 t fra `FRAMEWORK_ACTIVATION_HOURS`). Gjenbruker lagringsnøkkelen `msp.productSetupHours` slik at verdien deles med resten av plattformen. Rad-teksten viser «+ X t rådgivning ved aktivering».
- Ny liten helper `src/lib/activationHours.ts`: leser aktiveringstimer for regelverk fra localStorage (felles kilde for liste, dialog og tilbud).
- `src/components/msp/ActivateRecommendationsDialog.tsx`: For ramme-elementer vises timene som underlinje med «Fjern»-valg; engangsbeløpet summeres og vises i bekreft-steget og på knappen («Aktiver for X kr/mnd + Y kr engangs»). Ny lenke «Lag tilbud med rådgivningstimer i stedet» kobles til eksisterende `onMoveToOffer`.
- `src/components/msp/MSPCreateOfferDialog.tsx`: `handleAddFramework` bruker partnerens konfigurerte aktiveringstimer (fra helperen) i stedet for den harde standarden på 6 t.
- Ingen databaseendringer — innstillingen lagres lokalt, likt eksisterende oppstartskost.
