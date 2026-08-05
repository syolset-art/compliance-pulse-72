# Gå inn i kundens organisasjon etter aktivering

Når en partner aktiverer et produkt (f.eks. Mynder Core) eller et regelverk hos en kunde, skal de få tilbud om å hoppe rett inn i kundens organisasjon og jobbe videre der — uten å måtte bytte organisasjon manuelt.

## Brukerflyt

1. Partner aktiverer ett eller flere valg i «Aktiver hos {kunde}» (fra kundeoversikten eller kundekortet).
2. Rett etter bekreftelsen vises en ny, kort dialog:
   - Tittel: «Jobbe videre hos {kunde}?»
   - Tekst: «{Produkt/regelverk} er aktivert. Vil du bytte til {kunde} sin organisasjon og starte der?»
   - Hvis flere ting ble aktivert: en liten liste der partneren velger hva de vil starte med (radioknapper).
   - Knapper: «Ikke nå» og «Gå til {kunde}».
3. Ved «Gå til»: aktiv organisasjon byttes til kunden, arbeidsmodus settes til kundevisning, og brukeren sendes til riktig sted:
   - Mynder Core → systemoversikten
   - Leverandørmodul → leverandøroversikten
   - Regelverk → det aktuelle regelverkets kravside
4. Øverst vises et tydelig felt om at man nå jobber i kundens organisasjon på vegne av partneren, med en «Tilbake til partneroversikten»-knapp.

## Teknisk

- `ActiveOrganizationContext` utvides slik at en MSP-kunde kan settes som aktiv organisasjon (type `partner`), ikke bare egne `company_profile`-rader. Kunden hentes fra `msp_customers` (id, navn, org.nr) og lagres i localStorage sammen med `activeOrgId` slik at valget overlever refresh.
- Ny komponent `src/components/msp/EnterCustomerContextDialog.tsx`: mottar `customerId`, `customerName` og listen over nettopp aktiverte elementer, viser valg og utfører bytte + navigasjon.
- `ActivateRecommendationsDialog` får en ny `onEnterCustomer`-utløser: etter vellykket aktivering sendes de aktiverte elementene oppover i stedet for bare `onActivated()`.
- Innkobling begge steder dialogen brukes: `src/pages/MSPDashboard.tsx` og `src/components/msp/CustomerServicesAndProductsTab.tsx`.
- Rutevalg per element (modulnøkkel/rammeverk-id → sti) legges i en liten hjelpefil, f.eks. `src/lib/customerEntryRoutes.ts`.
- `OrganizationContextBanner`/toppfeltet utvides med «du jobber hos {kunde}»-tilstand og retur til `/msp-dashboard`.
- `WorkspaceModeContext` settes til `compliance` ved inngang, og tilbake til `partner` ved retur.

## Avgrensning

Ingen endringer i tilgangsstyring eller databasepolicyer i denne omgangen — partneren ser kundens data via eksisterende tilganger.
