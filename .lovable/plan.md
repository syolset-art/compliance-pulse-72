# Total oversikt over arbeidsflyter i Mynder

Målet er ett dokument du kan laste ned og lime rett inn i Notion, som beskriver alle arbeidsflyter i plattformen — hva som alltid er tilgjengelig, og hva som følger av hvert produkt.

## Hva som lages

Én Markdown-fil (Notion-vennlig: overskrifter, tabeller, sjekklister, ingen emojis) levert som nedlastbar fil, og en kopi i prosjektet under `docs/plattform-arbeidsflyter.md` slik at den kan vedlikeholdes videre.

## Innhold i dokumentet

1. **Plattformkart** — tabell over alle sider/ruter, hvilket produkt de hører til, og om de er alltid tilgjengelig eller låst bak modul.
2. **Alltid tilgjengelig (uavhengig av produkt)**
   - Regelverk (inkl. beta agentisk visning), Meldinger/forespørsler, Trust Center
   - Flyt: velg regelverk i scope → krav gruppert per kontrollområde → status per krav → bevis/dokumentasjon → rapport
3. **Mynder Core — oppstartsløype**
   - Steg 1: Opprett arbeidsområder og sett ansvarlig
   - Steg 2: Inviter deltakere (én person kan dekke alle arbeidsområder), roller og lese/skrive-tilgang
   - Steg 3: Bygg kontekst i arbeidsområdet — systemer, leverandøravtaler, dokumenter (eksempel: Økonomi og regnskap → Fiken)
   - Steg 4: Autogenerert RoPA per system
   - Steg 5: Foreslåtte prosesser per arbeidsområde → vurder kritikalitet, risiko og AI-bruk per prosess
   - Avviksregister: registrering, behandling, kobling til system/leverandør
   - Oppgaver: egne oppgaver (DPIA, ROS), knyttet system/leverandør, ansvarlig, deltakere, status — og fremtidig kobling til modenhetsvurdering (foreslåtte oppgaver for å øke modenhet)
   - Behandlingsprotokoll: samlet visning av alle behandlingsaktiviteter på tvers av arbeidsområder
   - Rapport: modenhetsvurdering
4. **Leverandørmodulen**
   - Oversiktsvisning (dashbord) og listevisning
   - Leverandørprofil: lovpålagte vs. anbefalte regelverk, legg til regelverk med KI-initiell vurdering, modenhet per kontrollområde, aktivitetslogg
   - Arkfane Bruk og kontekst: kritikalitet, prioritet, databehandlerrolle, beskrivelse av prosesser som bruker leverandøren
   - Arkfane Dokumentasjon: last opp interne dokumenter, se og godkjenne eksterne dokumenter fra leverandør (f.eks. pentestrapport)
   - Arkfane Forespørsler: mottatte meldinger, lesing og oppfølging
   - Kapasitet: 5 gratis leverandører, deretter nivåendring
5. **Trust Center** — aktivering, profil, dokumenter, deling, offentlig visning
6. **Tverrgående flyter** — aktivering av produkt (Aktiver → vilkår → kvittering), avvikling, Laras arbeidskø og godkjenning, integrasjoner/MCP («koble på deg selv»), aktivitetslogg
7. **Partner (MSP)** — kort seksjon: kundeoversikt, behovsanalyse, tilbud, tjenestekatalog, fakturagrunnlag
8. **Gap-liste** — hvor dagens prototype avviker fra beskrevet målbilde (f.eks. oppgaver ↔ modenhet-kobling som ikke finnes ennå)

Hver arbeidsflyt beskrives med: formål, hvem som utfører, steg-for-steg, hvor i appen (rute), og status (implementert / delvis / planlagt).

## Teknisk

- Kilde for kartleggingen: rutene i `src/App.tsx`, menystrukturen i `src/components/Sidebar.tsx`, sider under `src/pages/`, og eksisterende domenelogikk (`src/lib/`).
- Ingen endringer i appkoden — kun dokumentasjon.
- Filen skrives som ren Markdown uten frontmatter slik at Notion-import bevarer tabeller og overskrifter.
