## Mål
Fjerne fargestøyen fra nivå-pillene (Operasjonelt/Taktisk/Strategisk) på Veiledning fra Mynder-tab-en. Behold informasjonen, men gjør den mer minimalistisk og intuitiv.

## Endringer

### 1. `MynderGuidanceTab.tsx` — fjern legenden øverst
Slett blokken som viser de tre `LevelChip`-eksemplene + forklaringsteksten "Lara prioriterer aktiviteter…" rett over kortlisten. Behold kun seksjonsoverskriften.

### 2. `LevelChip.tsx` — gjør pillene nøytrale
- Fjern de fargede bakgrunnene (`bg-status-closed/10`, `bg-warning/10`, `bg-primary/10`) og border-fargene.
- Bruk én felles nøytral stil: `bg-muted/50 text-muted-foreground border-border` (samme som tema-pillen ved siden av).
- Behold ikonet (Wrench/Target/Compass) som visuell differensiator — det er nok signal uten farge.
- Behold tooltip med forklaring (uendret).

### 3. `OngoingActivitiesSection` (nederst i `MynderGuidanceTab.tsx`) — forenkle filterpiller
Filterknappene (Alle/Operasjonelt/Taktisk/Strategisk) beholdes, men aktiv-tilstanden bytter fra `bg-primary/10 text-primary` til en subtilere `bg-foreground/5 text-foreground border-foreground/20` slik at de ikke konkurrerer visuelt med Lara-fargen som brukes for handlingsknapper.

## Resultat
- Færre farger på siden — kun statusbadges og Lara-knapper bruker primærfarge.
- Nivå-informasjonen er fortsatt tilgjengelig via ikon + tooltip på hvert kort.
- Filteret nederst fungerer som før, men visuelt rolig.

## Filer som endres
- `src/components/asset-profile/MynderGuidanceTab.tsx`
- `src/components/asset-profile/LevelChip.tsx`
