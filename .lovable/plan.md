

## Plan: Redesign Dashboard til moderne GRC-oversikt

### Nåværende problemer

Dashbordet er tungt på compliance-data (shield, XP, streaks) men mangler:
- **Leverandøroversikt** — ingen innsikt i leverandører/systemer
- **Siste aktiviteter** — ingen aktivitetshistorikk på tvers
- **Modenhetsutvikling over tid** — bare snapshot, ingen trend
- **Oppgaveoversikt** — bare 3 "neste handlinger", ikke helhetlig
- **Gamification-støy** — XP, streak, levels gir lite verdi for daglig bruk

### Ny struktur (5 soner, no-scroll desktop)

```text
┌─────────────────────────────────────────────────────┐
│ ZONE 1: Compliance Score + 4 KPI-kort               │
│ [Donut 38%] [Leverandører 24] [Systemer 18]         │
│             [Åpne oppgaver 7] [Avvik 2]             │
├──────────────────────┬──────────────────────────────┤
│ ZONE 2: Modenhet     │ ZONE 3: Siste aktiviteter    │
│ per fokusområde      │ (tidslinje på tvers av alt)   │
│ + sparkline-trend    │ [Oppgave fullført...]         │
│                      │ [Leverandør oppdatert...]     │
│                      │ [Avvik registrert...]         │
├──────────────────────┴──────────────────────────────┤
│ ZONE 4: Krever din oppmerksomhet (topp 5 oppgaver)  │
├─────────────────────────────────────────────────────┤
│ ZONE 5: Risikobilde + Årshjul (kompakt, som nå)    │
└─────────────────────────────────────────────────────┘
```

### Tekniske detaljer

**Fil: `src/pages/DashboardV2.tsx`**
- Fjern XP, streak, level-beregninger (gamification)
- Legg til nye queries: leverandørtelling (`assets` med `asset_type = vendor`), systemtelling (`asset_type = system`), avvikstelling (`employee_deviation_reports` med `status != closed`), siste aktiviteter (aggregert fra `user_tasks`, `lara_inbox`, `employee_deviation_reports`)
- Oppdater header fra "Dashboard 2.0" / "Beta" til bare "Dashboard"
- Ny layout med 5 soner

**Ny fil: `src/components/dashboard-v2/KPIRow.tsx`**
- 4 kompakte KPI-kort: Leverandører, Systemer, Åpne oppgaver, Avvik
- Hvert kort med ikon, tall og kort undertekst
- Klikk navigerer til relevant side

**Ny fil: `src/components/dashboard-v2/RecentActivityFeed.tsx`**
- Henter siste 10 hendelser fra: `user_tasks` (nyopprettet/fullført), `lara_inbox` (nye hendelser), `employee_deviation_reports` (nye avvik)
- Sorterer kronologisk, viser tidslinje med ikon, tittel, relativ tid
- Kompakt liste, maks 8-10 elementer

**Ny fil: `src/components/dashboard-v2/MaturityOverview.tsx`**
- Viser de 4 fokusområdene med progress bars (som nå)
- Legger til mini sparkline-trend (siste 3 måneder) basert på `maturity_milestones`-tabellen
- Erstatter den eksisterende per-regelverk + per-fokusområde splitten med én enhetlig visning

**Refaktorering: `src/components/dashboard-v2/ComplianceShield.tsx`**
- Forenkle til bare donut-score + statusmelding + modenhetsnivå (fjern XP, streak, flame, quick-action buttons)
- Gjør den mer kompakt — én rad med donut til venstre og KPI-kort til høyre

**Refaktorering: `src/components/dashboard-v2/NextActionCards.tsx`**
- Utvid fra 3 til 5 elementer
- Inkluder brukeroppgaver fra `user_tasks` (ikke bare compliance-krav)
- Sortér etter prioritet (critical → high → medium → low)
- Vis status, ansvarlig og frist

**Beholdes som de er:** `SecurityBreachWidget` (flyttes ned), `RiskAndCalendarSection` (komprimeres)

### Hva fjernes
- XP-system og streak fra dashbordet
- Quick-action buttons (Kontroller, ISO Readiness, Regelverk) — dette er navigasjon, dekket av sidemenyen
- Per-regelverk breakdown (duplikat av per-fokusområde)
- "Beta"-badge

### Dataspørringer (nye)
Alle fra eksisterende tabeller, ingen DB-endringer:
- `assets` → count per type (vendor, system)
- `user_tasks` → åpne oppgaver + siste fullførte
- `employee_deviation_reports` → åpne avvik
- `lara_inbox` → siste hendelser
- `maturity_milestones` → trenddata

