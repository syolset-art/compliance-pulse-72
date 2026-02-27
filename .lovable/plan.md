

# Plan: Legg til estimert antall systemer og leverandører

## Endringer

### 1. Database: 2 nye kolonner i `company_profile`
- `estimated_systems_count` (text, nullable)
- `estimated_vendors_count` (text, nullable)

### 2. UI: Legg til i "Mål og prioriteringer" (governance-snapshot)
Plasseres **før** 12-månedersmål-spørsmålet i `CompanyOnboarding.tsx`.

**"Omtrent hvor mange IT-systemer bruker dere?"**
- 1–20
- 21–50
- 51–100
- Over 100
- Vet ikke

**"Omtrent hvor mange leverandører har dere?"**
- 1–5
- 6–20
- 21–50
- Over 50
- Vet ikke

### 3. Compact-onboarding
Legg til samme spørsmål i `CompactCompanyOnboarding.tsx` i scope-seksjonen.

### 4. Oppdater formData og handleSubmit
Inkluder de to nye feltene i state og i upsert-kallet til databasen.

### Filer som endres

| Fil | Endring |
|---|---|
| Migrasjon | 2 nye kolonner |
| `CompanyOnboarding.tsx` | formData + 2 spørsmål i governance-snapshot + submit |
| `CompactCompanyOnboarding.tsx` | formData + 2 spørsmål + submit |

