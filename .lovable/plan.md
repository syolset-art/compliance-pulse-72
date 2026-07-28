## Mål
I tjenestekatalogen skal hver tjeneste primært vise hvilke **konkrete krav/artikler** den dekker i et regelverk — ikke bare regelverksnavnet. Data ligger allerede: hver `template.mappings[i]` har `frameworkLabel` + `controlIds` (f.eks. `GDPR Art.5, Art.6, Art.13, Art.30`).

## Endringer

### 1. Tjenestetabellen i `MSPServiceCatalogTab.tsx`
- Bytt kolonneoverskriften `Regelverk` → `Krav dekket`.
- Erstatt dagens chip per regelverk med kompakte "krav-chips" gruppert per regelverk, format:
  - `GDPR · Art.5, Art.6, Art.13 +1`  (viser 3 første artikler, resten som `+N`)
  - Én rad/chip per regelverk tjenesten mapper til, maks 2 regelverk synlig + `+N regelverk til`.
- Spesialverdier som `"varierer"`, `"utvalg"`, `"helhetlig"` vises som en nøytral etikett (f.eks. `ISO 27001 · utvalg`) i stedet for artikkelnummer.
- Tooltip på chip: full liste over artikler for det regelverket.

### 2. Detaljvisning ved klikk (samme fil, `openTemplatePreview`-flyt)
- I preview-panelet vises hvert regelverk med full artikkelliste + Lara-hint der artikkel finnes i `FRAMEWORK_CATALOG` (label fra `controlPoints`).
- Behold eksisterende "legg til"-handling uendret.

### 3. Ingen endring i datamodell
- `serviceLibrary.ts` beholdes som den er — vi bruker bare `controlIds` som allerede finnes.
- Ingen endring i Mynder-videresalgs­kortene (de er produkter, ikke krav-mappede tjenester).

## Teknisk
- Ny liten helper i samme fil (eller `src/lib/serviceLibrary.ts`) `formatCoveredArticles(mapping, maxShown = 3)` som håndterer artikkel-forkortelse + spesialverdier.
- Bruk `Tooltip` fra `@/components/ui/tooltip` for full liste.
- Alt beholdes innenfor eksisterende design tokens; ingen nye farger.

## Ut av scope
- Redigering av hvilke krav en tjeneste dekker (kommer senere som egen "Rediger tjeneste"-flyt).
- Endringer i "Avansert / regelverks-bygger"-seksjonen — den bygger allerede rundt kontrollpunkter.
- Mynder-produkter (Core/Leverandør/Assets) — de selges som produkter, ikke krav-tjenester.
