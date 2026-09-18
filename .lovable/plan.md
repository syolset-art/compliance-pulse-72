# Dokumenttabell som skalerer på mobil, brett og PC

Tabellvisningen beholdes som hovedvisning på alle skjermer. I dag faller flere kolonner bort på små skjermer, og på mobil blir «Dokument» smal mens raden mister viktig informasjon.

## Slik blir det

**Mobil (under 640 px)**
- Tabellen beholdes, men med tre kolonner: Dokument, Status, Dato.
- Under dokumentnavnet vises kompakt sekundærlinje: klasse og analysestatus som små merker, slik at ingen viktig info forsvinner.
- Ingen horisontal sideskroll; teksten kuttes pent med «…».

**Brett (640–1024 px)**
- Kolonner: Dokument, Klasse, Analyse, Status, Dato.
- Sekundærlinjen under dokumentnavnet vises ikke lenger (informasjonen står i egne kolonner).

**PC (over 1024 px)**
- Alle kolonner som i dag: Dokument, Klasse, Analyse, Type, Modul, Status, Registrert av, Dato.
- Dokumentkolonnen får all ledig bredde, øvrige kolonner faste bredder.

Rader forblir klikkbare og åpner samme detaljpanel som nå.

## Teknisk

Kun `src/pages/DocumentHub.tsx`, tabellseksjonen (ca. linje 393–540):

- Bytt `md:`-brytpunkter til `sm:` for Klasse og Analyse, slik at brett viser dem.
- Fjern `overflow-x-auto` med fast `min-w`, og bruk `w-full table-fixed` med prosentbredder på store skjermer og auto på mobil.
- Legg til en `sm:hidden` sekundærlinje i dokumentcellen med klasse- og analysemerke (gjenbruker eksisterende `DOC_CLASS_LABELS` og `scoreDocIds`-logikk).
- Behold `truncate`/`whitespace-nowrap`, men la dokumentnavnet bruke ledig plass i stedet for faste maksbredder.
- Ingen endringer i data, filtre, faner eller detaljpanel.

Verifisering: typesjekk, samt visuell kontroll i Playwright ved 390 px, 768 px og 1280 px.
