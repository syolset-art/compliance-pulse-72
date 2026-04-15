

# Plan: Oppdatere abonnementsvalg i «Legg til kunde» — pris per måned

## Endringer

### 1. `src/lib/mspCustomerConstants.ts`
Erstatte `SUBSCRIPTION_PLANS`-arrayet med en ny struktur `MSP_SUBSCRIPTION_TIERS`:

| Tier | Pris | Beskrivelse |
|------|------|-------------|
| Gratis | 0 kr/mnd | Grunnleggende compliance-oversikt |
| Basis | 4 900 kr/mnd | For SMB-kunder som trenger mer |
| Pro | 8 900 kr/mnd | Full tilgang med alle komponenter |

### 2. `src/components/msp/AddMSPCustomerDialog.tsx`
- Default `subscription_plan` → `"Gratis"`
- Erstatte Select-dropdown med visuell plan-velger (3 radio-kort) som viser plannavn, **månedspris** og kort beskrivelse
- Legge til faktura-oppsummering i bekreftelses-steget: valgt plan + note om at credits faktureres løpende

## Filer

| Fil | Endring |
|---|---|
| `src/lib/mspCustomerConstants.ts` | Ny `MSP_SUBSCRIPTION_TIERS` med månedspriser |
| `src/components/msp/AddMSPCustomerDialog.tsx` | Visuell plan-velger, default Gratis, faktura-oppsummering |

