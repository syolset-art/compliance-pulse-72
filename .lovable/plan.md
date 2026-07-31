## Mål
Når Lara foreslår en kobling (Regelverk › Krav › Kontrollområde), skal partneren kunne se hvilken dokumentasjon som typisk kreves for det kravet — som en subtil lenke/tooltip i radene. Det gir partneren noe konkret å selge og forsterker at Mynder er kilden.

## Hva som bygges

1. **Utvid dokumentasjonshintene** (`src/lib/requirementDocumentationHints.ts`)
   - Dagens `getTypicalDocumentation` dekker GDPR Art. 28/30/32/33/35, ISO 27001 A.5–A.8 og NIS2 med et generisk fallback.
   - Legg til hint for de øvrige rammeverkene som brukes i forslagene (DORA, AI Act, Åpenhetsloven) og flere GDPR/ISO-artikler.
   - Legg til en `hasSpecificDocumentation(requirementId)`-hjelper slik at UI kun viser lenken når det finnes et reelt, spesifikt hint (ikke det generiske «Policy/Prosedyre»).

2. **Vis hintet i forslagsradene** (`src/components/msp/CustomServiceDialog.tsx`, `SuggestionRow`)
   - Subtil knapp helt til høyre i raden: dokument-ikon + teksten «Anbefalt dokumentasjon» (kun ikon på smale rader).
   - Klikk/hover åpner en liten popover med:
     - Kravets navn (f.eks. «GDPR Art. 30 (Protokoll)»)
     - Punktliste med typiske dokumenter
     - Én linje: «Typisk dokumentasjon Mynder forventer for dette kravet.»
   - Vises kun når det finnes et spesifikt hint, så radene ikke fylles med støy.
   - Samme visning brukes på de allerede koblede radene («extraMappings») for konsistens.

3. **Ingen endring i logikk for treff/konfidens** — dette er ren visning på toppen av eksisterende mapping.

## Teknisk
- Bruker eksisterende `Popover`/`Tooltip` fra shadcn og `FileText`-ikon fra lucide.
- Hint slås opp på `controlId` (samme format som `ManualDocumentationDialog` allerede bruker), med `frameworkId` som ekstra kontekst for å velge riktig regelsett.
- Ingen backend- eller datamodellendringer.

## Merknad
Den valgte raden viser «GDPR › helhetlig › helhetlig» — et støyforslag der id og label er samme ord. Støyfilteret i `serviceMappingSuggester.ts` fanger «id === label» kun etter trimming/lowercase, så dette burde vært filtrert; jeg verifiserer og utvider filteret i samme runde hvis det slipper gjennom.
