# Trust Center som eget produkt (490 kr/mnd)

Trust Center går fra å være «inkludert i Core» til å bli et selvstendig, betalbart produkt til 490 kr per måned (eks. mva). Kjerneverdien er gjenbruk: dokumentasjonen bedriften allerede har i Mynder deles én gang og gjenbrukes mot kunder, leverandører og revisorer.

## Hva brukeren får se

**Innstillinger → Produkter (abonnement)**
- Trust Center-kortet blir et vanlig produktkort med pris 490 kr/mnd, status aktiv/inaktiv, Aktiver- og Avvikle-flyt (samme mønster som Leverandørmodul/Assets), og «Åpne» som går til Trust Profile.
- Prisen teller med i «Total månedlig».
- «Les mer» viser oppdatert produktbeskrivelse med gjenbruk som hovedbudskap.

**Produktbeskrivelse (les mer)**
- Tagline: «Del én gang — gjenbruk mot alle».
- Punkter: offentlig profil på trust.mynder.no, delbare lenker til kunder og leverandører med utløpsdato, gjenbruk av dokumentasjon fra Core/Leverandørmodul, kundeforespørsler samlet, styring av hva som er offentlig vs. delt privat.

**Partner: kundens produkter og tjenester**
- Trust Center legges til i produktlisten på kunden med fastpris 490 kr/mnd, slik at partner kan gi tilbud på og aktivere det som alle andre produkter.

**Partner: Produkter fra Mynder (videresalg)**
- Trust Center legges til i Mynder-produktlisten i tjenestekatalogen med fast provisjon (30 %), én prisrad «Standard 490 kr».

**Modenhetsspeil / tilgang til kundens Trust Profile**
- Portalen som allerede krever et aktivt Mynder-produkt får nå Trust Center som reelt aktiverbart produkt, ikke bare «kommer senere» — teksten oppdateres tilsvarende.

## Teknisk

- `src/lib/planConstants.ts`: ny `TRUST_CENTER_PRICE_KR = 490` og fjerne «Trust Center» fra `FREE_INCLUSIONS`.
- `src/pages/Subscriptions.tsx`: Trust Profile-kortet erstattes av Trust Center-kort med `moduleKey: "trust"` — status via `moduleStatusOf`/`deactivatedModules`, `requestActivate`/`requestDeactivate`, pris 490, og «Åpne» beholdt for aktive. Legge 490 inn i `totalMonthly` når aktivt.
- `src/lib/moduleInfo.ts`: oppdatere `trust`-oppføringen (tagline, beskrivelse, features med gjenbruk/deling).
- `src/components/msp/CustomerServicesAndProductsTab.tsx`: nytt element i `PRODUCTS` (`key: "trust"`, `moduleKey: "trust"`) og `FLAT_PRICE.trust = 490`.
- `src/components/msp/MSPServiceCatalogTab.tsx`: nytt element i `MYNDER_PRODUCTS` for Trust Center (`commissionPct: 30`, `fromPrice: 490`, én tier).
- `src/lib/customerEntryRoutes.ts`: rute `trust → /trust-center/profile` slik at aktivering kan lande riktig sted.
- `src/components/msp/guidance/CustomerMaturityMirrorCard.tsx`: justere låsteksten siden Trust Center nå kan aktiveres.

Ingen databaseendringer — produktaktivering bruker eksisterende `moduleActivationState`.
