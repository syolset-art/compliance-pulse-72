# Overstyr KI-anbefalingen: legg til egne tjenester og produkter

I dag viser kortet «Anbefalte produkter og tjenester» kun det KI-agenten har foreslått. Partneren skal kunne velge fritt fra hele katalogen og aktivere/tilby det, uavhengig av anbefalingen.

## Slik blir det

- Ny lenke/knapp nederst i kortet: **+ Legg til tjeneste eller produkt**.
- Den åpner en søkbar velger med to seksjoner:
  - **Mynder-produkter** (Mynder Core, Leverandørmodul, Assets, Trust Center, regelverk) — kan aktiveres direkte.
  - **Min tjenestekatalog** (partnerens egne tjenester) — leveres som oppdrag, går i tilbud.
  - Allerede aktiverte elementer vises som «Aktivert» og kan ikke velges på nytt.
- Valgte elementer legger seg som piller i kortet, på lik linje med de anbefalte, men uten oker-farge: nøytral pille med liten merking **Manuelt valgt** (tooltip: «Lagt til av deg — ikke foreslått av KI-agenten»).
- «Tilbud (n)» og «Aktiver (n)» fungerer likt for både anbefalte og manuelt valgte. Aktivering går gjennom samme dialog med vilkår og driftspartner-rolle.
- Manuelt valgte elementer telles med i **Salgspotensial** slik at tallet stemmer med det partneren faktisk planlegger å selge.
- Manuelt valg fjernes med et kryss på pillen.

## Teknisk

- Ny `src/components/msp/guidance/AddOfferItemDialog.tsx`: Command-basert søk over Mynder-produkter (fra `planConstants`/`moduleInfo`) og partnerens tjenestekatalog (`SERVICE_LIBRARY` + partnerens egne), filtrert mot `deriveActivatedProducts`. Returnerer `OfferSuggestion[]`.
- `src/lib/offerSuggestions.ts`: eksporter en `buildManualSuggestion(kind, id)`-hjelper som lager `OfferSuggestion` med riktig `price`/`hours`/`activatable`/`moduleKey`, slik at manuelle valg får samme form som de avledede.
- `CustomerRecommendationsCard.tsx`: lokal `manualItems`-state slås sammen med `deriveProductSuggestions` i visning, plukking, tilbud, aktivering og potensialberegning (potensialet beregnes lokalt fra listen i stedet for kun `customerSalesPotential`).
- Ingen endringer i database eller aktiveringsflyt for øvrig — `onOffer`/`onActivate` i `MSPCustomerDetail.tsx` brukes uendret.
