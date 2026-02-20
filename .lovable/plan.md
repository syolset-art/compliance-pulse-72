

# Partner-meny med undermenyer, ROI-kalkulator og salgsguide

## Oversikt

Endre "Partneroversikt" fra en enkel lenke til en utvidbar meny (som "Admin" og "Utviklere" allerede fungerer), med fire undermenypunkter. Samtidig opprettes to nye sider.

## Ny menystruktur i sidepanelet

```text
Partner (utvidbar)
  +-- Kunder          -> /msp-dashboard (eksisterende, men uten tabs for lisenser/fakturaer)
  +-- Lisenser        -> /msp-licenses (ny side, flytter MSPLicensesTab hit)
  +-- Faktura         -> /msp-invoices (ny side, flytter MSPInvoicesTab hit)
  +-- ROI-kalkulator  -> /msp-roi (ny side)
  +-- Salgsguide      -> /msp-sales-guide (ny side)
```

## Endringer

### 1. Sidebar.tsx -- Partner som utvidbar meny

Erstatter den enkle "Partneroversikt"-lenken med en utvidbar meny som bruker samme moenster som "Admin"-menyen (ChevronDown, submenu-items). Ikonet forblir Building2.

### 2. MSPDashboard.tsx -- Forenklet til kun kunder

Fjerner tabs for lisenser og fakturaer (disse flyttes til egne sider). Beholder kun kundelisten, metrikker og "Legg til kunde"-knappen. Fjerner "Fakturainnstillinger"-knappen fra headeren (den flyttes til Faktura-siden).

### 3. Ny side: MSPLicenses.tsx (/msp-licenses)

En enkel wrapper-side med Sidebar og MSPLicensesTab-komponenten. Samme layout som resten av appen.

### 4. Ny side: MSPInvoices.tsx (/msp-invoices)

En enkel wrapper-side med Sidebar og MSPInvoicesTab. Inkluderer lenke til fakturainnstillinger i headeren.

### 5. Ny side: MSPROICalculator.tsx (/msp-roi)

En interaktiv ROI-kalkulator tilpasset MSP-partnere. Partneren taster inn:

- Antall kunder
- Gjennomsnittlig timepris (NOK)
- Timer brukt per kunde per maaned paa manuell compliance

Kalkulatoren beregner og viser:

- Tidsbesparelse med Mynder (basert paa 80% automatisering)
- Kostnadsbesparelse per aar
- Inntektspotensial (lisenskostnad * antall kunder - Mynders pris)
- Sammenligning: manuelt vs. med Mynder

I tillegg vises en "Eksporter som PDF"-knapp slik at partneren kan bruke dette i salgsmoeter.

### 6. Ny side: MSPSalesGuide.tsx (/msp-sales-guide)

En steg-for-steg salgsguide som viser MSP-partneren hvordan de selger Mynder til sine kunder. Innholdet er strukturert som en tidslinje/stepper:

| Steg | Tittel | Beskrivelse |
|------|--------|-------------|
| 1 | Identifiser kunden | Finn kunder som mangler compliance-verktoy eller bruker manuelle prosesser |
| 2 | Book et moete | Bruk ROI-kalkulatoren til aa vise besparelsen. Ta med konkrete tall |
| 3 | Kjor en kartlegging | Bruk "Legg til kunde" med compliance-assessment for aa avdekke gap |
| 4 | Presenter handlingsplan | Vis kartleggingsresultatet -- "4 av 6 omraader mangler" |
| 5 | Aktiver Mynder | Tildel lisens, koble Acronis, sett opp kundens portal |
| 6 | Lopende oppfolging | Ga inn i kundens portal for aa hjelpe med compliance-arbeidet |

Hvert steg har en ikon, utfyllende tekst, og en handlingsknapp som navigerer til riktig sted i appen (f.eks. "Gaa til ROI-kalkulator", "Legg til kunde", "Kjop lisenser").

### 7. App.tsx -- Nye ruter

Legger til fire nye ruter:
- `/msp-licenses` -> MSPLicenses
- `/msp-invoices` -> MSPInvoices
- `/msp-roi` -> MSPROICalculator
- `/msp-sales-guide` -> MSPSalesGuide

## Tekniske detaljer

- ROI-kalkulatoren bruker kun lokal state (useState) for input-verdier og beregner alt paa klientsiden
- Salgsguiden er statisk innhold med navigasjonslenker
- Eksisterende MSPLicensesTab og MSPInvoicesTab gjenbrukes uten endringer -- de wrappes bare i nye sider
- Sidebar-menyen holder seg aapen naa brukeren er paa en av partner-rutene (sjekker `location.pathname.startsWith("/msp-")`)
- jsPDF (allerede installert) brukes for PDF-eksport av ROI-rapporten

