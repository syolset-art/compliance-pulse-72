
# Redesign av KI-bruk dokumentasjon veiviseren

## Problem
Veiviseren for KI-bruk dokumentasjon (ProcessAIDialog) er for tung og uoversiktlig:
- Pyramiden tar for mye plass og gir ikke nok kontekst til brukeren
- Det er uklart hvorfor man fyller ut hvert steg og hva som allerede er kjent
- For mange steg som føles frakoblet fra hverandre
- Resultatet (klassifiseringen) er ikke tydelig fremhevet

## Designendringer

### 1. Fremhev resultatet -- risikoklassifiseringen
- Flytt risikoklassifiserings-resultatet til toppen av steg 4 som et stort, tydelig resultat-kort med farge og ikon
- Vis en kontekstlinje: "Basert på X AI-funksjoner du har registrert, foreslår vi:"
- La brukeren enkelt overstyre ved a klikke en annen risiko, men gjor pyramiden til en kompakt forklaring/referanse -- ikke hovedfokus

### 2. Gjor pyramiden til en forklaring, ikke interaksjon
- Bytt ut den store interaktive pyramiden med en kompakt horisontal risiko-indikator (4 fargede segmenter) der valgt risiko er markert
- Legg pyramide-forklaringen i en "Les mer"-kollapserbar seksjon med eksempler
- Spar plass og la resultatet snakke for seg

### 3. Kontekstuell sammenheng mellom steg
- Legg til en kort oppsummering ovenfor hvert steg som viser hva som allerede er besvart:
  - Steg 3 (Sjekkliste): "Du har registrert X AI-funksjoner. Bekreft at disse kravene er oppfylt."
  - Steg 4 (Risiko): "Basert pa funksjonene og sjekklisten foreslår vi denne klassifiseringen."
  - Steg 5 (Transparens): "For [risikoniva] krever AI Act folgende tiltak."
  - Steg 6 (Bruksomfang): "Siste steg: hvor mye brukes AI i praksis?"

### 4. Forenkling av Transparens-steget (steg 5)
- Fjern den store "manuell vurdering"-advarselen og erstatt med en kort kontekstuell setning
- Vis kun relevante felter basert pa valgt risikoniva (minimal risiko = ingen transparenskrav, skip felter)
- Gjor "Trenger menneskelig oversikt"-checkbox til en enkel toggle med kompakt beskrivelse

### 5. Stepper-forbedring
- Gjor stepperen mer kompakt -- vis kun ikon + kort tittel
- Vis gron hake for fullforte steg med en tydeligere visuell progresjon

## Teknisk plan

### Filer som endres:

**`src/components/process/ProcessAIDialog.tsx`** (hovedendringer):
- Steg 4 (Risikoklassifisering, linje 670-781): Redesign layout
  - Flytt resultat-kort til toppen med stor farge/ikon
  - Erstatt `<AIRiskPyramid>` med kompakt horisontal risiko-velger
  - Legg til kontekstlinje som refererer til valgte funksjoner
  - Gjor pyramiden til en kollapserbar "Slik fungerer EU AI Act risikoniva"-seksjon
- Steg 5 (Transparens, linje 784-893): Forenkle
  - Erstatt stor advarselskort med kort inline-tekst
  - Skjul transparensfelter for "minimal" risiko
  - Kompaktere layout
- Alle steg: Legg til kontekstuell oppsummering av tidligere svar
- Stepper (linje 396-409): Mer kompakt design med haker

**`src/components/process/AIRiskPyramid.tsx`**:
- Legg til ny eksport: `AIRiskSelector` -- en kompakt horisontal risiko-velger med 4 fargede knapper
- Behold pyramiden som valgfri "forklaring"-komponent

Ingen nye filer eller avhengigheter trengs.
