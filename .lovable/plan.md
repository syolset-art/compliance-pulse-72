

# Plan: Ny abonnementsside med bundlede pakker

## Ny prismodell

Prisene oppdateres og pakkes i tydelige nivåer:

```text
┌─────────────────────────────────────────────────────┐
│  Gratis          │  Basis           │  Pro           │
│  kr 0/mnd        │  kr 4 900/mnd    │  kr 8 900/mnd  │
│                  │                  │                │
│  Trust Center    │  Alt i Gratis +  │  Alt i Basis + │
│  GDPR + ISO27001 │  Mynder Core     │  Leverandør-   │
│  10 credits/mnd  │  (systemer,      │  styring       │
│  5 systemer      │  arbeidsområder, │  (DPA, risiko, │
│  5 leverandører  │  oppgaver, risk) │  scoring)      │
│                  │  100 credits/mnd │  300 credits/mnd│
│                  │  Inntil 20 syst. │  Ubegrenset    │
│                  │  Inntil 20 lev.  │  alt            │
└─────────────────────────────────────────────────────┘
```

Credits brukes til AI-analyse, dokumentklassifisering, rapportgenerering etc. Større virksomheter bruker flere credits fordi de har flere systemer, leverandører og regelverk.

## Endringer

### 1. `src/lib/planConstants.ts`
- Oppdater `MODULES.systems.monthlyPriceKr` til `4900` og `yearlyPriceKr` til `49000`
- Oppdater `MODULES.vendors.monthlyPriceKr` til `4900` og `yearlyPriceKr` til `49000` (tilsvarende)
- Oppdater `PLAN_TIERS` til å reflektere bundlede pakker:
  - Basis: `monthly: 4900`, `monthlyCredits: 100`, inkluderer Mynder Core
  - Premium: `monthly: 8900`, `monthlyCredits: 300`, inkluderer Core + Vendors
- Legg til `includedModules: ModuleId[]` i `PlanDefinition` for å knytte moduler til planer

### 2. `src/pages/Subscriptions.tsx` — Full redesign
Erstatte nåværende layout med en **sammenlignende pakkeoversikt**:

**Seksjon 1: Velg din pakke** — 3-kolonne kort (Gratis / Basis / Pro) side ved side
- Hver med pris, inkluderte moduler, credits/mnd, grenser
- Tydelig "Nåværende plan"-markering og "Oppgrader"-knapp
- Forklaring nederst: "Credits brukes til AI-drevet analyse, dokumentklassifisering og rapportgenerering. En liten bedrift trenger færre credits enn en stor virksomhet med mange regelverk."

**Seksjon 2: Kjøp ekstra credits** — Kompakt rad med 3 pakker (som nå, men under planvalg)

**Seksjon 3: Regelverk-tillegg** — Beholder nåværende collapsible regelverk-seksjon

**Seksjon 4: Oppsummering + betaling** — Beholder nåværende oppsummering

### 3. Oppdater `useCredits.ts`
- `monthlyAllowance` beregnes fra planens `monthlyCredits` + eventuelle bonus

## Filer

| Fil | Endring |
|---|---|
| `src/lib/planConstants.ts` | Oppdater priser, legg til `includedModules` |
| `src/pages/Subscriptions.tsx` | Redesign til sammenlignende pakkekort |
| `src/hooks/useCredits.ts` | Koble credits til plan-tier |

