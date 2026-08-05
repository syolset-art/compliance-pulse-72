# Etter aktivering: jobbe videre nå eller senere

I dag dukker dialogen "Jobbe videre hos {kunde}?" opp noen steder etter aktivering, men ikke alle, og partneren kan ikke skru den av. Den skal bli en fast, gjenkjennelig avslutning på alle aktiveringer – med mulighet til å velge "senere" og til å slippe meldingen i framtiden.

## Hva som gjøres

1. **Samme valg overalt etter aktivering**
   Når en aktivering er fullført (produkter og tjenester, Trust Center, regelverk – enkeltvis, direkte fra kundeoversikten, eller i bulk) vises samme dialog:
   - "Jobb videre nå" – bytter til kundens organisasjon og går rett til det som ble aktivert
   - "Senere" – lukker dialogen, aktiveringen er allerede gjennomført
   - Avkryssingsboks nederst: "Ikke spør meg om dette igjen"

2. **Tydelig at aktiveringen er ferdig**
   Dialogen åpner med en bekreftelse på hva som er aktivert hos kunden, slik at "Senere" ikke oppleves som å avbryte noe.

3. **Husk valget**
   Hukes boksen av, hoppes dialogen over ved senere aktiveringer, og partneren får i stedet en bekreftelsesmelding (toast) med en snarvei "Gå til kunden". Valget kan skrus på igjen under Innstillinger > Partner, i en linje som heter "Spør om å jobbe videre hos kunden etter aktivering".

4. **Bulk-aktivering på flere kunder**
   Når det aktiveres hos flere kunder samtidig, spørres det ikke om kontekstbytte (ingen enkelt kunde å gå til) – der vises bare bekreftelsen.

## Teknisk

- `src/components/msp/EnterCustomerContextDialog.tsx`: legg til "Aktivert"-bekreftelse øverst, endre "Ikke nå" til "Senere", legg til Checkbox som skriver preferansen.
- Ny liten hook `src/hooks/usePostActivationPrompt.ts`: leser/skriver preferansen (localStorage-nøkkel per partnerbruker) og eksponerer `shouldPrompt` + `promptOrToast(...)` slik at alle kall-steder oppfører seg likt.
- Koble på de stedene som mangler prompten i dag: `src/pages/MSPCustomerDetail.tsx` (ActivateRecommendationsDialog), `src/components/msp/MSPCustomerRegulationsTab.tsx`, `src/components/msp/ActivateTrustCenterDialog.tsx` (bruk eksisterende steg 3 "Bli her / Jobb med Trust Profilen" via samme hook), `src/components/msp/NeedsAnalysisWizardDialog.tsx` (kun bekreftelse ved flere kunder). Behold eksisterende oppførsel i `MSPDashboard.tsx` og `CustomerServicesAndProductsTab.tsx`, nå via hooken.
- Innstillingslinje legges i partnerinnstillingene (`src/components/msp/MSPServiceSettingsTab.tsx`-mønsteret) med samme redigér/lagre-stil som resten.
- Kun semantiske tokens, norsk tekst i tråd med resten av MSP-flatene.
