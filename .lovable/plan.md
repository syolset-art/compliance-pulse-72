

# Lisensoversikt for MSP-partnere

## Hva skal bygges
Erstatter den enkle fakturatabellen med en komplett lisensoversikt der MSP-partnere kan se alle lisenser de har kjopt, rabattniva, hvilke som er tildelt kunder, og fornyelsesdatoer. Inkluderer ogsa mulighet for prisendring ved fornyelse.

## Forretningslogikk

### Prismodell
- **SMB-lisens** (inntil 20 systemer): 42 000 kr/ar
- Lisensen gjelder fra kjopsdato og ett ar frem

### Rabattstruktur (bulk-kjop)
| Antall lisenser kjopt | Rabatt |
|----------------------|--------|
| 1-2 (enkeltvis)     | 20%    |
| 3                    | 30%    |
| 4                    | 40%    |
| 5+                   | 50%    |

Rabatten gjelder per bulkkjop, ikke totalt over tid.

### Fornyelse
- Lisenser fornyes arlig
- Prisen kan okes ved fornyelse (f.eks. fra 42 000 til 45 000)
- Ny pris lagres pa lisensen og gjelder fra neste periode

## Datamodell

### Ny tabell: `msp_license_purchases`
Representerer et bulkkjop av lisenser.

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| id | uuid (PK) | Unik ID |
| msp_user_id | uuid | Partneren som kjopte |
| quantity | integer | Antall lisenser kjopt |
| unit_price | integer | Listepris per lisens i ore (4200000) |
| discount_percent | integer | Rabatt (20, 30, 40, 50) |
| total_amount | integer | Totalt belop etter rabatt, i ore |
| purchased_at | timestamptz | Kjopsdato |
| period_start | date | Start pa lisensperioden |
| period_end | date | Slutt pa lisensperioden (1 ar) |
| renewal_price | integer | Pris ved fornyelse (nullable, settes for evt. okning) |
| status | text | "active", "expired", "renewed" |
| created_at | timestamptz | Opprettet |

### Ny tabell: `msp_licenses`
Representerer individuelle lisenser fra et bulkkjop.

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| id | uuid (PK) | Unik ID |
| purchase_id | uuid (FK) | Referanse til bulkkjopet |
| msp_user_id | uuid | Partneren |
| assigned_customer_id | uuid (FK, nullable) | Tildelt kunde (ref til msp_customers) |
| license_key | text | Unik lisensnokkel |
| period_start | date | Lisens start |
| period_end | date | Lisens slutt |
| status | text | "available", "assigned", "expired" |
| created_at | timestamptz | Opprettet |

### Eksisterende tabell: `msp_invoices`
Beholder som den er. Hver gang et lisenskjop gjores, genereres en tilhorende faktura automatisk i koden.

## UI-endringer

### 1. Ny fane pa MSP-dashbordet: "Lisenser"
Legger til en tredje fane i Tabs-komponenten:
- **Kunder** (eksisterende)
- **Lisenser** (ny)
- **Fakturaer** (eksisterende)

### 2. Lisensoversikt (`MSPLicensesTab.tsx`)
Innhold:

**Toppseksjon - Oppsummeringskort:**
- Totalt antall lisenser
- Tildelte (solgt videre)
- Tilgjengelige (ikke tildelt)
- Gjennomsnittlig rabatt

**Kjopstabell:**
Hver rad viser et bulkkjop med:
- Dato
- Antall lisenser
- Rabatt
- Pris per lisens (etter rabatt)
- Totalt belop
- Periode (start - slutt)
- Status (Aktiv/Utlopt)
- Mulighet til a utvide raden for a se individuelle lisenser og hvem de er tildelt

**Knapp: "Kjop lisenser":**
Apner en dialog der partneren velger antall lisenser. Rabatten beregnes automatisk og vises. Viser totalbelop for rabatt og etter rabatt.

### 3. Kjop lisenser-dialog (`PurchaseLicensesDialog.tsx`)
- Tallvelger for antall lisenser
- Viser automatisk beregnet rabatt basert pa antall
- Viser listepris, rabatt og totalbelop
- Bekreftelsesknapp

### 4. Tildel lisens til kunde
I `MSPCustomerDetail.tsx` eller via lisensoversikten - en knapp for a tildele en ledig lisens til en kunde (dropdown av tilgjengelige lisenser).

## Teknisk plan

### Database-migrasjoner
1. Opprett `msp_license_purchases` med RLS (msp_user_id = auth.uid())
2. Opprett `msp_licenses` med RLS (msp_user_id = auth.uid())
3. Fjern eller behold `msp_invoices` (beholdes, brukes videre for faktura-PDF)

### Rabattberegning (klientside utility)
```text
function getDiscountPercent(quantity: number): number {
  if (quantity >= 5) return 50;
  if (quantity === 4) return 40;
  if (quantity === 3) return 30;
  return 20; // 1-2
}
```

### Nye filer
- `src/components/msp/MSPLicensesTab.tsx` - Lisensoversikt med oppsummeringskort og kjopstabell
- `src/components/msp/PurchaseLicensesDialog.tsx` - Kjop lisenser-dialog med rabattberegning
- `src/components/msp/AssignLicenseDialog.tsx` - Tildel lisens til kunde
- `supabase/migrations/...` - Nye tabeller

### Endrede filer
- `src/pages/MSPDashboard.tsx` - Legge til "Lisenser"-fane
- `src/components/msp/MSPMetricsRow.tsx` - Eventuelt vise lisensinfo i metrikker

### Demo-data
Legger inn et eksempel-bulkkjop med 5 lisenser (50% rabatt) og 3 av dem tildelt til eksisterende demo-kunder.

## Flyt

```text
Partner apner MSP-dashbordet
  -> Velger "Lisenser"-fanen
  -> Ser oversikt over kjopte lisenser, rabatt, tilgjengelige
  -> Klikker "Kjop lisenser"
     -> Velger antall (f.eks. 5)
     -> Ser: 5 x 42 000 = 210 000 kr, 50% rabatt = 105 000 kr
     -> Bekrefter
     -> 5 nye lisenser opprettes, faktura genereres
  -> Klikker "Tildel" pa en ledig lisens
     -> Velger kunde fra dropdown
     -> Lisensen kobles til kunden
```

