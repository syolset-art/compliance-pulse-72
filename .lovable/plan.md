## Mål

Partneren skal enkelt se hvilke tjenester som er del av et levert tilbud, og disse skal ikke kunne fjernes eller nullstilles ved et uhell. Avvikling (retire) er fortsatt eneste måte å ta en tjeneste ut av porteføljen på.

## Slik oppleves det

1. Når partneren lagrer et tilbud i «Opprett tilbud»-dialogen, blir tjenestene som ligger i tilbudet merket som «På tilbud» på kunden.
2. I tjenestekatalogen (både tabellen for «Mynder-produkter» og listen for egne tjenester) vises et lite merke «På tilbud · T-2026-1234» på hver slik tjeneste, med tooltip som viser tilbudsnr., dato og navn.
3. Handlinger som ville fjerne en slik tjeneste er deaktivert:
   - «Fjern»-knapp (X) på egne tjenester skjules/deaktiveres med tooltip «Kan ikke fjernes — inngår i tilbud T-2026-1234. Bruk Avvikle.»
   - Lara-banneret sitt «Nullstill»-valg fjerner kun tjenester som ikke ligger i et tilbud; de resterende beholdes og en toast forklarer hvor mange som ble beholdt.
   - Mynder-produkter kan ikke deaktiveres så lenge de er del av et tilbud (samme tooltip).
4. Å «Avvikle» en tilbudt tjeneste er fortsatt mulig — det er den kontrollerte utfasingsflyten.

## Teknisk

- Ny modul `src/lib/customerOffers.ts` med typene `SavedOffer { id, offerNumber, name, customerId, createdAt, serviceIds[], templateIds[] }` og hjelpere `listOffers(customerId)`, `saveOffer(offer)`, `getLockedServiceIds(customerId)` som slår sammen `serviceIds` + `templateIds` på tvers av kundens tilbud. Persistens i `localStorage` (`msp-customer-offers-v1`), samme mønster som `usePartnerBranding`.
- `MSPCreateOfferDialog.handleSaveOffer` bygger et `SavedOffer` fra `selections.extras` (id + templateId) og kaller `saveOffer(...)`. Tar imot ny prop `customerId`.
- `MSPServiceCatalogTab`:
  - Ny `useMemo` `lockedIds = getLockedServiceIds(customerId)` (både `extras.id` og `templateId`).
  - `removeExtra(id)` blir no-op når id er låst, viser toast.
  - «Nullstill»-knappen i Lara-banneret filtrerer bort låste id-er, viser antall beholdt.
  - Renderer nytt kompakt merke «På tilbud» ved siden av tjenestenavnet i begge tabellene (Mynder + egne) med tooltip som viser tilbudsnummer.
- Ingen endring i databasemodell — prototype bruker localStorage, konsistent med resten av MSP-flyten.

## Ikke i scope

- Ingen egen «Tilbud»-side eller CRUD-visning; kun merking + låsing.
- Ingen endring av PDF-generering eller tilbudsnummer-format.
