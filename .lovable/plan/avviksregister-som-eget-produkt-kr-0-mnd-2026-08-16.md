# Avviksregister som eget produkt (kr 0 / mnd)

Avviksregisteret skal bli et selvstendig produkt med samme aktiveringsflyt som de andre modulene — men uten kostnad. Menypunktet skal være skjult til organisasjonen (eller partneren på vegne av organisasjonen) har aktivert det og godkjent vilkårene.

## Slik blir opplevelsen

1. **Skjult som standard.** Nytt menypunkt «Avviksregister v2» vises ikke i sidemenyen før produktet er aktivert. Ruten `/deviations` viser en aktiveringsside hvis noen går rett dit.
2. **Aktivering fra Innstillinger → Produkter.** Nytt produktkort «Avviksregister» med pris «Inkludert – 0 kr/mnd», beskrivelse og «Les mer».
3. **Samme godkjenning som andre produkter.** Klikk på Aktiver → vilkårsdialogen (TermsGateDialog) med teksten om at tjenesten aktiveres umiddelbart og faktureres på neste faktura (her: 0 kr) → kvitteringsark med lenke rett inn i Avviksregisteret.
4. **Avslutte.** Samme «Avslutte»-flyt som øvrige produkter; menypunktet forsvinner når avslutningen trer i kraft.
5. **Partnerflyt.** Avviksregister legges til i partnerens produktliste per kunde, med samme aktiveringsdialog og 0 kr i pris. Aktivering hos kunden gjør menypunktet synlig i kundens arbeidsflate.

## Teknisk gjennomføring

- `src/lib/moduleActivationState.ts`: innfør en liste over «opt-in»-moduler der standardstatus er `inactive` (i dag er ukjente moduler `active`). `deviations` legges der. `getModuleState`/`getModuleStatus`/`getDeactivatedModules` respekterer dette.
- `src/lib/moduleActivationTargets.ts`: ny target `deviations` — tittel «Avviksregister», rute `/deviations`, `monthlyPriceKr: 0`, neste steg («Åpne Avviksregisteret», «Registrer første avvik»).
- `src/components/Sidebar.tsx`: `deviationsLink` rendres kun når modulen er aktiv (lytt på `modules:changed`, samme mønster som `assets`).
- `src/pages/Deviations.tsx`: hvis modulen ikke er aktiv, vis en enkel aktiveringstilstand med samme `useModuleActivation`-flyt i stedet for registeret.
- `src/pages/Subscriptions.tsx`: nytt produktkort for Avviksregister med pris 0, «Aktiver»/«Åpne», «Avslutte» og «Les mer»-tekst. Ingen endring i totalsummen.
- `src/components/msp/CustomerServicesAndProductsTab.tsx`: legg `deviations` i `PRODUCTS` med `FLAT_PRICE: 0`, slik at partneren kan aktivere det per kunde via eksisterende dialog.
- `src/locales/nb.json` / `en.json`: tekster for produktkort, aktiveringstilstand og kvittering.

Ingen databaseendringer — modulstatus følger dagens lokale demo-tilstand.
