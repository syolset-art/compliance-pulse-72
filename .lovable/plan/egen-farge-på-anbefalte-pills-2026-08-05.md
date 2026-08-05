# Egen farge på anbefalte pills

Pillene under "Anbefalte produkter og tjenester" bruker i dag primærfargen (lilla), som er samme farge som CTA-knappene. De skal få en egen, tydelig adskilt farge.

## Fargevalg
Ny semantisk token "recommend" i oker/brun-familien — varm og rolig, klart forskjellig fra både den lilla CTA-fargen og den oransje warning-fargen:

- Lys modus: oker `hsl(35 55% 42%)` med hvit tekst, myk bakgrunn `recommend/10`
- Mørk modus: lysere oker `hsl(38 60% 58%)` med mørk tekst

## Endringer
- `src/index.css`: legg til `--recommend` / `--recommend-foreground` for lys og mørk modus.
- `tailwind.config.ts`: registrer `recommend` som fargeklasse.
- `src/pages/MSPDashboard.tsx` (RecommendationCell): bytt `primary`-klassene på pillene til `recommend` — valgt pill får fylt okerbakgrunn, uvalgt får `recommend/10` med okerkant.

CTA-knappene ("Tilbud" / "Aktiver") beholder dagens farger, slik at kontrasten mellom valgbare pills og handlingsknapper blir tydelig.
