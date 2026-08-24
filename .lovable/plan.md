# Klikkbare produkter med etableringspris — unntatt Regelverk

## Mål
På «Produkter og tjenester» (`/msp-services`) skal hele produktraden i **Produkter fra Mynder** være klikkbar. Klikk åpner redigering av **etableringspris** (fast engangspris). Dette gjelder alle produkter **unntatt Regelverk** — der skal brukeren i stedet få informasjon om at de lager egne rådgivningspakker i avsnittet under («Regelverk og rådgivningspakker»).

## Endringer

### 1. Hele raden klikkbar (`src/components/msp/PartnerProductList.tsx`)
- `ProductRow` gjøres om fra `<div>` til klikkbar rad (`<button type="button">` / `role="button"` med tastaturstøtte, `cursor-pointer`, hover-effekt og chevron-ikon til høyre som signaliserer at raden kan åpnes).
- Fjerner dagens løsning der bare produktnavnet var en knapp med blyant-ikon.
- Radene for Core, Leverandører, Systemer og eiendeler, Avviksregister og Trust Center åpner redigerings-sheeten.

### 2. Etableringspris for alle produkter unntatt Regelverk
- `ProductEditSheet` beholdes for de fem vanlige produktene med dagens innhold: Lisenspris (skrivebeskyttet) + **Etableringskostnad** (fast engangspris i kr med valgfri beskrivelse, lagres fortløpende).
- Regelverk-spesifikk kode (`frameworkHours`, «Rådgivning ved aktivering»-switch, `SetupFeeEditor` for frameworks) fjernes fra denne sheeten.

### 3. Egen info-sheet for Regelverk
- Klikk på **Regelverk**-raden åpner en egen liten sheet som forklarer:
  - Regelverk har ingen fast etableringspris — i stedet lager du **egne rådgivningspakker per regelverk** (timestimat per krav, eget pakkens navn, aktiveringspris).
  - Tekst som peker på avsnittet **«Regelverk og rådgivningspakker»** lenger ned på siden.
  - CTA-knapp **«Gå til rådgivningspakker»** som lukker sheeten og scroller ned til seksjonen (anker-id på seksjonen i `src/pages/MSPServiceCatalog.tsx`).
- Beholder «Rådgivning ved aktivering»-timene (default timer ved aktivering) i denne sheeten, siden de er koblet til aktiveringsflyten via `src/lib/activationHours.ts`.

### 4. Små tekstjusteringer
- Seksjonsbeskrivelsen under «Produkter fra Mynder» oppdateres: «Klikk på et produkt for å legge til etableringskostnad. For regelverk lager du rådgivningspakker i avsnittet under.»
- Beskrivelsen i `ProductSettingsSheet` («klikk på produktnavnet») oppdateres til «klikk på produktet».

## Tekniske detaljer
- Berørte filer: `src/components/msp/PartnerProductList.tsx` (hovedendring), `src/pages/MSPServiceCatalog.tsx` (anker-id + scroll).
- Ingen endring i datalagring: `src/lib/productSetupFees.ts` (localStorage) brukes som i dag; frameworks-raden lagrer aldri etableringspris.
- Ingen databaseendringer.
- Tilgjengelighet: radene blir ekte knapper med `aria-label`, fokusmarkering og tastaturnavigasjon (WCAG AA).
