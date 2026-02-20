

# MSP Rådgivnings-onboarding og Acronis-tilpasset dashboard

## Bakgrunn

MSP-partnere som selger Mynder til sine kunder trenger en strukturert rådgivningsprosess -- ikke bare teknisk setup. Typiske spørsmål som "Har dere styregodkjent risikovurdering?" og "Har dere dokumentert backup-testing?" bør integreres i plattformen slik at onboarding blir en compliance-kartlegging, ikke bare en registrering.

Dagens dashboard og onboarding mangler:
- Kobling til Acronis-data (enheter som allerede er importert)
- MSP-spesifikke rådgivningsspørsmål som gir verdi under onboarding
- Et "steg 2" for kunder som har eller vurderer MSP-leverandør

## Hva skal bygges

### 1. MSP Compliance Assessment -- nytt steg i kunderegistrering

Utvid `AddMSPCustomerDialog` med et ekstra steg **etter** at basisinfo er fylt inn. Steget inneholder en rask compliance-kartlegging med 6-8 spørsmål MSP-partneren stiller kunden:

| Spørsmål | Svaralternativ | Påvirkning |
|----------|---------------|------------|
| Har dere styregodkjent risikovurdering? | Ja / Nei / Usikker | Prioriterer risikomodul |
| Har dere dokumentert backup-testing? | Ja / Nei / Usikker | Kobles til Acronis-data |
| Har dere behandlingsprotokoll (ROPA)? | Ja / Nei / Usikker | Prioriterer GDPR-sjekkliste |
| Har dere hendelseshåndteringsrutine? | Ja / Nei / Usikker | Aktiverer avviksmodul |
| Har dere databehandleravtaler med alle leverandører? | Ja / Nei / Usikker | Prioriterer leverandørstyring |
| Er ansatte opplært i informasjonssikkerhet? | Ja / Nei / Usikker | Anbefaler Mynder Me-kurs |

Svarene lagres i en ny `msp_customer_assessments`-tabell og brukes til å generere en tilpasset handlingsplan for kunden.

### 2. MSP Customer Detail -- utvidet med rådgivningsstatus

Utvid `MSPCustomerDetail`-siden med:
- **Compliance Assessment-kort**: Viser resultat av kartleggingen (antall "Ja" vs "Nei") med fargekoding
- **Acronis-status**: Hvis Acronis er koblet til, vis antall beskyttede enheter og backup-status for denne kunden
- **Anbefalt handlingsplan**: Automatisk generert basert på kartleggingssvar -- "Mangler backup-dokumentasjon", "Trenger hendelseshåndteringsrutine" etc.

### 3. PostOnboardingRoadmapWidget -- MSP-aware

Hvis brukeren er registrert via en MSP-partner (sjekk `company_profile` for MSP-kobling), vis tilpassede handlinger i roadmap-widgeten:
- "Koble til Acronis for å importere enheter" (hvis ikke allerede koblet)
- "Gå gjennom risikovurdering med din IT-partner"
- "Verifiser backup-rutiner" (koblet til Acronis-data)

### 4. Database-endringer

**Ny tabell: `msp_customer_assessments`**

```text
id                  uuid (PK)
msp_customer_id     uuid (FK -> msp_customers)
question_key        text (f.eks. "risk_assessment_approved")
answer              text ("yes" / "no" / "unsure")
notes               text (valgfritt)
assessed_by         text
assessed_at         timestamptz
created_at          timestamptz
```

RLS: Tilgang styres via `msp_user_id` gjennom join til `msp_customers`.

**Ny kolonne i `msp_customers`:**
- `has_acronis_integration` boolean default false
- `acronis_device_count` integer default 0
- `initial_assessment_score` integer default 0 (prosent "ja"-svar)

## Teknisk plan

### Fil 1: Database-migrasjon
- Opprett `msp_customer_assessments`-tabell med RLS
- Legg til nye kolonner i `msp_customers`

### Fil 2: `src/lib/mspAssessmentQuestions.ts` (ny)
- Definerer spørsmålene som en konstant array med `key`, `question_no`, `question_en`, `category`, `impact_area`
- Gjenbrukbar i dialog og i kundedetaljvisning

### Fil 3: `src/components/msp/MSPAssessmentStep.tsx` (ny)
- Komponent med 6-8 spørsmål, hvert med Ja/Nei/Usikker-knapper
- Viser fremdrift (3 av 6 besvart)
- Brukes som steg 2 i `AddMSPCustomerDialog`

### Fil 4: `src/components/msp/AddMSPCustomerDialog.tsx` (endring)
- Legg til steg-logikk: Steg 1 = basisinfo (eksisterende), Steg 2 = compliance-kartlegging
- Etter steg 2, lagre svar til `msp_customer_assessments` og beregn `initial_assessment_score`

### Fil 5: `src/components/msp/MSPAssessmentCard.tsx` (ny)
- Viser kartleggingsresultat som et kort med prosent-score og liste over mangler
- Brukes i `MSPCustomerDetail`

### Fil 6: `src/pages/MSPCustomerDetail.tsx` (endring)
- Legg til `MSPAssessmentCard` og Acronis-status i kundedetaljvisningen
- Vis "Anbefalte handlinger" basert på kartleggingssvar

### Fil 7: `src/components/widgets/PostOnboardingRoadmapWidget.tsx` (endring)
- Sjekk om selskapet har MSP-partner via `company_profile`
- Hvis ja, inkluder MSP-spesifikke handlinger (Acronis, backup-verifisering)

## Brukerflyt for MSP-partner

```text
MSP-partner logger inn
  -> Partneroversikt (/msp-dashboard)
  -> Klikk "Legg til kunde"
  -> Steg 1: Basisinfo (navn, org.nr, bransje, kontakt)
  -> Steg 2: Compliance-kartlegging (6 spørsmål)
  -> Kunde opprettes med assessment-score
  -> Kundedetalj viser handlingsplan basert på svar
  -> Hvis Acronis koblet: viser enheter og backup-status
```

## Hva dette gjør for MSP-partneren

- Onboarding blir en **rådgivningsprosess** der partneren stiller de riktige spørsmålene
- Kartleggingen skaper umiddelbar verdi for kunden ("vi fant 4 av 6 mangler")
- Resultatene gir partneren et konkret salgsargument for oppfølging
- Acronis-data kobles til compliance-kontekst (backup-testing = ISO 27001 A.12.3)

