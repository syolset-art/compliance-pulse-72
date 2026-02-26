

# Plan: Flytt scope-spørsmål til siste steg + legg til 12-månedersmål

## Endringer

### 1. Ny databasekolonne
Legge til `goal_12_months` (text, nullable) i `company_profile`-tabellen for å lagre svaret på det nye spørsmålet.

### 2. Fjern "risk-profile"-steget (steg 4), flytt innholdet til "governance-snapshot" (siste steg)
- Fjern `risk-profile` fra Step-typen og all navigasjonslogikk (handleNext, handleBack, getStepNumber)
- Totalsteg reduseres fra 8 til 7
- Steg-rekkefølgen blir: company → industry → size → key-persons → use-cases → team-size → governance-snapshot → complete

### 3. Utvid "governance-snapshot"-steget
Under GovernanceSnapshot-komponenten, legg til en ny seksjon **"Mål og prioriteringer"** som inneholder:
- Geografisk scope (flyttes fra risk-profile)
- Sensitive personopplysninger (flyttes fra risk-profile)
- **Nytt spørsmål**: "Hva ønsker dere å oppnå de neste 12 månedene?" med tre radio-valg:
  - Få grunnleggende kontroll og dokumentasjon
  - Strukturere governance og leverandørstyring
  - Forberede sertifisering

### 4. Lagre det nye feltet
Oppdater `handleSubmit` til å inkludere `goal_12_months` i upsert til `company_profile`.

## Filer som endres

| Fil | Endring |
|---|---|
| `company_profile` (migration) | Legg til `goal_12_months text` |
| `src/components/onboarding/CompanyOnboarding.tsx` | Fjern risk-profile-steg, flytt scope-spørsmål + nytt mål-spørsmål til governance-snapshot, oppdater navigasjon |

