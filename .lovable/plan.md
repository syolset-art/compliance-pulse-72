

# Fiks AI-funksjoner i veiviseren (Steg 2)

## Problem
1. Gamle/ugyldige AI-funksjoner (som "Fisk") kan fortsatt vises fra databasen
2. Hvis brukeren fjerner alle funksjoner, kan de ikke gå videre (Steg 2 krever minst en valgt funksjon)
3. Det finnes ingen AI-basert generering av funksjonsforslag relatert til formalet
4. Brukeren har ingen enkel vei videre hvis AI ikke klarer a generere forslag

## Losning

### 1. Ny edge function: `supabase/functions/suggest-ai-features/index.ts`

Genererer relevante AI-funksjoner basert pa prosessnavn, formal og kontekst:

- Input: `processName`, `purpose`, `systemNames` (valgfri)
- Returnerer: `{ features: string[] }` (4-6 forslag)
- Bruker `google/gemini-2.5-flash` via Lovable AI Gateway
- Systemprompten instruerer modellen til a foreslaa konkrete, norske AI-funksjoner relevante for prosessen
- Handterer 429/402-feil korrekt

### 2. Endringer i `src/components/process/ProcessAIDialog.tsx`

**Ny state og funksjon:**
- `isGeneratingFeatures: boolean`
- `handleSuggestFeatures()` som kaller edge-funksjonen og legger til forslag i listen (uten a fjerne eksisterende)

**Endre `canProceed` (linje 466):**
Fjern kravet om at minst en funksjon maa vaere valgt for a ga videre. Brukeren kan velge a ikke ha noen funksjoner og heller legge til manuelt senere.

Ny logikk:
```
if (currentStep === 1) return true; // alltid tillat videre
```

**Legg til "Foresla med Lara"-knapp i Steg 2 (Funksjoner):**
- Plasseres over listen med funksjoner, som en CTA-knapp
- Vises alltid, men er spesielt prominent nar listen er tom
- Knappen sier "Foresla AI-funksjoner" med Sparkles-ikon
- Ved klikk: kaller edge-funksjonen med prosessnavn + formal som kontekst
- Nye forslag legges til listen som valgte (selected: true)
- Duplikater filtreres bort

**Tom-tilstand:**
- Nar det ikke finnes funksjoner og AI-generering feiler, vis tydelig melding:
  "Ingen AI-funksjoner funnet. Legg til manuelt nedenfor."
- Det manuelle input-feltet (som allerede finnes) forblir tilgjengelig

### 3. Registrere ny edge function

Oppdatere `supabase/config.toml` med den nye funksjonen.

## Filer som endres
- `supabase/functions/suggest-ai-features/index.ts` (ny)
- `supabase/config.toml` (registrering)
- `src/components/process/ProcessAIDialog.tsx` (ny knapp, oppdatert canProceed, ny state/funksjon)

