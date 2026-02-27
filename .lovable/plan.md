

# Plan: Syntetiske demo-data for MSP-kunder og lisenser

## Problem
MSP Dashboard (/msp-dashboard) og Lisenser (/msp-licenses) viser tomme lister for nye brukere/demoer. Det gir ingen verdi i en demo-kontekst.

## Losning
Opprett en ny fil `src/lib/demoSeedMSP.ts` med syntetiske kunder, lisenskjop og lisenser. Legg til en "Last inn demo-data"-knapp pa bade MSP Dashboard og MSP Licenses-sidene (samme monster som eksisterende demo-seeding pa Assets og Lara Inbox).

## Tekniske detaljer

### 1. Ny fil: `src/lib/demoSeedMSP.ts`

Inneholder:
- **9 syntetiske MSP-kunder** med norske bedriftsnavn, bransjespredning, varierende compliance-score (35-92%), statuser (active/onboarding/inactive), og abonnement (Basis/Premium)
- **2 lisenskjop** (ett med 5 lisenser, ett med 3 lisenser) med korrekte priser fra `mspLicenseUtils`
- **8 individuelle lisenser** - noen tildelt kunder, noen tilgjengelige
- **2 fakturaer** knyttet til kjopene
- `seedDemoMSP()` funksjon som sjekker om data allerede finnes, og setter inn alt i riktig rekkefolge (purchase -> licenses -> customers -> invoices)
- `deleteDemoMSP()` funksjon for a rydde opp

### 2. Oppdater `src/pages/MSPDashboard.tsx`
- Legg til DropdownMenu med "Last inn demo-kunder" og "Slett demo-data" (identisk monster som Assets-siden)

### 3. Oppdater `src/pages/MSPLicenses.tsx`
- Legg til tilsvarende DropdownMenu med "Last inn demo-lisenser"

### Demo-kunder (eksempel):

| Kunde | Bransje | Ansatte | Score | Status | Plan |
|---|---|---|---|---|---|
| Bergen Energi AS | Energi | 51-200 | 78% | active | Premium |
| Fjordtech Solutions | Teknologi | 11-50 | 92% | active | Basis |
| Vest Helse Klinikk | Helse | 11-50 | 65% | active | Premium |
| Kystbygg Entreprenor | Bygg og anlegg | 201-500 | 45% | onboarding | Basis |
| NordFinans Radgivning | Finans | 1-10 | 88% | active | Premium |
| Stavanger Logistikk | Transport | 51-200 | 52% | active | Basis |
| Larvik Handel AS | Handel | 11-50 | 35% | inactive | Basis |
| Digitale Losninger Nord | Teknologi | 51-200 | 85% | active | Premium |
| Tromso Utdanning | Utdanning | 201-500 | 71% | onboarding | Basis |

### Filer som endres

| Fil | Endring |
|---|---|
| `src/lib/demoSeedMSP.ts` | Ny fil med seed/delete-funksjoner |
| `src/pages/MSPDashboard.tsx` | DropdownMenu for demo-data |
| `src/pages/MSPLicenses.tsx` | DropdownMenu for demo-data |

