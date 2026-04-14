

## Plan: Leverandørstatus-widget for Dashboard

### Oversikt
Ny widget som gir en kompakt oversikt over leverandørporteføljen direkte fra dashbordet, med mulighet til å bytte mellom tre visninger: **Kritiske** (prioritet), **Høyest risiko**, og **Databehandlerroller** (GDPR-rolle).

### Ny komponent: `src/components/dashboard-v2/VendorInsightsWidget.tsx`

```text
┌──────────────────────────────────────────────────────┐
│ Leverandørinnsikt              [Kritisk▾] [Risiko▾] [Roller▾]  │
│ 12 leverandører registrert                            │
├──────────────────────────────────────────────────────┤
│ Visning: Kritisk prioritet (default)                  │
│ ┌─────────────────────────────────────────┐           │
│ │ 🔴 Acme Corp     Kritisk  Score: 34%   │           │
│ │ 🟠 DataSys AS    Høy      Score: 52%   │           │
│ │ 🟡 CloudNet      Middels  Score: 71%   │           │
│ │ 🟢 SafeStore     Lav      Score: 88%   │           │
│ └─────────────────────────────────────────┘           │
│                                                       │
│ Visning: Høyest risiko                                │
│  Sortert etter risk_level/risk_score desc             │
│                                                       │
│ Visning: Databehandlerroller                          │
│  Gruppert: Databehandler (5) · Felles ansv. (2) · …  │
│  Hvert kort viser rolle-badge + antall leverandører   │
└──────────────────────────────────────────────────────┘
```

### Funksjonalitet

1. **Segmentert kontroll** med tre visninger:
   - **Prioritet**: Viser leverandører sortert etter `priority`-felt (critical → high → medium → low), med fargekoding og compliance-score
   - **Risiko**: Sortert etter `risk_level` og `risk_score` desc, viser risiko-badge og score
   - **GDPR-roller**: Grupperer leverandører etter `gdpr_role` (databehandler, felles behandlingsansvarlig, etc.) med antall per rolle

2. **Hvert leverandørkort** viser: navn, relevant badge (prioritet/risiko/rolle), compliance_score som mini progress bar

3. **Klikk** på leverandør navigerer til `/vendors/:id`

4. **Summering øverst**: Totalt antall leverandører, antall med kritisk/høy prioritet, antall uten GDPR-rolle

### Datakilde
- Henter fra `assets` med `asset_type = "vendor"` via `useQuery`
- Bruker eksisterende felter: `priority`, `risk_level`, `risk_score`, `compliance_score`, `gdpr_role`, `name`

### Plassering i DashboardV2
- Legges til etter `AggregatedMaturityWidget` og før `RecentActivityFeed`
- Full bredde

### Tekniske detaljer
- Enkel `useQuery` mot `assets`-tabellen filtrert på vendor
- Tre visninger via lokal state `viewMode: "priority" | "risk" | "roles"`
- Maks 6 leverandører vist, med «Se alle →» lenke til `/vendors`
- Responsiv: listekort stacker på mobil

