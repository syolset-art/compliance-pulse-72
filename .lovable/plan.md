

## Plan: Gjør Organisasjon-sidene mobilvennlige

### Problem
Sideoverskriftene på Avvik, Oppgaver, Rapporter og Krav bruker en horisontal `flex`-layout som ikke bryter til ny linje på smale skjermer. Overskrift og knapper kolliderer og overlapper.

### Løsning
Endre header-layouten på alle berørte sider til å **wrappe vertikalt på mobil** (tittel over, knapper under).

### Endringer

**1. Deviations.tsx (linje 366)**
- `flex items-center justify-between` → `flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between`
- Flytt underteksten (`<p>`) fra inne i tittelraden til under `<h1>` med `flex-col`

**2. Tasks.tsx (linje 192)**
- `flex items-center justify-between` → `flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between`
- Tittel + badge wrapper over, knappen under på mobil

**3. Reports.tsx (linje 281)**
- `flex items-center justify-between` → `flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between`
- Knappen "Generer ny rapport" får `w-full sm:w-auto` for full bredde på mobil

**4. Regulations.tsx (header-seksjon)**
- Samme mønster: stack vertikalt på mobil

**5. AdminOrganisation.tsx**
- Sjekk og fiks eventuelle overlappende metrics-kort med `grid-cols-1 sm:grid-cols-2`

Ingen endring i funksjonalitet - kun CSS-klasser for responsiv layout.

