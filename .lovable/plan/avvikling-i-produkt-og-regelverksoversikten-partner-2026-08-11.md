# Avvikling i produkt- og regelverksoversikten (partner)

I dag kan partneren aktivere og endre nivå på kundens produkter og regelverk, men ikke avvikle dem. Produktsiden under Virksomhet (Innstillinger > Produkter) har allerede en komplett avviklingsflyt. Den flyten kopieres til kundens «Produkter og regelverk».

## Hva som gjenbrukes fra Virksomhet-siden

- Samme avviklingsdialog (årsak, datavalg: last ned / overfør / behold, bekreftelse, oppsigelse ut inneværende periode, 90 dagers oppbevaring).
- Samme «Sagt opp — aktiv til <dato>»-merking på kortet og «Angre oppsigelse»-knapp.
- Samme «Avvikle»-lenke ved siden av hovedknappen på kortet.

## Endringer

1. **Produktkort (Mynder Core, Leverandørmodul, Eiendeler)**
   - «Avvikle» vises på aktive produkter og åpner avviklingsdialogen.
   - Etter bekreftelse settes produktet til «Sagt opp», med dato for når det utløper og mulighet for å angre.
   - Trust Center og Modenhetsvurdering forblir V2 og får ingen avviklingsknapp.

2. **Regelverkskortet**
   - «Avvikle» åpner en liste over kundens aktive regelverk der partneren velger hvilke som skal avvikles (ett, flere eller alle).
   - Bekreftelse går gjennom samme dialog, med tydelig konsekvens: krav og dokumentasjonsstatus beholdes i 90 dager.
   - Avvikles alle regelverk, settes kortet til «Sagt opp» på samme måte som produktene.

3. **Kvittering og neste steg**
   - Etter avvikling vises en kort kvittering (samme mønster som ved aktivering/nivåendring) med dato, hva som skjer med data, og lenke til fakturagrunnlaget.

4. **Fakturagrunnlag**
   - Avviklede/oppsagte linjer merkes med sluttdato slik at partneren ser hva som faller bort ved neste fakturering.

## Teknisk

- `src/components/msp/CustomerServicesAndProductsTab.tsx`: koble på `RetireModuleDialog`, bruke eksisterende `cancelCustomerModule` / `resumeCustomerModule` fra `src/lib/customerModuleState.ts`, sende `cancelAtLabel`, `onDeactivate` og `onResume` til `ModuleCard`.
- Regelverksavvikling: nytt lite valgsteg (gjenbruker eksisterende sjekkboks-/pille-mønster i samme fil) før `RetireModuleDialog` med `moduleId: "frameworks"`.
- Logg avviklingen til `module_cancellations` per kunde, tilsvarende `src/pages/Subscriptions.tsx`.
- Kvittering via eksisterende `ModuleChangeReceiptSheet` med ny variant `kind: "retire"`.
