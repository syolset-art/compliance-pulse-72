

## Plan: Historisk utvikling per regelverk — Dashboard-widget

### Oversikt
Erstatter den nåværende historikk-visningen (som viser trender per kontrollområde) med en ny visning som viser **samsvarsscore per regelverk** med historisk utvikling. Inspirert av «Samsvarsvarsanalyse & Gap-analyse»-layouten fra skjermbildet, men tilpasset som en kompakt dashbord-widget.

### Hva bygges

**Oppdatert `AggregatedMaturityWidget.tsx`** — historikk-toggle erstattes med en ny visning:

**1. Regelverks-kort i grid (erstatter pillar-historikk-grafen)**

Når brukeren klikker «Historikk», vises i stedet:

```text
┌─────────────────────────────────────────────────────────┐
│ Samsvarsvarsanalyse & Gap-analyse   14.4.2026           │
│ [8 REGELVERK]                            [Se mer →]     │
├─────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────┐│
│ │ ◎ 42%      │ │ ◎ 75%      │ │ ◎ 61%      │ │ ◎ 53%  ││
│ │ AI Act     │ │ Åpenhet    │ │ GDPR       │ │ ISO    ││
│ │ MIDDELS    │ │ MIDDELS    │ │ MIDDELS    │ │ 42001  ││
│ │ ✓ 6/15    │ │ ✓ 6/8     │ │ ✓ 9/16    │ │ ✓ 5/12 ││
│ └────────────┘ └────────────┘ └────────────┘ └────────┘│
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────┐│
│ │ ◎ 42%      │ │ ◎ 40%      │ │ ◎ 48%      │ │ ◎ 65%  ││
│ │ ISO27001   │ │ NIS2       │ │ NSMs gru.. │ │ Person ││
│ └────────────┘ └────────────┘ └────────────┘ └────────┘│
├─────────────────────────────────────────────────────────┤
│ Historisk utvikling                                      │
│ ┌───────────────────────────────────────────────────────┐│
│ │ [Linjegraf med aggregert trend + event-prikker]       ││
│ └───────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**2. Hvert regelverkskort inneholder:**
- Sirkulær prosent-gauge (donut) med fargekoding (gul for middels, grønn for god, rød for lav)
- Regelverksnavn (fra `frameworkDefinitions.ts`)
- Deknings-badge (LAV/MIDDELS/GOD)
- Assessed/total-telling med checkmark

**3. Historisk utvikling under kortene:**
- En enkel linjegraf som viser aggregert samsvarsscore over tid
- Event-prikker (grønn=tiltak, rød=hendelse, oransje=revisjon) — som i bilde 2
- Generert med mock-data basert på nåværende score (samme mønster som eksisterende `generateHistoryData`)

### Endringer

**`src/components/dashboard-v2/AggregatedMaturityWidget.tsx`:**
- Beholder kontrollområde-visningen som standard (den nåværende grid-visningen)
- Erstatter historikk-toggle-innholdet med ny 2-delt visning: regelverkskort-grid + trendlinje
- Henter data fra `stats.byFramework` (allerede tilgjengelig fra `useComplianceRequirements`)
- Henter regelverksnavn fra `frameworks` i `frameworkDefinitions.ts`
- Filtrerer kun aktive rammeverk (de som har krav registrert)

**Ny sub-komponent: sirkulær gauge**
- Liten SVG donut-ring (40x40px) med prosent i midten
- Fargekoding: <34% rød, 34-66% gul/oransje, ≥67% grønn

### Tekniske detaljer
- `stats.byFramework` returnerer `Record<string, ScoreResult>` med `score`, `assessed`, `total`
- `frameworks` fra `frameworkDefinitions.ts` gir `id`, `name`, `description`, `category`
- Ingen nye hooks eller database-endringer nødvendig
- Responsivt: 4-kolonne grid på desktop, 2 på mobil, stacked på xs

