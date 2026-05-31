# Gap-drevne kontrollpunkter i tilbud

## Problemet i dag

Når partner klikker **Lag tilbud** på en anbefalt tjeneste, vises «Dekker kontrollpunkter» som en statisk liste fra tjenestekatalogen (`serviceCatalog.ts` → `frameworkMappings.controlIds`, f.eks. `NIS2 Art.21, Art.23, Art.20`). Den listen er løsrevet fra `MSPGapAnalysisDialog`, som har den faktiske kunde-spesifikke status: 9 åpne gap i NIS2 med tittel, domene, paragraf og kritikalitet.

Resultat: kunden ser et tilbud som sier «dekker Art.20, Art.21, Art.23», men det fremgår ikke at det faktisk **lukker disse 5 konkrete manglene** Lara fant i gap-analysen.

## Mål

1. Tilbudets kontrollpunkter skal speile alle eller deler av manglene fra gap-analysen for det aktuelle regelverket.
2. Partner skal kunne se og justere hvilke gap leveransen lukker — uten å forlate tilbudsdialogen.
3. Gap-analysen vedlegges som et fryst øyeblikksbilde med dato (status da tilbudet ble laget), slik at kunden ser hva tilbudet bygger på selv om bildet endrer seg senere.

## Designgrep i tilbudsdialogen

Erstatt blokken «Dekker kontrollpunkter» med en gap-drevet blokk:

```text
┌─ Lukker mangler fra gap-analysen ────────── 5 av 9 ▒▒▒▒▒░░░░ ─┐
│ NIS2 · status per 31. mai 2026                                │
│                                                               │
│ ☑ ● Art.21(2)(a)  Ingen formell risikoanalyse av nett… [krit] │
│ ☑ ● Art.20        Ledelsen ikke involvert i cyber…     [krit] │
│ ☑ ● Art.23        Mangler hendelsesrapporteringsrutine [krit] │
│ ☑ ◐ Art.21(2)(d)  Leverandørstyring ikke dokumentert   [vest] │
│ ☑ ◐ Art.21(2)(j)  Tilgangskontroll uten MFA-policy     [vest] │
│ ☐ ◐ Art.21(2)(c)  Kontinuitetsplan og backup…          [vest] │
│ ☐ ◐ Art.21(2)(e)  Sårbarhetshåndtering…                [vest] │
│ ☐ ○ Art.21(2)(h)  Kryptering ikke systematisk          [mind] │
│ ☐ ○ Art.21(2)(g)  Awareness-trening                    [mind] │
│                                                               │
│ Også relevant: GDPR Art.32, ISO A.5.24  (cross-walk)         │
│ Se hele gap-analysen →                                        │
└───────────────────────────────────────────────────────────────┘
```

Detaljer:
- **Severity-prikk** (rød/oransje/grå) gjenbruker `severityDot` fra gap-dialogen.
- **Checkbox per rad** lar partner deselecte gap som leveransen ikke faktisk lukker. Standard: alle gap koblet til tjenestens `controlIds` er forhåndsavkrysset; resten kan hukes på manuelt.
- **Progress-bar i header** («5 av 9») gjør koblingen visuell.
- **«Status per 31. mai 2026»** signaliserer at dette er et øyeblikksbilde.
- **Cross-walk-chipsene** fra forrige iterasjon flyttes til en samlerad under listen — slik at hvert gap-rad slipper å være overfylt.
- **«Se hele gap-analysen →»** åpner `MSPGapAnalysisDialog` i lese-modus.

I forhåndsvisningen (paper-look) vises samme liste som ren oppsummering uten checkboxes, med samme «Status per [dato]»-stempel.

## Vedlegget «Gap-analyse»

Eksisterende attachment-blokk får mer innhold:
- Tittel: `Gap-analyse NIS2 · øyeblikksbilde 31. mai 2026`
- Stat-rad: `9 gap · 3 kritiske · 4 vesentlige · 2 mindre`
- Liste over alle gap (ikke bare de som er huket av), med markering av hvilke som lukkes av tilbudet (✓)
- Genereres i PDF-en som et eget kapittel etter pristabellen

## Datamodell og dataflyt

1. **Felles gap-kilde**: Flytt `DEMO_GAPS` ut av `MSPGapAnalysisDialog.tsx` til `src/lib/gapData.ts`. Eksporter `getGapsByFramework(frameworkId)` og `getGapsForControls(frameworkId, controlIds[])` (finner gap som matcher en kontrollreferanse).

2. **Ny offer-prop**: Erstatt `coveredControls: CoveredControlGroup[]` med
   ```ts
   coveredGaps?: {
     frameworkId: string;
     frameworkLabel: string;
     snapshotDate: string;       // ISO
     totalGaps: number;
     gaps: GapItem[];            // alle gap for regelverket
     preselectedGapIds: string[]; // gap som tjenesten lukker (fra catalog mapping)
   };
   ```
   Beholder bakoverkompatibilitet ved å la `MSPCreateOfferDialog` rendre den gamle visningen hvis kun `coveredControls` er gitt.

3. **Call-sites**:
   - `MSPMaturityServiceMatrix.tsx` (linje 775): bygg `coveredGaps` via `getGapsForControls(r.frameworkId, r.controlIds)`; preselect = gap-id-ene som returneres.
   - `QuestionnaireDispatchCard.tsx` (linje 275): samme.

4. **State i dialogen**: `selectedGapIds: Set<string>` initialiseres fra `preselectedGapIds`. Brukerens utvalg lagres på tilbudet (vises i preview + PDF).

## Filer som endres

- **Ny**: `src/lib/gapData.ts` — `DEMO_GAPS`, `GapItem`, `FrameworkGap`, helpers.
- **Endres**: `src/components/msp/MSPGapAnalysisDialog.tsx` — importer fra gapData.
- **Endres**: `src/components/msp/MSPCreateOfferDialog.tsx`
  - Ny prop `coveredGaps`, state `selectedGapIds`.
  - Erstatt nåværende «Dekker kontrollpunkter»-blokk med ny «Lukker mangler»-blokk (edit + preview).
  - PDF-eksport: ny seksjon for gap-vedlegg når `attachGap`.
  - Behold cross-walk-chipsene, men flytt til samlerad.
- **Endres**: `src/components/msp/MSPMaturityServiceMatrix.tsx` — bygg `coveredGaps` i stedet for `coveredControls`.
- **Endres**: `src/components/msp/QuestionnaireDispatchCard.tsx` — samme call-site-justering.

## Utenfor scope

- Ingen migrasjoner — alt drives av frontend-demo-data inntil videre.
- Ingen endringer i selve gap-analyseflyten (Lara-prosessanimasjon, framework-collapser).
- Ingen endring av kritikalitet/risiko-logikk.
