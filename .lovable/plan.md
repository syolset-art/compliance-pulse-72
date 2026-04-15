

# Plan: Oppdatere gratis-pakken og legge til Trust Engine-synlighet

## Endringer

### 1. `src/lib/planConstants.ts`
- Fjerne "Inntil 5 systemer" og "Inntil 5 leverandører" fra `FREE_INCLUSIONS`-arrayet
- Legge til ny linje: **"Synlighet i Mynder Trust Engine — bli funnet av kunder og partnere"**

Ny `FREE_INCLUSIONS`:
```typescript
export const FREE_INCLUSIONS = [
  "Trust Center (alle undermenyer)",
  "GDPR regelverk",
  "ISO 27001 regelverk",
  "10 credits/mnd",
  "Synlig i Mynder Trust Engine — bli enklere funnet av kunder og partnere",
] as const;
```

### 2. `src/pages/MSPInvoices.tsx`
- Fjerne linjen `Inntil {tier.maxSystems} systemer · {tier.maxVendors} leverandører` fra plan-kortet (linje 70)

## Filer

| Fil | Endring |
|---|---|
| `src/lib/planConstants.ts` | Fjerne system/leverandør-linjer, legge til Trust Engine-synlighet |
| `src/pages/MSPInvoices.tsx` | Fjerne "Inntil X systemer · Y leverandører"-teksten |

