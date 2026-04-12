

## Plan: Modenhetshistorikk — tidslinje for modenhet over tid

### Hva bygges
En klikkbar tidslinje-knapp i "Modenhet per kontrollområde"-panelet som åpner et linjediagram. Diagrammet viser hvordan modenhetsscoren har utviklet seg fra leverandørens baseline (før virksomheten tok systemet i bruk) til dagens nivå, med markører for hendelser som økte eller reduserte scoren.

### Visuelt konsept
```text
┌─────────────────────────────────────────────────────┐
│ Modenhet per kontrollområde              72%        │
│ Leverandørens baseline: 35%  ▪ Eget arbeid: 37%    │
│ ██████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                     │
│  [📈 Vis historikk]  ← ny knapp                    │
│                                                     │
│ ┌─ Modenhetshistorikk ────────────────────────────┐ │
│ │ 100% ─┤                                         │ │
│ │       │          ╭──●──────●──●                  │ │
│ │  50% ─┤     ●──●╯     ▼ Hendelse                │ │
│ │       │  ●─╯  ↑ DPA verifisert                  │ │
│ │   0% ─●───────────────────────────── tid         │ │
│ │   ▲ Baseline                                     │ │
│ │                                                  │ │
│ │ ── Leverandør baseline  ── Eget arbeid (total)   │ │
│ └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Teknisk implementering

**Fil 1: `src/components/trust-controls/MaturityHistoryChart.tsx`** (ny)
- Recharts `AreaChart` med to stablede områder:
  - Grått område: leverandørens baseline-score over tid
  - Blått område: virksomhetens berikelse (org_enrichment) over tid
- `ReferenceDot`-markører for hendelser (tiltak utført, hendelser registrert)
- Tooltip som viser dato, baseline-score, total score, og eventuelle hendelser
- Demomodus med deterministisk generert data basert på asset-ID (samme mønster som `ComplianceHistoryChart`)
- Baseline starter flat, deretter øker totalen stegvis når kontroller oppfylles
- Negative hendelser (incidents) vises som røde markører med score-dip

**Fil 2: `src/components/trust-controls/TrustControlsPanel.tsx`** (endres)
- Legg til en `TrendingUp`-ikonknapp ved siden av tittelen "Modenhet per kontrollområde"
- `useState` for å toggle synlighet av `MaturityHistoryChart`
- Når åpnet, vises chart-komponenten mellom header og kontrollområde-kortene
- Passerer `assetId`, `baselinePercent`, `enrichmentPercent` og `trustScore` til chart

### Hendelsestyper i tidslinjen
- **Positiv** (grønn markør): DPA verifisert, eier tildelt, risikovurdering utført, dokumenter lastet opp
- **Negativ** (rød markør): Sikkerhetshendelse, kontroll fjernet, dokument utløpt
- **Nøytral** (gul markør): Revisjon planlagt, delvis oppfylt

### Detaljer
- Diagrammet bruker demo-data nå (ingen database-endringer nødvendig)
- Gjenbruker `recharts` som allerede er i prosjektet
- Norsk/engelsk lokalisering for alle labels
- Responsivt — full bredde på mobil, begrenset høyde

