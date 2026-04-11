

## Plan: Endre terminologi fra «Regelverk» til «Krav og standarder»

### Endringer

**1. Sidebar (`src/components/Sidebar.tsx`, linje 147)**
- Endre menynavnet fra `"Regelverk"` til `"Krav og standarder"`

**2. Regulations-siden (`src/pages/Regulations.tsx`)**
- Sideoverskrift: `"Regelverk og etterlevelse"` → `"Krav og standarder"`
- Undertekst: Oppdater til å matche ny terminologi
- ContextualHelpPanel: Oppdater tittel og beskrivelse

**3. Diverse labels i regulations-komponenter**
- `FrameworkChipSelector.tsx`: `"aktive regelverk"` → `"aktive krav"`
- `FrameworkRequirementsList.tsx`: `"dette regelverket"` → `"dette kravet"`
- `DomainSummaryCard.tsx`: `"regelverk tilgjengelig"` → `"krav tilgjengelig"`
- Toast-meldinger i Regulations.tsx som sier «regelverk» → «krav/standard»

Ikonet (Scale) og ruting (/regulations) forblir uendret for å unngå breaking changes.

