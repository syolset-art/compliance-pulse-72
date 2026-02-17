
# Fakturaoversikt for MSP-dashbordet

## Hva skal bygges
En ny seksjon pa MSP-dashbordet der partneren kan se alle fakturaer knyttet til lisenskjop. Hver faktura viser dato, beskrivelse (f.eks. "5x Premium-lisenser"), belop, status og en nedlastingsknapp for PDF.

## Datamodell

### Ny tabell: `msp_invoices`

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| id | uuid (PK) | Unik ID |
| msp_user_id | uuid | MSP-partnerens bruker-ID |
| invoice_number | text | Fakturanummer (f.eks. "MSP-2026-001") |
| description | text | Beskrivelse (f.eks. "5x Premium-lisenser") |
| amount | integer | Belop i ore (f.eks. 124500 = 1 245 kr) |
| currency | text | Valuta (default "NOK") |
| status | text | "paid", "pending", "overdue" |
| issued_at | timestamptz | Fakturadato |
| paid_at | timestamptz | Betalingsdato (nullable) |
| due_date | date | Forfallsdato |
| pdf_url | text | URL til faktura-PDF (nullable, for fremtidig bruk) |
| created_at | timestamptz | Opprettet |

RLS: Kun tilgang til egne fakturaer (`msp_user_id = auth.uid()`).

## UI-endringer

### 1. Ny fane/seksjon pa MSP-dashbordet

Legger til en Tabs-komponent pa MSP-dashbordet med to faner:
- **Kunder** (eksisterende innhold - metrics + kundeliste)
- **Fakturaer** (ny fakturaoversikt)

### 2. Fakturaoversikt (`MSPInvoicesTab.tsx`)

En tabell med kolonner:
- **Fakturanr.** - klikkbar tekst
- **Beskrivelse** - hva som er kjopt
- **Belop** - formatert med kr og ore
- **Dato** - fakturadato
- **Forfallsdato** - forfallsdato
- **Status** - badge (Betalt = gron, Ubetalt = gul, Forfalt = rod)
- **Last ned** - knapp med Download-ikon som genererer og laster ned en PDF

### 3. PDF-generering

Bruker `jspdf` (allerede installert) til a generere en enkel faktura-PDF pa klientsiden med:
- Mynder-logo
- Fakturanummer, dato, forfallsdato
- MSP-partnerens navn
- Linjebeskrivelse og belop
- Betalingsstatus

### 4. Demo-data

Legger inn 3-4 syntetiske fakturaer for den innloggede brukeren, f.eks.:
- MSP-2026-001: "10x Basis-lisenser" - 4 990 kr - Betalt
- MSP-2026-002: "5x Premium-lisenser" - 12 450 kr - Betalt
- MSP-2026-003: "3x Basis-lisenser" - 1 497 kr - Ubetalt

## Teknisk plan

### Nye filer
- `supabase/migrations/...` - Ny tabell `msp_invoices` med RLS
- `src/components/msp/MSPInvoicesTab.tsx` - Fakturatabell med nedlasting
- `src/components/msp/generateInvoicePdf.ts` - PDF-generering med jspdf

### Endrede filer
- `src/pages/MSPDashboard.tsx` - Legge til Tabs-komponent med "Kunder" og "Fakturaer"
- `src/integrations/supabase/types.ts` - Oppdateres automatisk

### Filstruktur

```text
MSPDashboard.tsx
  +-- Tabs
       +-- "Kunder"
       |     +-- MSPMetricsRow
       |     +-- MSPCustomerCard (grid)
       +-- "Fakturaer"
             +-- MSPInvoicesTab
                   +-- Table med fakturaer
                   +-- Download-knapp -> generateInvoicePdf()
```
