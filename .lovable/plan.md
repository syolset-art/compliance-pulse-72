

# Realistisk bruksomfang basert på prosesstype

## Problemet
Frekvensvalget "Daglig / Ukentlig / Månedlig / Sjelden" passer ikke alle prosesser. En onboarding-prosess med AI-genererte videoer brukes kanskje bare 1-2 ganger i året - da er selv "Sjelden" misvisende. Systemet bør foreslå realistisk frekvens og omfang basert på hva prosessen faktisk handler om.

## Endringer

### 1. Utvid frekvensalternativene
Legg til "Hendelsesbasert" som et femte alternativ. Mange prosesser utløses av en hendelse (ny ansatt, ny kunde, avvik) i stedet for å kjøre på fast frekvens. Med dette alternativet vises et ekstra felt: "Estimert antall ganger per år" (f.eks. 2-5 for onboarding).

Nye alternativer:
- Daglig
- Ukentlig
- Månedlig
- Noen ganger i året
- Hendelsesbasert (med tallfelt for antall per år)

### 2. Intelligent forvalg av frekvens
Basert på prosessnavnet og AI-funksjonene foreslås en realistisk frekvens automatisk:
- Prosesser med "onboarding", "ansettelse", "rekruttering" -> "Noen ganger i året"
- Prosesser med "kundeservice", "support", "chat" -> "Daglig"
- Prosesser med "rapport", "revisjon", "audit" -> "Månedlig" eller "Noen ganger i året"
- Prosesser med "analyse", "overvåking" -> "Daglig" eller "Ukentlig"

### 3. Kontekstuell hjelpetekst under frekvensvalg
Vis en kort setning som forklarer hva systemet tror er riktig, f.eks.:
> "Onboarding skjer typisk ved nyansettelser - kanskje 1-5 ganger i året for de fleste bedrifter."

Brukeren kan selvsagt velge noe annet.

### 4. Fjern oppsummeringsboksen
Fjern "Oppsummering fra tidligere steg"-kortet (linje 984-1016) som ble bedt fjernet i forrige melding.

### 5. Realistiske standardverdier for berørte/beslutninger
Når frekvens er "Noen ganger i året" eller "Hendelsesbasert", foreslå lave tall i placeholder-teksten (f.eks. "1-5" i stedet for "0") slik at brukeren ser realistiske forventninger.

## Teknisk plan

### Fil: `src/components/process/ProcessAIDialog.tsx`

1. **Nytt frekvensalternativ**: Endre frekvens-arrayet fra 4 til 5 valg. Legg til `{ value: "yearly", label: "Noen ganger i året" }` og `{ value: "event_based", label: "Hendelsesbasert" }`. Fjern "Sjelden" (erstattes av de to nye).

2. **Ny hjelpefunksjon `suggestFrequency()`**: Tar inn `processName` (fra props/context) og returnerer foreslått frekvens + hjelpetekst. Enkel keyword-matching mot prosessnavnet.

3. **Betinget felt for hendelsesbasert**: Når `usageFrequency === "event_based"` vises et ekstra tallfelt: "Estimert antall ganger per år".

4. **Fjern oppsummeringsboks**: Slett linje 984-1016 (Card med "Oppsummering fra tidligere steg").

5. **Dynamiske placeholder-verdier**: Sett placeholder på tallfelter basert på valgt frekvens (daglig: "100-500", månedlig: "10-50", yearly/event: "1-10").

Ingen nye filer. Ingen databaseendringer.

