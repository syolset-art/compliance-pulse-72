## Mål

Strammere gap-dialog som matcher bildet — ingen søk, korte lister med "Vis flere", og en tydelig vei videre til tilbud der gap-analysen automatisk legges ved.

## Endringer

### 1. `MSPGapAnalysisDialog.tsx`
- **Fjern søkefeltet** (Input + Search-ikon + relatert state).
- **Bytt stat-kortene** fra 3 til 4: `Totalt`, `Kritiske` (rød), `Vesentlige` (oransje), `Mindre` (nøytral) — basert på severity-tall.
- **Bytt overskriftstekst** under tittel: "Basert på kundens vurderinger. Kan legges ved tilbud som dokumentasjon." (én linje).
- **Per regelverk-blokk** (collapsible):
  - Header: ikon + navn + meta `X gap · Y kritiske` + chevron som åpner/lukker.
  - Vis kun **5 gap initielt**, deretter en sentrert lenke `Vis N til ↓` / `Vis færre ↑` som toggler resten.
  - I single-mode (åpnet fra én anbefaling) er blokken alltid åpen.
- **Gap-rad-format** beholder dagens en-linjes stil (farget prikk + tittel + meta), men metaen vises som `Artikkel/Krav · Severity` — legg til et valgfritt `reference` (f.eks. "Artikkel 23") på `GapItem` og fyll inn for demo-dataene.
- **Footer-knapper** (matcher bilde 2):
  - Venstre: `Lukk`
  - Høyre: `Last ned PDF` (outline) + `Opprett tilbud →` (primær).
- **"Opprett tilbud →"-flyten:** lukker gap-dialogen og åpner `MSPCreateOfferDialog` med `attachGap = true` (gap-analysen forhåndsvedlagt). Dialogen kaller en ny prop `onCreateOffer?(frameworkId)` som forelder kobler til.

### 2. `MSPMaturityServiceMatrix.tsx`
- Når `MSPGapAnalysisDialog` lukkes via "Opprett tilbud", åpne `MSPCreateOfferDialog` med:
  - `serviceTitle` = navnet på regelverket/anbefalingen (f.eks. "NIS2-klargjøring")
  - `variant` = "Full leveranse" som default
  - `attachGap` = true
- Behold kobling fra hver anbefalings `Vis gap`-knapp (uendret).

### 3. `MSPCreateOfferDialog.tsx`
- Sørg for at `attachGap`-prop pre-velger gap-analyse-vedlegget (toggle allerede på som default i dag — bekrefte at den honorerer prop). Ingen UI-endring utover dette.

## Visuell mal (ASCII)

```text
┌──────────────────────────────────────────────────────────┐
│ Dintero AS · Gap-analyse                              ✕  │
│ Manglende kontroller per regelverk                       │
│ Basert på kundens vurderinger. Kan legges ved tilbud.    │
├──────────────────────────────────────────────────────────┤
│ [Totalt 23] [Kritiske 8] [Vesentlige 11] [Mindre 4]      │
├──────────────────────────────────────────────────────────┤
│ 🏛  NIS2                                              ⌄  │
│     9 gap · 4 kritiske                                   │
│     • Mangler hendelsesrapporteringsrutine               │
│       Artikkel 23 · Kritisk                              │
│     • Ingen formell risikoanalyse                        │
│       Artikkel 21(2)(a) · Kritisk                        │
│     ...                                                  │
│            Vis 4 til ↓                                   │
├──────────────────────────────────────────────────────────┤
│ 🛡  GDPR        6 gap · 2 kritiske                    ›  │
│ 🔒  ISO 27001   5 gap · 1 kritisk                     ›  │
├──────────────────────────────────────────────────────────┤
│ [Lukk]                  [⤓ Last ned PDF]  [Opprett tilbud →] │
└──────────────────────────────────────────────────────────┘
```

## Filer som endres
- `src/components/msp/MSPGapAnalysisDialog.tsx`
- `src/components/msp/MSPMaturityServiceMatrix.tsx`
- (evt. liten tilpasning i `src/components/msp/MSPCreateOfferDialog.tsx` hvis `attachGap`-prop ikke allerede styrer default)
