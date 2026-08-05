# Større og mer lesbar tekst i hele appen

Teksten i grensesnittet er i dag klemt ned mot minimumsgrensene (12–14 px). Vi hever hele skalaen ett hakk, slik at brukere med nedsatt syn kan lese uten å zoome, uten at layouten brekker.

## Hva som endres

Alle størrelser justeres sentralt i den globale stilfilen, så endringen slår gjennom overalt på én gang — ingen komponenter må røres.

| Nivå | I dag | Nytt |
|---|---|---|
| Bittesmå merkelapper (10–11 px i koden) | 12 px | 13 px |
| Små merkelapper / hjelpetekst | 13 px | 14 px |
| `text-xs` (mest brukt til metadata, pills, hjelpetekst) | 13 px | 14 px |
| `text-sm` (brødtekst i kort, tabeller, skjema) | 14 px | 15 px |
| `text-base` (standard brødtekst) | 16 px | 16,5 px |

I tillegg:
- Linjeavstand økes i takt med skriftstørrelsen (ca. 1,45–1,5) slik at tekstblokker ikke blir tettere når bokstavene vokser.
- Standard brødtekst får litt løsere linjeavstand for bedre lesbarhet i lengre avsnitt.
- Knapper, input-felt og badge-komponentene i designsystemet får minimumshøyder som følger den nye teksten, så ingenting blir avklippet.

## Kontrast

Sammen med større tekst sjekkes at dempet tekst (`text-muted-foreground`) fortsatt oppfyller WCAG AA mot både lys og mørk bakgrunn. Fargen ble strammet inn tidligere; den beholdes, men eventuelle steder som bruker gjennomsiktighet (f.eks. `/50`, `/60`) på tekst rettes opp der de finnes.

## Teknisk

- `src/index.css`, `@layer base`: oppdater klampene for `.text-xs`, `.text-sm`, arbitrære `text-[10px]`/`[11px]`/`[12px]`-varianter, samt `body`-linjehøyde.
- Legg til klamp for `.text-base` og `.text-\[13px\]`-varianter som i dag går under den nye grensen.
- `src/components/ui/button.tsx`, `input.tsx`, `badge.tsx`: juster kun høyde/padding der den nye teksten ikke får plass — ingen logikkendringer.
- Verifiser med et Playwright-skript at ingen synlig tekst rendrer under 13 px, og ta skjermbilder av partner-dashboard og kundekort for å bekrefte at layouten holder.
