

# Legg til "Hjelp fra Lara" for formålsbeskrivelse i Steg 1

## Konsept
Brukeren skal kunne be Lara om hjelp til å skrive eller forbedre formålsbeskrivelsen for AI-bruk i prosessen. En knapp ved siden av textarea-feltet lar brukeren enten generere en beskrivelse fra scratch (basert på prosessnavn, valgte systemer og funksjoner) eller forbedre en eksisterende tekst.

## Brukeropplevelse

Når `hasAI === true` og formålsfeltet vises:

1. **Tom textarea**: Knappen sier "Foreslå med Lara" og genererer en formålsbeskrivelse basert på kontekst (prosessnavn, tilknyttede systemer, oppdagede AI-funksjoner)
2. **Utfylt textarea**: Knappen sier "Forbedre med Lara" og sender den eksisterende teksten til Lara for omformulering/forbedring
3. **Laster**: Knappen viser spinner og er deaktivert mens AI-kallet kjører
4. **Resultat**: Teksten settes inn i textarea, brukeren kan redigere videre

## Teknisk plan

### Ny edge function: `supabase/functions/suggest-ai-purpose/index.ts`

En dedikert edge function som bruker Lovable AI Gateway (ikke streaming) for å generere formålsbeskrivelser:

- Input: `processName`, `existingPurpose` (valgfri), `systemNames` (valgfri), `aiFeatures` (valgfri)
- System-prompt instruerer modellen til å skrive en kort, presis norsk formålsbeskrivelse (2-4 setninger) tilpasset compliance-dokumentasjon
- Hvis `existingPurpose` finnes: forbedre/omformuler den
- Hvis tom: generer fra kontekst
- Bruker `google/gemini-2.5-flash` for rask respons
- Returnerer `{ purpose: string }` (ikke streaming, vanlig JSON)

### Fil: `src/components/process/ProcessAIDialog.tsx`

1. **Ny state**: `isGeneratingPurpose: boolean` (default: false)

2. **Ny funksjon `handleSuggestPurpose()`**:
   - Setter `isGeneratingPurpose = true`
   - Kaller `supabase.functions.invoke('suggest-ai-purpose', { body: { processName, existingPurpose: aiPurpose, systemNames, aiFeatures } })`
   - Setter `setAiPurpose(data.purpose)` ved suksess
   - Viser toast ved feil
   - Setter `isGeneratingPurpose = false`

3. **UI under textarea** (linje 674-675):
   - En kompakt knapp med Sparkles-ikon: "Foreslå med Lara" (tom) / "Forbedre med Lara" (utfylt)
   - Plasseres rett under textarea, høyrejustert
   - Liten tekst under: "Lara bruker prosessnavnet og tilknyttede systemer som kontekst"

Ingen databaseendringer.
