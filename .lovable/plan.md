# Plan: Roligere dokumentside med progressiv synliggjøring

## Problem

Siden `/trust-center/evidence` viser alt på én gang: intro-tekst, 3 synlighets-chips, faner, "Påkrevde artefakter"-sjekkliste, søk + 2 filtre, og deretter fire seksjoner (Avtaler, Retningslinjer, Sertifiseringer, Andre dokumenter) som alle står åpne. Med 5–10 dokumenter blir det travelt; med 50+ blir det uoversiktlig.

Målet er å la brukeren se mindre om gangen og selv velge hva som skal foldes ut, uten å fjerne funksjonalitet.

## Endringer

### 1. Komprimert sidehode

- Flytt den lange intro-paragrafen inn i en liten "i"-tooltip ved siden av tittelen. Tittel og knapper blir igjen.
- Beholder synlighets-chips (Offentlig · Delt · Internt) — de er allerede tette og fungerer som status + filter.

### 2. Skjul "Påkrevde artefakter" bak en sammenleggbar header

- `RequiredArtifactsBlock` er ofte den største blokken. Pakk den i en `<Collapsible>` med en kompakt header som viser "Påkrevde artefakter · X av Y fullført" og en chevron.
- Standard: **åpen hvis det finnes mangler, ellers lukket**. State persisteres i `localStorage` (`trust.evidence.required.open`).

### 3. Filter-rad som "skjult som standard"

- Søkefeltet beholdes alltid synlig (det er den raskeste måten å finne et dokument på).
- De to `Select`-filtrene (kategori + synlighet) flyttes bak en "Filter"-knapp som åpner en liten popover. Knappen viser en prikk når et filter er aktivt.
- Når et filter er satt via synlighets-chipsene øverst, oppdateres popoveren tilsvarende.

### 4. Sammenleggbare dokument-seksjoner

- Hver av de fire seksjonene (Avtaler, Retningslinjer, Sertifiseringer, Andre) blir en `<Collapsible>`.
- Seksjonsoverskriften viser ikon + navn + antall-badge + chevron, hele raden er klikkbar.
- Standard åpningslogikk:
  - Hvis totalt antall dokumenter ≤ 8: alle åpne (dagens oppførsel).
  - Hvis > 8: kun seksjonen "Avtaler" og seksjoner med færre enn 3 dokumenter åpne; resten lukket.
  - Hvis et søk eller filter er aktivt: alle seksjoner med treff åpnes automatisk.
- Brukerens egen åpne/lukk-tilstand persisteres pr. seksjon i `localStorage`.

### 5. "Tilganger"-fanen — kun mindre justering

- I dag listes alle mottakere som kort med inntil 5 dokument-badges + "+N". Det er ok, men når listen blir lang foreslår vi å vise toppe 5 mottakere og legge resten bak "Vis alle (N)"-knapp. (Lav prioritet — kan tas senere hvis du heller vil holde dette utenfor.)

## Det vi IKKE endrer

- Ingen endring i datamodell, mutations eller `DocumentComplianceCard`.
- Ingen endring i sortering eller hvilke dokumenter som hører til hvilken seksjon.
- Synlighets-chipsene, fanene Dokumenter/Tilganger og rad-utseendet er uendret.
- Ingen endring på edit-/access-dialogene.

## Tekniske detaljer

- Bruker eksisterende `@/components/ui/collapsible` (Radix) og `@/components/ui/popover`.
- All tilstand er lokal komponent-state + `localStorage` — ingen DB-skjema-endringer.
- Endringer er begrenset til `src/pages/TrustCenterEvidence.tsx` (pluss evt. en liten lokal hjelpekomponent `CollapsibleSection` i samme fil).

## Åpne valg

1. **Standard åpne seksjoner ved mange dokumenter** — forslaget over åpner "Avtaler" + små seksjoner. Alternativ: alt lukket som standard slik at brukeren selv folder ut. Hva foretrekker du?
2. **Filter-popover vs. inline** — vil du heller beholde de to dropdownene synlige, men flytte dem til en mer kompakt rad (uten breddebegrensning)? Det er enklere, men gir mindre stillhet.
