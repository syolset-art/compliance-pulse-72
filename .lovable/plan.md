

# Plan: Utvidet kunderegistrering med gap-analyse og automatisk Trust Profile

## Oversikt
Utvide `AddMSPCustomerDialog` fra en 4-stegs flyt til en 6-stegs flyt som inkluderer compliance-kartlegging (assessment), gap-analyse med anbefalte regelverk, og automatisk opprettelse av Trust Profile (asset med `asset_type: 'self'`) ved fullføring.

## Ny steg-flyt

```text
1. Metode       → Velg registreringsmetode (uendret)
2. Søk/Velg     → BrReg-søk og verifisering (uendret)
3. Kontakt      → Kontaktperson og rolle (uendret)
4. Assessment   → Compliance-kartlegging (NYTT)
5. Gap-analyse  → Vis resultater + velg regelverk (NYTT)
6. Bekreft      → Oppsummering + "Legg til" (NYTT)
```

## Hva skal bygges

### 1. Utvide assessment-spørsmålene (`mspAssessmentQuestions.ts`)
- Legge til flere spørsmål som dekker alle fire domener (styring, drift/sikkerhet, personvern, tredjepartstyring)
- Legge til `framework_triggers`-felt som knytter spørsmål til spesifikke regelverk (f.eks. "Nei" på kritisk infrastruktur → NIS2 anbefalt)
- Totalt ca. 12-15 spørsmål, gruppert per kategori

### 2. Nytt steg: Assessment i dialogen
- Gjenbruke og tilpasse `MSPAssessmentStep`-komponenten inne i dialogen
- Vise spørsmål gruppert per kategori med Ja/Nei/Usikker-knapper
- Vise progresjon ("X av Y besvart")

### 3. Nytt steg: Gap-analyse og regelverksvalg
- Ny komponent `MSPGapAnalysisStep` som viser:
  - Compliance-score basert på svarene
  - Liste over identifiserte gap (røde/gule flagg)
  - Automatisk anbefalte regelverk basert på svar + bransje (f.eks. helse → GDPR + ISO 27001, finans → DORA)
  - Toggles for å velge/fjerne regelverk før opprettelse
- Bruke eksisterende `frameworkDefinitions.ts` for regelverkslisten

### 4. Oppsummeringssteg med "Legg til"
- Vise alt samlet: firmanavn, kontaktinfo, score, valgte regelverk
- "Legg til"-knapp som utfører:

### 5. Automatisk opprettelse ved lagring (`handleSave`)
Når partneren trykker "Legg til":
1. Opprette `msp_customers`-rad med `compliance_score`, `active_frameworks`, `status: 'active'`, `onboarding_completed: true`
2. Lagre assessment-svar til `msp_customer_assessments`-tabellen
3. Opprette en `assets`-rad med `asset_type: 'self'` og kundens navn/org.nr — dette er kundens Trust Profile
4. Tildele tilgjengelig lisens (eksisterende logikk)

## Filer som endres/opprettes

| Fil | Endring |
|-----|---------|
| `src/lib/mspAssessmentQuestions.ts` | Utvide med flere spørsmål + `framework_triggers` |
| `src/components/msp/AddMSPCustomerDialog.tsx` | Ny flyt med 6 steg, inkludert assessment og gap-analyse |
| `src/components/msp/MSPGapAnalysisStep.tsx` | **Ny** — viser gap-resultater og regelverksvalg |
| `src/components/msp/MSPAssessmentStep.tsx` | Liten justering for å støtte bruk i dialog-kontekst |

## Teknisk

- Ingen database-endringer nødvendig — bruker eksisterende tabeller (`msp_customers`, `msp_customer_assessments`, `assets`)
- Framework-anbefaling: enkel mapping fra bransje + assessment-svar → regelverk (client-side logikk)
- Trust Profile (asset) opprettes med `metadata` som inneholder assessment-score og valgte regelverk

