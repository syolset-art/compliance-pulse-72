

# Endre siste steg til "KI-avhengighet"

## Konsept
Siste steg handler ikke lenger om bruksomfang (frekvens, antall), men om a forstaa **konsekvensen om AI-en slutter a fungere**. Navnet endres til "KI-avhengighet" og innholdet struktureres rundt tre dimensjoner som bygger pa det brukeren allerede har oppgitt.

## Ny struktur for Steg 6

### Tre dimensjoner presentert pedagogisk

Steget viser tre kort/seksjoner, hver med en kontekstuell forklaring og et enkelt valg:

**1. Omfang** (skala/berorte personer)
- Teksten refererer til de berorte gruppene brukeren valgte i steg 5 (f.eks. "Du har oppgitt at ansatte og kunder berores")
- Brukeren oppgir estimert antall berorte per gang/maned i et enkelt tallfelt
- Hjelpetekst med realistisk forslag basert pa prosessnavn (beholder `suggestFrequency`-logikken for kontekst)

**2. Integrasjon** (hvor stor del av prosessen er AI-drevet)
- Tre valg:
  - **Supplement** - AI er et hjelpemiddel, prosessen fungerer uten
  - **Delvis integrert** - AI handterer vesentlige deler, men kan erstattes manuelt
  - **Kjernekomponent** - AI er selve motoren i prosessen
- Kontekstuell tekst basert pa valgte funksjoner, f.eks. "Du har registrert 3 AI-funksjoner i denne prosessen"

**3. Kritikalitet ved bortfall** (hva skjer om AI-en feiler)
- Tre valg:
  - **Ikke avhengig** - Prosessen kan kjore uten AI uten merkbar konsekvens
  - **Delvis avhengig** - Prosessen pavirkes, men kan gjennomfores manuelt med mer tid/ressurser
  - **Kritisk avhengig** - Prosessen stopper eller gir vesentlig forringet kvalitet uten AI
- Tekstfelt for a beskrive konsekvensen ved bortfall (f.eks. "Manuell onboarding tar 3x lengre tid")
- Lara-forslag basert pa risikoniva og integrasjonsvalg

### Automatisk foreslatt avhengighetsgrad
Basert pa kombinasjonen av integrasjon + antall funksjoner + risikoniva foreslaar Lara en samlet avhengighetsgrad. Brukeren kan overstyre.

## Teknisk plan

### Fil: `src/components/process/ProcessAIDialog.tsx`

1. **STEPS-array (linje 80)**: Endre `{ id: 'usage', title: 'Bruksomfang', icon: Users }` til `{ id: 'dependency', title: 'KI-avhengighet', icon: AlertTriangle }` (AlertTriangle allerede importert eller bruker Shield).

2. **Nye state-variabler** (legges til ved eksisterende state-deklarasjoner):
   - `aiIntegrationLevel`: `'supplement' | 'partial' | 'core'` (default: `''`)
   - `aiDependencyLevel`: `'not_dependent' | 'partially_dependent' | 'critically_dependent'` (default: `''`)
   - `failureConsequence`: `string` (fritekst, default: `''`)
   - Behold `estimatedAffectedPersons` for omfang

3. **Erstatt hele Step 6 UI (linje 966-1139)** med tre kort:

   **Kort 1 - Omfang**: Kompakt - viser berorte grupper fra steg 5 + tallfelt for antall berorte. Beholder realistisk placeholder-logikk.

   **Kort 2 - Integrasjon**: Tre valgknapper (supplement/delvis/kjerne) med korte forklaringer. Kontekstuell tekst viser antall valgte funksjoner.

   **Kort 3 - Kritikalitet ved bortfall**: Tre valgknapper (ikke/delvis/kritisk avhengig) + textarea for a beskrive konsekvens. Lara-ikon med foreslatt tekst basert pa kontekst.

4. **Samlet avhengighetsindikator**: Nederst vises en oppsummerende badge/kort som kombinerer de tre dimensjonene til en samlet avhengighetsgrad (lav/moderat/hoy). Beregnes automatisk.

5. **Oppdater `saveMutation`**: Lagre de nye feltene (`ai_integration_level`, `ai_dependency_level`, `failure_consequence`) i `process_ai_usage`-tabellen. Fjern/behold de gamle numeriske feltene som valgfrie.

6. **Fjern gammel kode**: Frekvensvalg, overstyringsprosent og det meste av den gamle "Bruksomfang"-UI-en fjernes. Estimert berorte beholdes.

### Database
Tre nye kolonner i `process_ai_usage`:
- `ai_integration_level TEXT` (supplement/partial/core)
- `ai_dependency_level TEXT` (not_dependent/partially_dependent/critically_dependent)
- `failure_consequence TEXT` (fritekst)

