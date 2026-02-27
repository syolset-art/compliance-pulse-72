

# Plan: Flytt compliance-organisering til nøkkelperson-steget

## Endring
Steget "key-persons" omdøpes til **"Tilgang og organisering"** og utvides med:

1. **Organisering av compliance** (radio):
   - Håndteres internt
   - Internt med ekstern bistand
   - Primært ekstern partner

2. **Ekstern partner admin-tilgang** (Ja/Nei) — vises kun ved "ekstern bistand" eller "primært ekstern"

3. **Nøkkelpersoner** (eksisterende KeyPersonnelSection — Compliance-ansvarlig påkrevd, DPO/CISO dynamisk)

## Database
Ny migrasjon: legg til `compliance_organization` (text, nullable) og `external_partner_admin` (boolean, nullable) i `company_profile`.

## Filer som endres

| Fil | Endring |
|---|---|
| Migrasjon | 2 nye kolonner |
| `CompanyOnboarding.tsx` | Utvid formData + legg til compliance-org UI i key-persons-steget + oppdater submit |
| `CompactCompanyOnboarding.tsx` | Samme spørsmål i compact-flyten |
| `governanceLevelEngine.ts` | Legg til `"scaleup"` kategori |

## Steg-tittel
```text
Steg 4: Tilgang og organisering
  → Organisering av compliance (3 valg)
  → Ekstern partner admin-tilgang? (betinget)
  → Nøkkelpersoner (Compliance-ansvarlig obligatorisk, DPO/CISO dynamisk)
```

