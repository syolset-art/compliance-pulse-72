

# Forbedring av sjekklisten i AI-bruk veiviseren

## Endringer

### 1. Fjern "AI Act" fra tittelen
Endre overskriften fra "AI Act sjekkliste" til bare "Sjekkliste" med en mer relevant undertekst.

### 2. Omformuler sporsmalene til pastandsform
Sjekklistepunktene er i dag formulert som sporsmål ("Brukes AI-generert innhold i opplaeringen?"). Disse endres til pastandsform som brukeren bekrefter ("AI-generert innhold brukes i opplaeringen"). Dette gjor det mer naturlig a huke av.

Endringen gjores i `src/lib/processAISuggestions.ts` der alle `suggestedChecks` er definert.

### 3. Mulighet for a legge til systemreferanse per sjekkpunkt
Nar brukeren huker av et punkt, vises en kompakt linje under der brukeren kan velge hvilket/hvilke system(er) som er relevante. Systemene hentes fra prosessens tilknyttede systemer (via `systemId` og evt. flere). Denne informasjonen er relevant fordi en prosess kan bruke flere systemer, og det er viktig a dokumentere hvilke systemer som faktisk bruker AI pa dette punktet.

Feltet vises kun nar sjekkpunktet er avhuket -- ingen ekstra informasjon nar det ikke er relevant.

## Teknisk plan

### Fil: `src/lib/processAISuggestions.ts`
- Endre alle `suggestedChecks`-strenger fra sporsmalsform til pastandsform:
  - "Brukes AI-generert innhold i opplaering?" -> "AI-generert innhold brukes i opplaeringen"
  - "Er det automatiserte systemer som tildeler oppgaver?" -> "Automatiserte systemer tildeler oppgaver"
  - Tilsvarende for alle andre prosesstyper og generiske sjekker

### Fil: `src/components/process/ProcessAIDialog.tsx`
- **Tittelendring** (linje 651): Endre "AI Act sjekkliste" til "Sjekkliste"
- **ChecklistItem-interface** (linje 67-71): Utvid med `systems?: string[]` for a lagre tilknyttede systemer per punkt
- **Systemhenting**: Legg til en query som henter systemer tilknyttet prosessen (via `systemId` og eventuelt flere via work area)
- **UI per sjekkpunkt** (linje 655-670): Nar et punkt er avhuket, vis en kompakt rad med system-badges som kan velges/fravelges. Kun synlig nar `item.checked === true`
- **Lagring** (linje 234): Sikre at `compliance_checklist` inkluderer system-referansene i dataene som lagres
