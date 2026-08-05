# Regelverk vises som et produktkort

I dag ligger «Regelverk» øverst på kundens fane «Tjenester og produkter» som et eget, bredt kort med to pille-rader. Det bryter med hvordan produktene under vises. Regelverk gjøres om til et kort av samme type som Mynder Core, Leverandørmodul, Systemer og Verdier — slik det allerede vises på siden «Produkter».

## Slik blir det

- Regelverk flyttes inn i produktrutenettet som det **første kortet**, i samme 2-kolonners grid.
- Kortet får samme oppbygning som de andre produktkortene:
  - Tittel «Regelverk» med nivå-pille (f.eks. «4 aktive regelverk»)
  - Kort beskrivelse
  - Linje som lister de aktiverte regelverkene (ISO 27001, GDPR, NIS2, DORA …) med «+n» når det er flere
  - Pris nederst til venstre (sum per måned for kundens betalte regelverk), knapp nederst til høyre
  - Knappen heter «Legg til regelverk» når noe er aktivert, «Aktiver» når ingenting er aktivert
- **Anbefalte regelverk** forsvinner ikke: de vises som en kompakt rad med klikkbare piller i kortets bunnfelt, med «Aktiver (n)»-knapp når partneren har valgt noen. Er det ingen anbefalinger, vises ingen rad.
- Overskriften «Produkter» over rutenettet endres til «Produkter og regelverk», og telleren teller regelverkskortet med.

Aktiveringsflyten er uendret: valgte regelverk går inn i den samme to-stegs dialogen med nivå/pris og vilkårsavkryssing.

## Teknisk

- `src/components/msp/CustomerServicesAndProductsTab.tsx`: fjern den frittstående `Card`-blokken for Regelverk (linje 200–271) og legg regelverk inn som første element i produkt-griden via `ModuleCard`.
- Bruk eksisterende `ModuleCard`-props: `breakdown` for aktiverte regelverk, `usage`/`usageLimit`/`usageSuffix` mot totalt antall i `frameworkDefinitions`, `action="manage" | "activate"`, og `footer` for anbefalte piller + «Aktiver (n)».
- Pris: 490 kr per aktivert betalt regelverk, samme sats som brukes i `activateSelectedFrameworks` i dag.
- Ingen endringer i data, backend eller aktiveringslogikk.
