
# Dokumentopplasting: Standarddatoer, tydeligere Confidence og compliance-effekt etter lagring

## Oversikt
Tre forbedringer i dokumentopplastingsdialogen:
1. Foreslaa "Gyldig fra" og "Gyldig til" med standardverdier nar AI ikke finner datoer
2. Gjore Confidence-indikatoren mer fremtredende (flyttes opp fra footer)
3. Etter lagring: vis en oppsummeringssteg som viser hvordan dokumentet pavirker compliance-scoren pa Trust Profile

## Hva som endres

### 1. Standarddatoer for "Gyldig fra" og "Gyldig til"
- Nar AI ikke returnerer datoer, sett standardverdier automatisk:
  - **Gyldig fra**: Dagens dato
  - **Gyldig til**: Basert pa dokumenttype (ISO 27001: +3 ar, SOC 2/penetrasjonstest: +1 ar, DPA/DPIA: +1 ar, andre: +1 ar)
- Nar AI returnerer datoer, bruk de som for
- Vis en liten "AI-forslag" eller "Standard"-badge pa datofeltene sa brukeren vet de kan justeres

### 2. Confidence-indikator flyttes opp
- Fjern confidence fra footer (nede til venstre, vanskelig a se)
- Plasser den rett under AI-oppsummeringen som et eget visuelt element med:
  - Fargekodet fremdriftslinje (gronn >80%, gul 50-80%, rod <50%)
  - Tydelig prosenttall og label "AI-konfidensgrad"

### 3. Ny "saved"-steg med compliance-effekt
- Legg til et fjerde steg i dialogen: `"upload" | "analyzing" | "review" | "saved"`
- Etter vellykket lagring, vis:
  - Gronn suksess-ikon med "Dokument lagret"
  - Animert compliance-score endring for profilen (f.eks. "65% -> 72%")
  - Liste over hvilke regelverk som na har bedre dekning
  - Knapp "Se Trust Profile" og "Lukk"
- Compliance-scoren beregnes enkelt: hent antall dokumenter na vs. forventet antall, og vis prosentvis dekning

## Tekniske detaljer

### Filer som endres
- `src/components/asset-profile/UploadDocumentDialog.tsx`
  - Legg til `"saved"` i Step-type
  - Legg til `getDefaultValidTo(docType)` hjelpefunksjon
  - Sett standarddatoer i `handleFileSelected` nar AI ikke returnerer datoer
  - Flytt confidence-visning fra footer til eget kort under AI-summary
  - Legg til nytt steg etter `handleSave` som viser compliance-effekt
  - I `handleSave`: etter lagring, hent oppdatert dokumenttelling og beregn compliance-endring

### Implementasjonsdetaljer

**Standarddatoer per dokumenttype:**

```text
iso27001:         +3 ar
soc2:             +1 ar
penetration_test: +1 ar
dpa:              +1 ar
dpia:             +2 ar
certificate:      +3 ar
policy:           +1 ar
andre:            +1 ar
```

**Compliance-beregning (forenklet demo):**
- Hent antall dokumenter for asseten etter lagring
- Beregn coverage basert pa forventede dokumenttyper (DPA, DPIA, SOC2, ISO 27001, Pentest = 5 typer)
- Vis for/etter score med animert overgang

**Confidence-visning:**
- Fremdriftslinje med Progress-komponenten
- Fargekode: gronn (>=80%), gul (50-79%), rod (<50%)
- Plassert som et visuelt kort mellom AI-summary og skjemafeltene
