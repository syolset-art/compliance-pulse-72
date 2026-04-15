

# Plan: Credits-first forretningsmodell

## Konsept

Forretningsmodellen forenkles til **credits som valuta** for alt på plattformen. Mynder Core og Leverandørstyring blir **valgfrie pakker** brukeren aktiverer når de trenger det — ikke noe de må forholde seg til fra start. Regelverk fortsetter som separate tillegg.

### Ny modell

```text
┌───────────────────────────────────┐
│  GRUNNPAKKE (gratis)              │
│  • Trust Center                   │
│  • GDPR + ISO 27001               │
│  • 10 credits/mnd                 │
│  • Inntil 5 systemer/leverandører │
└───────────────────────────────────┘
         │
         ▼  Bruker kjøper credits
┌───────────────────────────────────┐
│  CREDITS-PAKKER                   │
│  Starter:   100 credits — 490 kr  │
│  Standard:  300 credits — 990 kr  │
│  Pro:       800 credits — 1 990 kr│
│  Enterprise: Ubegrenset (kontakt) │
└───────────────────────────────────┘
         │
         ▼  Bruker aktiverer ved behov
┌────────────────┐ ┌────────────────┐
│ Mynder Core    │ │ Leverandør-    │
│ (pakke)        │ │ styring (pakke)│
│ 490 kr/mnd     │ │ 490 kr/mnd    │
│ Fjerner grenser│ │ Fjerner grenser│
│ +50 credits/mnd│ │ +50 credits/mnd│
└────────────────┘ └────────────────┘
```

## Endringer

### 1. Oppdater `planConstants.ts`
- Erstatte `PLAN_TIERS` (free/basis/premium/enterprise) med **credits-pakker** (`CREDIT_PACKAGES`)
- Beholde `MODULES` men forenkle til én tier per modul (ikke basis/premium) — en flat månedspris som fjerner grensene og gir ekstra credits
- Beholde `FRAMEWORK_ADDONS` uendret

### 2. Redesigne `Subscriptions.tsx`
Ny sidestruktur:

1. **Credits-oversikt** — nåværende saldo, progress bar, kjøp-knapper for credit-pakker
2. **Trust Center** — gratis, alltid aktiv (som nå)
3. **Regelverk** — som nå med purchase-dialog
4. **Pakker** — Mynder Core og Leverandørstyring som valgfrie kort med "Aktiver"/"Deaktiver"
5. **Oppsummering** — aktive pakker + regelverk-tillegg

### 3. Oppdater `useCredits.ts`
- Fjerne kobling til `currentTier` for `monthlyAllowance`
- Hente `monthly_allowance` direkte fra `company_credits`-tabellen (settes ved kjøp og pakke-aktivering)
- Legge til `purchaseCredits(packageId)` funksjon

### 4. Oppdater `useSubscription.ts`
- Forenkle `currentTier`-logikk — fjerne binding til basis/premium
- `maxSystems`/`maxVendors` avhenger av om pakken er aktivert (5 uten, 50/70 med)
- Beholde `hasModule()` som sjekker om pakken er aktiv

### 5. Oppdater `CreditIndicator.tsx`
- Vise credits uten referanse til plan-tier
- Legge til "Kjøp credits" lenke

### 6. Oppdater `useActivatedServices.ts`
- Allerede brukt for å tracke aktiverte tjenester — gjenbruke for pakke-status

## Filer

| Fil | Endring |
|---|---|
| `src/lib/planConstants.ts` | Ny `CREDIT_PACKAGES`-definisjon, forenkle `MODULES` til én tier |
| `src/pages/Subscriptions.tsx` | Redesigne til credits-first layout |
| `src/hooks/useCredits.ts` | Fjerne tier-kobling, hente fra DB, legge til `purchaseCredits` |
| `src/hooks/useSubscription.ts` | Forenkle tier-logikk til pakke-basert |
| `src/components/sidebar/CreditIndicator.tsx` | Fjerne tier-referanse, legge til kjøp-lenke |

## Teknisk

- Credits-pakker er engangskjøp som fyller på saldoen — ingen endring i `company_credits`-skjema
- Pakker (Mynder Core / Leverandør) er månedlige abonnementer som gir ekstra kapasitet + bonus-credits
- `CREDIT_PACKAGES` defineres med `id`, `name`, `credits`, `priceKr`
- Eksisterende `credit_transactions` brukes for å logge kjøp (`transaction_type: 'purchase'`)

