

## Plan: Redesign dashbordet — no-scroll desktop, fokus på verdi

### Analyse av nåværende problemer
Dashbordet har i dag 11+ widget-fliser i et rutenett som krever betydelig scrolling selv på PC. Mange widgets viser statisk demo-data (FAIR-risiko, sårbarhetskart, datageografi) som gir lite handlingsrettet innsikt. Det mangler fokus på "hva bør jeg gjøre nå" og "hva har AI-agenten gjort for meg".

### Ny struktur — alt over folden på desktop

Hele dashbordet skal passe i én skjermhøyde (~900px) på desktop. Mobilvisningen scroller naturlig.

```text
┌─────────────────────────────────────────────────────┐
│  Hei, [Selskap]              [rolle-label]  [Tilpass]│
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Compliance│  │Risikonivå│  │Kontroller│  (3 mini) │
│  │  74%     │  │  Middels │  │  42/58   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
├─────────────────────────────────────────────────────┤
│  Krever din oppmerksomhet (3-5 items, klikkbare)    │
│  • 2 leverandører mangler oppdatert DPA  → [Gå til]│
│  • Revisjon av ISO 27001 om 12 dager     → [Gå til]│
│  • 1 forespørsel mottatt fra kunde       → [Gå til]│
├────────────────────┬────────────────────────────────┤
│  Lara (AI-agent)   │  Frister & kalender            │
│  Siste 7 dager:    │  • ISO-revisjon: 24. apr       │
│  ✓ Sendt DPA-krav  │  • DPA-fornyelse: 1. mai       │
│    til 3 levrand.  │  • NIS2-rapport: 15. mai       │
│  ✓ Analysert 28    │                                │
│    systemer        │                                │
│  Spart ~4 timer    │                                │
└────────────────────┴────────────────────────────────┘
```

### Endringer

**1. `src/pages/Index.tsx` — Forenkle dashboard-innholdet**
- Fjern det store widget-rutenettet (`DashboardGrid` med 11 fliser) fra standard visning
- Behold `editMode` / `DashboardGrid` som en "Utvidet visning"-toggle for de som vil ha det
- Ny default-visning med 4 kompakte soner:
  - **Sone 1**: Tre kompakte KPI-kort (compliance %, risikonivå, kontroller vurdert) — én rad
  - **Sone 2**: "Krever oppmerksomhet" — maks 5 handlingsrettede linjer (erstatter DashboardCriticalTasks + DashboardHeroCards)
  - **Sone 3**: To kolonner: AI-agentlogg (venstre) + Kommende frister (høyre)

**2. Ny komponent `src/components/dashboard/DashboardCompact.tsx`**
- Kompakt KPI-rad: 3 mini-kort med tall fra `useComplianceRequirements`
- "Krever oppmerksomhet"-seksjon: Samler kritiske oppgaver, innkomne forespørsler, utgåtte dokumenter, kommende revisjoner — sortert etter frist
- AI-agent oppsummering: Viser hva Lara har gjort (sendte forespørsler, analyserte systemer, genererte dokumenter) med estimert tidsbesparelse
- Fristkalender: Kompakt liste over de 5 neste viktige fristene

**3. Fjern/arkiver overflødige widgets fra default-visningen**
- `BusinessRiskExposureWidget`, `VulnerabilityMapWidget`, `DataGeographyWidget`, `CriticalProcessesWidget`, `NIS2ReadinessWidget`, `EnvironmentOverviewWidget` — beholdes men vises kun i "Utvidet visning"
- `DashboardHeroCards` og `DashboardCriticalTasks` erstattes av de nye kompakte komponentene

**4. Responsiv layout**
- Desktop: CSS grid med `max-h-[calc(100vh-80px)]` og `overflow-hidden` — ingen scroll
- Mobil: Naturlig stack med scroll, kompakte kort beholder seg

### Datakilde for AI-agentlogg
Henter fra eksisterende tabeller:
- `customer_compliance_requests` (sendte/mottatte forespørsler)
- `vendor_document_requests` (DPA-forespørsler sendt av Lara)
- `compliance_requirements` (vurderte kontroller)
- Demo-tall for tidsbesparelse beregnes fra antall automatiserte handlinger

### Filer som endres/opprettes
- `src/components/dashboard/DashboardCompact.tsx` — ny
- `src/pages/Index.tsx` — refaktorert
- Ingen database-endringer nødvendig

