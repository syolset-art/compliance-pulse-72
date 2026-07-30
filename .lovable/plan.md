## Mål

Tilbudet skal vises som et ryddig dokument med tydelig struktur — **side 1**, **side 2** og **vedlegg** — der side 2 lister opp hvordan hver oppgave (tjeneste) dekker de konkrete gapene fra gap-analysen.

## Dokumentstruktur

```text
SIDE 1  — Tilbudet
  Partner-header, tilbudsnr., dato
  Tittel + mottaker + innledning
  Aktiviteter (oppgave / timer / beløp)
  Sum, timepris, mva

SIDE 2  — Dekning mot gap-analysen
  Oppsummering: "Tilbudet lukker X av Y mangler (Z kritiske)"
  Tabell: Oppgave → mangler som lukkes (tittel + artikkel + alvorlighet)
  Rad nederst: "Ikke dekket i dette tilbudet" (gjenstående gap)
  Crosswalk-linje: også relevant for andre regelverk

VEDLEGG — Gap-analyse <regelverk>, øyeblikksbilde <dato>
  Komplett mangelliste med status dekket / ikke dekket
```

## Endringer

**1. Koble oppgaver til gap (`MSPCreateOfferDialog.tsx`)**
- Utvid `EditableTask` med `gapIds: string[]`.
- Ved åpning fordeler Lara de forhåndsvalgte gapene på oppgavene automatisk (match på domene/kontroll-referanse i gap mot oppgavetekst; resten legges på første leveranse-oppgave).
- I redigeringsvisningen får hver oppgaverad en liten linje under tittelen: antall koblede mangler + en «Koble mangler»-popover med avkryssing. Ingen ny stor blokk — kompakt, `text-xs`.
- Et gap kan kobles til flere oppgaver; valgt-status i gap-listen utledes av om gapet er koblet til minst én oppgave, slik at eksisterende «dekker X av Y»-telling består.

**2. Rydd redigeringsvisningen**
- Dagens gap-kort beholdes, men de to bryterne forenkles til én linje med to valg: «Ta med dekningsside (side 2)» og «Legg ved gap-analysen (vedlegg)».
- Den store manuelle avkryssingslisten kollapses som i dag (chevron), og teksten kortes ned.

**3. Ny forhåndsvisning med sideskiller**
- Del preview i tre «ark» med tydelig sideskille og liten sidefot «Side 1 av N».
- Side 2 rendres kun når dekningssiden er på og minst ett gap er koblet; vedlegget kun når vedlegg-bryteren er på.
- Side 2-tabellen: kolonner «Oppgave», «Lukker disse manglene», «Alv.» — mangler som chips/liste per oppgave med artikkelreferanse i mono-tekst.

**4. Samme struktur i PDF-en**
- Bygg om `jsPDF`-genereringen til å følge samme tre-deling: `doc.addPage()` før dekningssiden og før vedlegget, med sidetall i bunnteksten på hver side.
- Dekningssiden i PDF skriver oppgave som overskrift og gapene som punkt under, med gjenstående mangler i egen bolk til slutt.

## Teknisk

- Alt skjer i `src/components/msp/MSPCreateOfferDialog.tsx`; sideoppsettet i preview trekkes ut som en liten lokal `OfferPage`-wrapper i samme fil for å unngå duplisert markup.
- Ingen databaseendringer. `gapIds` lagres kun i dialogens lokale state (prototype); `saveOffer` beholdes uendret.
- Gap-data hentes fortsatt fra `src/lib/gapData.ts`, crosswalk fra `src/lib/controlCrosswalk.ts`.
- Tekststørrelser holdes på minst `text-xs` (12 px) av hensyn til UU, statusfarger via eksisterende tokens (`success`/`warning`/`destructive`).
