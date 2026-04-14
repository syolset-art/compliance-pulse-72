

## Plan: Aggregert «Modenhet per kontrollområde» — Dashboard-widget

### Oversikt
Erstatter den nåværende `ControlsWidget` og `MaturityOverview` på DashboardV2 med en ny, rikere widget som speiler layouten fra leverandør/system-profilvisningen (ref. bildene), men i en aggregert dashbord-versjon. Widgeten kombinerer de beste elementene fra `SecurityFoundationsWidget` (drill-down, historikk-graf) og `ControlsWidget` (intervallvelger, kompakt telling).

### Hva bygges

**Ny komponent: `src/components/dashboard-v2/AggregatedMaturityWidget.tsx`**

Struktur (inspirert av skjermbildene):

```text
┌─────────────────────────────────────────────────┐
│ Modenhet per kontrollområde  [LAV/HØY]  [↗] 38%│
│ Aggregert på tvers av leverandører og systemer   │
│ ● Leverandørers baseline: X%  ● Eget arbeid: Y% │
│ ═══════════════════════════════════              │
│ [4 OPPFYLT] [9 GJENSTÅR] [5 KONTROLLOMRÅDER]    │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐             │
│  │ Styring  100%│  │ Drift    83% │             │
│  │ 1/1 oppfylt  │  │ 2/3 oppfylt  │             │
│  │ GOD DEKNING  │  │ GOD DEKNING  │             │
│  │ ████████████ │  │ █████████░░░ │             │
│  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐             │
│  │ Identitet  0%│  │ Personvern 0%│             │
│  │ 0/0 oppfylt  │  │ 0/5 oppfylt  │             │
│  │ LAV DEKNING  │  │ 5 gjenstår   │             │
│  └──────────────┘  └──────────────┘             │
│  ┌──────────────────────────────────┐           │
│  │ Leverandører og økosystem    38% │           │
│  └──────────────────────────────────┘           │
├─────────────────────────────────────────────────┤
│ [Historikk-bryter → Linjegraf med trend]        │
└─────────────────────────────────────────────────┘
```

Funksjonalitet:
1. **Header**: Tittel, deknings-badge (LAV/GOD/HØY DEKNING), historikk-knapp (TrendingUp), total prosent
2. **Stacked progress bar**: Viser leverandørers baseline vs. eget arbeid (gjenbruker `StackedProgress`)
3. **Sammendragspiller**: «X oppfylt», «Y gjenstår», «Z kontrollområder»
4. **Domene-kort i 2-kolonne grid**: Hvert kort viser ikon, navn, prosent, assessed/total, dekning-label, fremdriftslinje. Klikk utvider med kontrolliste (gjenbruk fra `SecurityFoundationsWidget`)
5. **Historikk-visning**: Toggle til linjegraf som viser modenhetstrend over 6 måneder (gjenbruk `generateHistoryData`-logikk)

### Endringer i DashboardV2

- Fjern `MaturityOverview` fra Zone 2
- Erstatt med `AggregatedMaturityWidget` som full-bredde widget i Zone 2 (over `RecentActivityFeed`)
- `RecentActivityFeed` flyttes ned til egen rad eller plasseres ved siden av

### Endringer i Index.tsx (widgetbar dashboard)

- Oppdater `SecurityFoundationsWidget`-referansen til å bruke den nye aggregerte widgeten, eller la den eksisterende `SecurityFoundationsWidget` forbli for widget-dashboardet

### Fjernes

- `ControlsWidget` fjernes fra bruk (kan beholdes i kodebasen for referanse)
- `MaturityOverview`-komponenten erstattes av den nye widgeten

### Tekniske detaljer
- Data fra `useComplianceRequirements()` → `stats.byDomainArea` og `stats.overallScore`
- Dekningslabel-logikk: score >= 67 → «GOD DEKNING», >= 34 → «MIDDELS», < 34 → «LAV DEKNING»
- Historikkdata genereres med eksisterende mock-logikk (samme som `SecurityFoundationsWidget`)
- Fargekoding: lilla/primary for progress bars (matcher skjermbildene)
- Responsiv: 2-kolonne grid på desktop, stacked på mobil

