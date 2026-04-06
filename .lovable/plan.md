

## Plan: Security Foundations modenhetsoversikt på dashbordet

### Hva
Erstatt «Krever oppmerksomhet» og «Dine oppgaver»-widgetene med en ny **Security Foundations**-widget som viser organisasjonens modenhet fordelt på de fire pilarene (Styring, Drift, Identitet og tilgang, Leverandør og økosystem). Designet matcher skjermbildet: en overordnet fremdriftslinje med teller for dokumenterte kontroller, og et 2x2-rutenett med hvert område som eget kort med prosent, fremdriftslinje og modenhetsnivå (Lav/Middels/Høy).

### Datakilde
Gjenbruk `useComplianceRequirements` — dette gir allerede `stats.byDomainArea` med score per pilar (governance, operations, identity_access, supplier_ecosystem) og `stats.overallScore` for totalbildet. Ingen nye database-tabeller trengs.

### Endringer

**Ny fil: `src/components/widgets/SecurityFoundationsWidget.tsx`**
- Henter data fra `useComplianceRequirements`
- Viser overordnet kort med:
  - Tittel «Security Foundations» + Demodata-badge
  - Samlet fremdriftslinje (lilla)
  - Teller: «X/Y kontroller dokumentert» (fra `stats.overallScore.assessed` / `total`)
- 2x2-rutenett med fire pilar-kort, hvert med:
  - Ikon (Shield for Styring, Settings/Cog for Drift, Key for Identitet, Users for Leverandør)
  - Pilar-navn (norsk/engelsk)
  - Prosent fra `stats.byDomainArea[key].score`
  - Fargekodert fremdriftslinje (lilla)
  - Modenhetsnivå-label: Lav (0-33%, rød/oransje), Middels (34-66%, oransje), Høy (67-100%, grønn)
  - Ekspanderbar «X målepunkter» med chevron (viser antall krav i pilar)

**Redigert fil: `src/pages/Index.tsx`**
- Fjern `immediate-attention` og `user-actions` fra `WIDGET_DEFS` og `WIDGET_COMPONENTS`
- Legg til `security-foundations` som ny widget med size `"full"` (tar hele bredden)
- Plasser den øverst i `DEFAULT_ORDER`

### Visuell stil
- Lilla fremdriftslinjer (matcher eksisterende merkevare)
- Modenhetsnivå som fargede tekstlabels: Lav=oransje/rød, Middels=oransje, Høy=grønn
- Hvite/card bakgrunn med subtil border for hvert pilar-kort
- Konsistent med skjermbildet brukeren viste

### Filer

| Fil | Endring |
|-----|---------|
| `src/components/widgets/SecurityFoundationsWidget.tsx` | Ny — hele widgeten |
| `src/pages/Index.tsx` | Erstatt immediate-attention + user-actions med security-foundations |

