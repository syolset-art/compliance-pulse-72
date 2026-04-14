

## Plan: Slå sammen Oppfølgingsstatus og Oppgaver

### Hva endres

TPRM-statusbanneret og Oppgaver-kortet slås sammen til én samlet komponent som gir bedre oversikt. Brukeren ser status, gjenstående oppgaver og siste utførte aktiviteter i ett og samme panel — uten å måtte utvide flere separate kort.

### Ny layout for den sammenslåtte komponenten

```text
┌─────────────────────────────────────────────────┐
│ 🟡 Under oppfølging · Høy · 5/13 (38%)  [Endre]│
├─────────────────────────────────────────────────┤
│ Risiko: Høy  |  Kontroll: 5/13 (38%)           │
│ ⚠ 8 kontroller gjenstår for å nå «Godkjent»    │
├─────────────────────────────────────────────────┤
│ ✅ UTFØRT (siste 3 aktiviteter)                 │
│  ✓ DPA lastet opp — Jan, Compliance — 2d siden  │
│  ✓ Sikkerhetsgjennomgang — Per — 5d siden        │
│  ✓ SLA godkjent — Jan — 1 uke siden              │
│                                    [Se alle →]   │
├─────────────────────────────────────────────────┤
│ 📋 GJENSTÅR (6 oppgaver)                        │
│  ○ Last opp risikovurdering        [Gå til dok] │
│  ○ Sett risikonivå                 [Gå til risk]│
│  ○ Dokumenter underleverandører    [Gå til rel.] │
│  ...                                             │
└─────────────────────────────────────────────────┘
```

### Tekniske detaljer

**Fil: `src/components/trust-controls/VendorTPRMStatus.tsx`**
- Flytte oppgaveinnholdet (fra VendorOverviewTab) inn i TPRM-komponenten
- Ny prop: `openTasks` (array) og `highlightedTaskId`
- Legge til ny seksjon «Utført» som viser de 3 siste aktivitetene (allerede har `recentActivities`)
- Endre «Siste aktiviteter» til å vises som «Utført»-seksjon med suksess-ikoner
- Legge til «Gjenstår»-seksjon med oppgaveliste og CTA-knapper
- Ekspandert innhold deles i to tydelige seksjoner: Utført og Gjenstår
- Hele panelet er som standard utvidet når det finnes åpne oppgaver

**Fil: `src/components/asset-profile/tabs/VendorOverviewTab.tsx`**
- Fjerne det separate Tasks-kortet (linje 331-418)
- Sende `openTasks`, `highlightedTaskId`, `onNavigateToTab` som props til `VendorTPRMStatus`
- Beholde `tasksRef` og `id="vendor-tasks-section"` på TPRM-komponenten i stedet
- Fjerne duplisert state for `tasksExpanded`

**Ingen databaseendringer.**

