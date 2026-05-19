## Mål

Gjøre fanen **Pågående oppdrag** lik **Tilbud**-fanen visuelt (samme kort + ekspanderbar sjekkliste) og gi kunden en komplett flyt: se aktiviteter → laste opp dokumenter → generere sluttrapport → sende til kunde → ved godkjenning øke modenhet og berike kontroller.

## Endringer

### 1. Pågående oppdrag — ny visning (likt Tilbud)
Erstatt `DeliveryWizard` (én og én aktivitet) med en kortbasert liste som speiler `ONGOING`-kortene:

- Ett kort per leveranse med ikon, tittel, framework-badge, fremdrift («3 av 7 aktiviteter fullført»), status-pille og chevron.
- Klikk åpner kortet i en seksjon under med:
  - **Filter-piller** øverst (Alle / Gjenstår / Fullført / Med dokument), samme stil som dagens kontrollfilter.
  - **Hele sjekklisten synlig samtidig** — gruppert per kontrollpunkt (A.6.3 osv.), hver aktivitet som rad med:
    - checkbox (sett som utført), tittel, eier (Partner/Kunde), dato, antall vedlegg.
    - liten «Last opp dokument»-knapp på rader hvor det er relevant (åpner eksisterende `ConfirmActivityDialog` i upload-modus).
    - liten Lara-streng som plassholder (forberedt for senere kobling) — vises bare hvis `laraSteps` finnes.
- Footer i kortet: progress-bar + «Generer sluttrapport»-knapp (aktiveres når alle aktiviteter er bekreftet).

### 2. Last opp dokumenter per aktivitet
Gjenbruk `ConfirmActivityDialog` (har allerede fil-opplasting + notat). Trigges direkte fra aktivitetsraden. Vedleggsantall vises som badge på raden.

### 3. Generer sluttrapport
- «Generer sluttrapport» åpner eksisterende `DeliverySummaryDialog`.
- Etter godkjenning lagres rapport-metadata på leveransen (`reportGeneratedAt`, `reportFileName`) lokalt i state.
- Statusen på leverandørkortet bytter til «Rapport klar» (grønn pille).

### 4. Send rapport til kunde
- Når rapport er generert, vises ny knapp **«Send til kunde»** på kortet.
- Klikk åpner ny lett dialog `SendDeliveryReportDialog` (mønster lik `ShareVendorPortfolioDialog`):
  - viser kunde-e-post + valgfri melding,
  - sender via «Meldinger»-systemet (legger rapporten inn i `MSPCustomerMessagesTab` som ny innkommende rapport-melding hos kunden).
- Etter sending: kortet får status «Sendt — venter godkjenning».

### 5. Kundens godkjenning øker modenhet
- I `MSPCustomerMessagesTab` legges en ny seksjon **«Leveranserapporter til godkjenning»** med Godkjenn-/Avvis-knapper.
- Godkjenning fører til:
  1. Aktivitetene merkes som «verifisert av kunde» i kontrollpunktene.
  2. Kontrollpunktenes `progress` heves til 100 % og status settes til `fulfilled` på det aktuelle rammeverket.
  3. Kundens modenhetsskår oppdateres (gjenbruk eksisterende beregning fra `useMaturityScore` / `msp_customer_assessments`).
  4. Toast: «Kundens modenhet på {Framework} økte fra X → Y %».

## Tekniske detaljer

- Ny komponent: `src/components/msp/OngoingDeliveriesList.tsx` — erstatter `DeliveryWizard`-bruken inni `<TabsContent value="deliveries">`. Beholder `DeliveryWizard.tsx` urørt i denne omgang for å unngå større refaktorering; importeres bare ikke lenger fra matrix-fanen.
- Ny dialog: `src/components/msp/SendDeliveryReportDialog.tsx` — speiler stilen til `ShareVendorPortfolioDialog`.
- Utvid `DeliveryItem` (i `MSPMaturityServiceMatrix.tsx`) med valgfritt `reportGeneratedAt`, `reportFileName`, `sentToCustomerAt`, `customerApprovedAt`.
- Berikelse av kontroller: hold dette presentasjonsmessig nå (oppdater lokale `controls`-data + visning) — kobles senere til faktisk `compliance_requirements`-skår. Hook-callback `onCustomerApprove(deliveryId)` forberedes så Lara senere kan plugges på.
- Ingen DB-endringer i denne iterasjonen — alt drives av eksisterende seed-data og lokal state. Kommenteres tydelig i koden.

## Filer som endres
- `src/components/msp/MSPMaturityServiceMatrix.tsx` — bytter ut wizard-bruk, utvider typer, holder state for rapport-status.
- `src/components/msp/OngoingDeliveriesList.tsx` *(ny)*
- `src/components/msp/SendDeliveryReportDialog.tsx` *(ny)*
- `src/components/msp/MSPCustomerMessagesTab.tsx` — ny seksjon «Leveranserapporter» med godkjenn-handling og modenhets-toast.

## Ikke i scope nå
- Faktisk persistering av rapport/godkjenning i Supabase.
- Reell Lara-kjøring (steg vises som forberedt placeholder).
- E-postutsending av rapport utenfor appen.
