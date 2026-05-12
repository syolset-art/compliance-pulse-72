## Fjerne Lara-analysefeltet fra dokumentasjonsseksjonen

Brukeren vil fjerne hele "Lara-analyse av dokumentasjon"-kortet som vises nederst i dokumentasjonsseksjonen på Rediger profil-siden.

### Endring

**Fil:** `src/components/trust-center/edit/DocumentationSection.tsx`

- Fjern hele analysekortet (linje 192–290), inkludert badge-status, vurderinger per dokument, manglende dokumentasjon-listen og "Kjør på nytt"-knappen.
- Rydd opp ubrukt kode etter fjerning:
  - State: `analyzing`, `gap`, og tilhørende setters
  - Funksjon: `runGapAnalysis`
  - Query/fetch som henter eksisterende gap-analyse
  - Ubrukte imports: `Sparkles`, `Loader2`, `CheckCircle2`, `AlertCircle`, `AlertTriangle`, `Badge`, samt `supabase.functions.invoke`-kallet hvis ingen andre bruker det
  - `frameworkCount`-variabelen hvis den kun brukes her

Edge-funksjonen `analyze-doc-gap` beholdes urørt (kan brukes senere), men UI-inngangen fjernes helt.

Ingen andre filer påvirkes.