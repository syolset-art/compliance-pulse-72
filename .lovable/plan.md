
## Mål

Lage en intern demo-/referansevisning som viser hvordan tilbudet (offer/leveranse) fremstår for kunden som mottar det. Tenkt brukt av utviklere og implementerings­ansvarlige for å forstå touchpoints. Ingen ny forretnings­logikk — kun presentasjon med eksempeldata.

## Navigasjon

- Nytt sidebar-punkt under MSP-seksjonen: **"Kundevisning"** (`/msp-customer-view`), ikon `Eye`, plassert rett etter "Tjenester".
- Ny rute i `src/App.tsx` til ny side `MSPCustomerView`.

## Side: `src/pages/MSPCustomerView.tsx`

Layout som `MSPServiceCatalog` (Sidebar + container, `pt-11`). Header forklarer formålet:

> "Slik ser tilbudet ut fra kundens side. Bruk dette som referanse når du implementerer touchpoints."

Under headeren en `Tabs`-meny med 5 visninger. Hver tab har en kort "Når kunden ser dette"-beskrivelse + en `<Card>` med live preview av komponenten, og en grå "Implementeringsnotat"-boks (filsti + props + når den trigges).

### Tabs

1. **E-post med tilbud** — gjenbruker `CustomerCatalogPreview` med `asEmail` + demo-tjenester. Notat: trigges av `ShareOfferDialog` → utgående e-post.
2. **Tjenestekatalog (innlogget)** — samme `CustomerCatalogPreview` uten `asEmail`. Notat: vises i kundens Trust Center.
3. **Offentlig Trust Profile** — embed av `PublicTrustProfile` i en innrammet "browser chrome"-container (URL-bar med `trust.mynder.no/<slug>`). Notat: rute `/trust/:slug`.
4. **Trust handover-e-post** — render av e-post-malen brukt i `SendTrustHandoverEmailDialog` (statisk preview av subject/body).
5. **Leveranserapport (PDF)** — thumbnail/iframe av rapport generert via `generateInvoicePdf` / `PortfolioReportView`. Statisk eksempel.

Hver tab bruker DIPS Arena AS som default kunde, og partner = innlogget org.

## Felles UI-komponent

`src/components/msp/customer-view/PreviewFrame.tsx` — wrapper som tegner:
- toolbar (tab-navn + "Slik ser kunden det")
- preview-area med subtil sjakkbrett-bakgrunn
- collapsible "Implementeringsnotat" (fil, komponent, trigger, props-eksempel)

## Filer som opprettes

- `src/pages/MSPCustomerView.tsx`
- `src/components/msp/customer-view/PreviewFrame.tsx`
- `src/components/msp/customer-view/EmailOfferView.tsx`
- `src/components/msp/customer-view/CatalogView.tsx`
- `src/components/msp/customer-view/PublicProfileView.tsx`
- `src/components/msp/customer-view/HandoverEmailView.tsx`
- `src/components/msp/customer-view/DeliveryReportView.tsx`

## Filer som endres

- `src/App.tsx` — registrer rute.
- `src/components/Sidebar.tsx` — nytt menypunkt under MSP.

## Avgrensning

- Kun visuelt; ingen DB-endringer, ingen edge functions, ingen ny logikk.
- Bruker eksisterende design tokens og shadcn-komponenter.
- i18n: NB primært, EN-streng på menypunktet.
