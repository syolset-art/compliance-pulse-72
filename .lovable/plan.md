# Dokumentasjon og bevis — redesign til et kartlagt dokumentbilde

Siden skal svare på tre spørsmål på ti sekunder: hva har vi, hva er kartlagt mot regelverk vi har aktivert, og hva mangler.

## Ny sidestruktur

```text
[ Header: Dokumentasjon og bevis            Last opp | Installer Sara ]

[ Zone 1 — Dekningsbilde ]
  X av Y påkrevde dokumenter på plass · Z mangler · N må fornyes
  Kilder: Opplastet (n) · Din agent / Sara (n) · Ekstern lenke (n)
  Filter: Alle regelverk  [GDPR] [NIS2] [ISO 27001] ...  (flervalg)

[ Zone 2 — Gap ]  (fanene: Mangler | Må fornyes | Dekket)
  Krav → hvilket dokument dekker det (eller «mangler» + Last opp / Be Sara hente)

[ Zone 3 — Dokumentbibliotek ]
  Alle dokumenter i plattformen (Trust Center, leverandør, regelverk,
  arbeidsområde), med kildeikon (fil = delt dokument, S = Sara),
  modul, status og «kartlagt mot N krav» / «ikke kartlagt».
```

## Hva som bygges

1. **Samlet dokumentgrunnlag.** Siden henter dokumenter fra hele plattformen (samme normaliserte hub-modell som Dokument hub bruker) i stedet for bare Trust Center-dokumenter, slik at «samlet i hele plattformen» faktisk stemmer.
2. **Kartlegging mot krav.** Eksisterende dekningsberegning kjøres mot dette utvidede settet. Hvert dokument får «kartlagt mot N krav» med en liten liste over hvilke krav/regelverk ved klikk.
3. **Regelverksfilter (flervalg).** Ett filter øverst styrer både gap-listen og biblioteket: alle aktiverte regelverk, eller ett/flere valgte.
4. **Gap-seksjon med tre faner** (Mangler / Må fornyes / Dekket). Hver rad viser krav, regelverk, og handling: Last opp dokumentasjon, eller — hvis Sara er installert — Be Sara hente.
5. **Kildeskille.** Kildeikon per dokument: dokumentikon for delt/opplastet dokument, rundt S-ikon for Sara/lokal agent. Filter på kilde i biblioteket.
6. **Ikke-kartlagte dokumenter** samles i en egen, rolig gruppe nederst med forslag om hvilket krav de trolig hører til.

## Teknisk

- Ny komponent `src/components/trust-center/EvidenceCoverageHeader.tsx` (Zone 1) og `EvidenceGapPanel.tsx` (Zone 2); `FrameworkDocumentCoverage.tsx` beholdes som grunnlag og forenkles til gap-panelet.
- Gjenbruk `src/lib/documentHub.ts` for platform-samlingen og `src/lib/complianceDocumentCoverage.ts` for krav-matching; ny tynn adapter `src/lib/evidenceIntelligence.ts` som slår sammen hub-dokumenter + dekning til radene siden trenger.
- `src/pages/TrustCenterEvidence.tsx` refaktoreres til de tre sonene; eksisterende dialoger (opplasting, verifisering, tilgang) beholdes uendret.
- Ingen databaseendringer. Alle nye tekster i `nb.json` og `en.json`.
