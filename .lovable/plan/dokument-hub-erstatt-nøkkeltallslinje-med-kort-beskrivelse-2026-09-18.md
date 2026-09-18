# Dokument hub — erstatt nøkkeltallslinje med kort beskrivelse

## Hva brukeren får

Tallinjen under tittelen («1 dokumenter · 0 styrende · 0 dekker aktiverte krav · 0 krever oppfølging») fjernes og erstattes av én kort setning som forklarer hva Dokument hub gjør:

- Norsk: «Alle dokumenter dere har lastet opp i Mynder – samlet på ett sted, med status og kobling til deres aktiverte regelverk.»
- Engelsk: «All documents you have uploaded in Mynder – collected in one place, with status and links to your activated frameworks.»

Antallet ved tittelen («1 dokumenter») beholdes slik det er i dag.

## Teknisk

- `src/pages/DocumentHub.tsx` (linje 217–222): statisk tekst byttes ut med beskrivelsen over via eksisterende `L()`-hjelper. Ingen andre endringer; `stats`-beregningen forblir der den brukes ellers i siden.
