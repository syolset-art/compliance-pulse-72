

# Kunde-ROI-kalkulator for salgsmøter

## Oversikt

Lage en ny side -- **Kunde-ROI** (`/msp-customer-roi`) -- som MSP-partneren kan vise til sluttkunden i et salgsmøte. Denne fokuserer på hva **kunden sparer** ved å bruke Mynder, i motsetning til partner-kalkulatoren som viser partnerens fortjeneste.

Salgsguiden oppdateres slik at steg 2 ("Book et møte") lenker til den nye kunde-ROI-kalkulatoren.

## Ny side: Kunde-ROI-kalkulator

Siden har et rent, presentasjonsklart design uten sidebar-navigasjon (valgfritt å vise den), slik at den kan vises direkte til kunden.

### Input-felter
- **Antall systemer** (slider, default 10)
- **Timer per måned brukt på manuell compliance** (slider, default 20)
- **Timepris internt hos kunden** (input, default 850 kr)
- **Antall standarder/rammeverk** (dropdown: 1-3, for GDPR, ISO 27001 osv.)

### Beregninger
```
manualCostYear = hoursPerMonth * hourlyRate * 12
mynderCostYear = lisensvalg basert på antall systemer (Basis 42 000 / Premium 76 000)
savingYear = manualCostYear - mynderCostYear
savingPercent = (savingYear / manualCostYear) * 100
timeFreedHours = hoursPerMonth * 0.8 * 12  // 80% automatisering
```

### Resultat-visning
- **Årlig besparelse** (stort tall, grønt)
- **Timer frigjort per år** (viser tid som kan brukes på verdiskaping)
- **Tilbakebetalt etter X måneder** (mynderCostYear / (manualCostYear / 12))
- **3-års besparelse** (savingYear * 3)
- Visuell sammenligning: "Manuelt" vs "Med Mynder" (to kolonner)

### PDF-eksport
"Mynder -- Besparelsesanalyse for [Bedriftsnavn]" -- tilpasset for å dele med beslutningstaker hos kunden.

### Ekstra input
- **Bedriftsnavn** (tekstfelt, valgfritt) -- brukes i PDF-en for personalisering

## Endringer i salgsguiden

Steg 2 oppdateres:
- Beskrivelse endres til å nevne kunde-ROI-kalkulatoren
- Knappen peker til `/msp-customer-roi` i stedet for `/msp-roi`
- Tekst: "Vis kunden ROI-kalkulator"

## Filer som endres/opprettes

1. **Ny fil**: `src/pages/MSPCustomerROI.tsx` -- den kundevendte ROI-kalkulatoren
2. **Endres**: `src/pages/MSPSalesGuide.tsx` -- steg 2 oppdateres med ny lenke
3. **Endres**: `src/App.tsx` -- ny rute `/msp-customer-roi`

## Tekniske detaljer

- Bruker `LICENSE_TIERS` fra `mspLicenseUtils.ts` for lisenspriser
- Kun lokal state, ingen backend
- jsPDF for PDF-eksport
- Siden inkluderer Sidebar som resten av appen (MSP ser den, kan eventuelt skjule sidebar når de presenterer)

