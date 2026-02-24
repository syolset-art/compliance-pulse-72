

# Forbedre "Identifikasjon"-steget i AI-bruk dokumentasjon

## Problem
Lara sin vurderingsboks i steg 1 er forvirrende:
- Viser "AI oppdaget i tilknyttet system" sammen med "Systemer bruker 0 AI-funksjoner" -- motstridig
- Sier ikke hvilket system det gjelder
- Brukeren kan ikke klikke seg inn pa systemet for a se Trust Profilen
- Vurderingen vises uavhengig av om brukeren har svart pa hovedsporsmalet

## Losning

### 1. Flytt og omstrukurer Lara-kortet
Lara sin vurdering vises som et forslag -- ikke som en fasit. Strukturen blir:

- **Forstesporsmal beholdes overst**: "Bruker denne prosessen AI?" (Ja/Nei)
- **Lara-forslag under sporsmalet**: Vises kun nar Lara faktisk har funnet noe relevant (enten fra systemdata eller prosessanalyse)
- Forslaget presenteres som: "Lara foreslaar: Ja, basert pa [kilde]" med en "Bruk forslag"-knapp

### 2. Vis systemnavnet med lenke
Nar AI er oppdaget i et tilknyttet system:
- Vis systemnavnet eksplisitt (f.eks. "Microsoft 365")
- Gjor navnet klikkbart -- apner systemets Trust Profile (`/systems/{id}`)
- Vis AI-funksjonene fra det systemet under navnet
- Fjern de motstriende badge-ene ("System bruker AI" + "0 AI-funksjoner")

### 3. Rydd opp i badge-logikken
Fjern alle badges som kan motsi hverandre. Erstatt med en enkel, tydelig melding:
- Enten: "Lara har oppdaget AI-bruk i [Systemnavn]" (med funksjonsliste)
- Eller: "Basert pa prosesstypen er det sannsynlig at AI brukes" (fra prosessanalyse)
- Aldri begge i en forvirrende kombinasjon

## Teknisk plan

### Fil: `src/components/process/ProcessAIDialog.tsx`

**Linje 537-575 (Lara-kortet)**: Erstatt helt med ny struktur:

1. Sjekk `systemAI?.systems` for a finne systemer med `hasAI === true` -- bruk systemnavnet
2. Bruk `linkedSystems` for a finne system-ID-en for lenking
3. Vis en kompakt Card med:
   - Systemnavn som klikkbar lenke (bruker `useNavigate` til `/systems/{id}`)
   - AI-funksjoner fra det systemet (ikke "0 funksjoner")
   - "Bruk Lara sitt forslag"-knapp som setter `hasAI = true`
4. Nar prosessanalyse (ikke system) er kilden: Vis `suggestions.aiActNote` med "Sannsynlig AI-bruk"-indikator
5. Fjern de to motstridende Badge-komponentene (linje 568-569)

**Linje 538 (betingelse)**: Stram opp betingelsen -- vis kun nar det faktisk er noe nyttig:
- `systemAI?.totalWithAI > 0` (system med AI funnet) ELLER
- `suggestions?.likelyAI` (prosessbasert vurdering sier sannsynlig)
- Ikke vis nar `suggestions?.aiActNote` finnes men `likelyAI` er false

**Ny: "Bruk forslag"-knapp**: Nar brukeren klikker, settes `hasAI = true` og `aiPurpose` fylles med systemets beskrivelse. Brukeren slipper a velge manuelt.

**Systemlenke**: `onClick` bruker `window.open` eller `navigate` til `/systems/${systemId}` i ny fane for a ikke miste wizard-state.

Ingen nye filer. Ingen databaseendringer.
