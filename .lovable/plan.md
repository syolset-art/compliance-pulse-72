## Bakgrunn
«Claim-rate» er teknisk og lite selvforklarende for MSP-partnere. Brukeren har valgt **«Aktiverte kunder»** som nytt begrep, med **selvforklarende undertekst** og **ren KPI** uten salgsvinkling.

## Omfang
Endringen er rent språklig i UI – ingen backend- eller databaseendringer nødvendig.

## Endringsliste

### 1. Partner-dashbord – KPI-rad og claim-widget
**Fil:** `src/pages/MSPPartnerDashboard.tsx`
- Bytt KPI-label fra `CLAIM-RATE` til `AKTIVERINGSGRAD`.
- Bytt undertekst fra `47 av 400 · mål 40%` til selvforklarende variant, f.eks.:
  - `47 av 400 kunder har aktivert compliance-leveransen`
- Oppdater `ClaimRateWidget`:
  - Tittel: `Claim-rate` → `Aktiveringsgrad`
  - Ring-label: `claim` → `aktive`
  - Undertekst: tydeligere setning om hva tallet betyr
- Oppdater live-signal: `Profil claimed` → `Profil aktivert`

### 2. Widget-detaljside
**Fil:** `src/pages/MSPWidgetDetail.tsx`
- Oppdater sidetittel og beskrivelser fra claim-språk til aktiveringsspråk.
- Endre eventuelle seksjonsheadere, tabelltitler og grafer som refererer til «claim».

### 3. Kundekort og statusbanner
**Filer:**
- `src/components/msp/CustomerStatusBanner.tsx`
- `src/components/msp/MSPCustomerCard.tsx`
- Juster tooltip/merknad for «claimed»-status: `selvrapportert av kunde` → språk som tydelig sier at kunden har aktivert/igangsatt compliance-leveransen.

### 4. Campaign-wizard (hvis aktuelt)
**Fil:** `src/components/msp/CampaignWizardDialog.tsx`
- Bytt ut «claim»-språk i stegbeskrivelser og CTA-er til aktiveringsspråk.

### 5. Oversettelser
**Filer:** `src/locales/nb.json`, `src/locales/en.json`
- Legg til i18next-nøkler for de nye begrepene (f.eks. `msp.activationRate`, `msp.activatedCustomers`, `msp.profileActivated`).
- Erstatt hardkodet tekst i komponentene med `t()`-kall for å overholde i18next-standarden.

## Design-hensyn
- Behold eksisterende gradient-widget-stil og ring-visualisering – bare tekst endres.
- Risikofarger og layout beholdes uendret.

## Akseptansekriterier
- [ ] Ingen «claim»- eller «claimed»-referanser gjenstår i brukervendt tekst på partner-dashbordet, widget-detaljsiden, kundekortene eller campaign-wizarden.
- [ ] KPI-teksten er selvforklarende uten tooltips.
- [ ] Bygget kompilerer uten TypeScript-feil.
- [ ] Oversettelser finnes for både norsk og engelsk.