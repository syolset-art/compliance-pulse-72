# Forklar compliance-effekt etter dokumentopplasting

## Mål

Når brukeren lagrer et dokument, skal «Dokument lagret»-steget forklare **hvorfor** scoren endres — eller ikke endres. I dag vises bare et før/etter-tall uten begrunnelse.

## Styrende regel (Mynder Score Model v1, Notion — R1/R5)

- Kontrollen/kravet er målepunktet. Score løftes **kun** når dokumentet svarer ut et konkret krav i et regelverk som er i scope.
- Opplasting alene endrer ikke score: «Kontroll kan løftes først når dokumentet er klassifisert, koblet til riktig kontroll og har tilstrekkelig beviskvalitet.»
- Ett dokument kan dekke flere krav i flere regelverk — alle skal telle.
- Dokument som ikke svarer ut et krav (f.eks. pentest-rapport med mange hull) løfter ikke score — men skal generere **tiltak** i arbeidslisten. Dette må forklares i UI.

## Endringer

### 1. Krav-treff-analyse ved lagring (`UploadDocumentDialog.tsx`)

Ved lagring kjøres Laras dekningsanalyse (`src/lib/laraDocumentCoverage.ts`) med dokumentets navn/type mot veiledende dokumentasjon per krav (`frameworkDocumentationCatalog`) for regelverkene som er i scope (`selected_frameworks`). Resultatet: liste over krav-treff per regelverk med dekningsgrad (0 / 0,5 / 1) og hvilke artikler som dekkes.

### 2. Ny forklaringsseksjon i «Dokument lagret»-steget

Erstatter dagens rene før/etter-tall med tre mulige utfall, alltid med klartekst:

**A. Dokumentet svarer ut krav → score påvirkes**
- Vis: «Dette dokumentet svarer ut X krav i Y regelverk» med liste: regelverk → kravnavn → artikler dekket.
- Før/etter-score beholdes, men knyttes til kravene som faktisk ble dekket.

**B. Dokumentet svarer ut krav i flere regelverk**
- Samme visning som A, gruppert per regelverk — poengteres at alle treff teller.

**C. Ingen krav-treff → score påvirkes ikke**
- Tydelig forklaring i klartekst: «Dette dokumentet ble ikke koblet til noen krav i regelverkene dere har i scope. Scoren endres derfor ikke.»
- Med mulige årsaker: dokumenttypen er ikke blant forventet dokumentasjon, dokumentet er utgått, eller regelverket er ikke i scope.

### 3. Pentest/rapport med funn → tiltak, ikke score

- Utvid `classify-document`-responsen (eller legg til lokal heuristikk på dokumenttype + sammendrag) til å flagge `has_findings` når dokumentet er en rapport/pentest med identifiserte svakheter.
- Når `has_findings`: vis egen merknad: «Rapporten viser svakheter som må utbedres. Scoren påvirkes ikke — i stedet opprettes tiltak i arbeidslisten.» og opprett tiltak (avvik/oppgaver) koblet til assetet via eksisterende avviksflyt (`suggest-deviations` / avviksregister).
- Tilsvarende for utgått dokument: forklar at utgått dokumentasjon ikke løfter score.

### 4. Tekstjusteringer

- Tittel på seksjonen endres fra «Compliance-effekt på Trust Profile» til noe som beskriver krav: f.eks. «Slik påvirker dokumentet scoren din».
- All status med tekstlabel (ikke bare farge/ikon), klarspråk norsk/engelsk via eksisterende `isNb`-mønster.

## Teknisk

- `src/components/asset-profile/UploadDocumentDialog.tsx` — hovedendringen (saved-step + analyse ved lagring).
- `src/lib/laraDocumentCoverage.ts` — gjenbrukes for krav-matching; ev. liten utvidelse for å returnere kravnavn.
- `src/lib/requirementDocumentationHints.ts` — kilde for forventet dokumentasjon per krav (gjenbrukes).
- `supabase/functions/classify-document/index.ts` — utvides med `has_findings`/`findings_summary` for rapporter/pentest.
- Tiltak opprettes gjennom eksisterende avviks-/oppgaveflyt — ingen ny kø bygges.
- Ingen endring i scoremodellen selv — dette er forklaring/presentasjon, i tråd med at compliance/coverage er presentasjonsvisning (jf. revisjon 04.08.2026).
