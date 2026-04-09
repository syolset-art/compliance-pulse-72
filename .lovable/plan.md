

## Plan: Rollebasert innholdstilpasning

### Sammendrag
Tilpasse dashboardet, sidebar-navigasjonen og widgetene basert på brukerens aktive rolle, slik at hver rolle ser innhold som er relevant for deres ansvarsområde.

### Hva endres for brukeren
- **Dashboardet (Index)** viser ulike widgets og hero-kort basert på rolle. Personvernombud ser behandlingsaktiviteter og DPIA, sikkerhetsansvarlig ser prosesser og kritikalitet, compliance-ansvarlig ser regelverk og modenhet.
- **Sidebar** fremhever og prioriterer menyelementer som er relevante for rollen. Irrelevante seksjoner kollapses eller dimmes.
- **Kritiske oppgaver** filtreres per rolle slik at hver bruker ser handlinger som faktisk angår dem.
- Rollebytteren (allerede i sidebar) forblir tilgjengelig for å bytte perspektiv.

### Teknisk tilnærming

**1. Definere rolle-til-innhold-mapping (ny fil `src/lib/roleContentConfig.ts`)**

Én konfigurasjon per rolle som styrer:
- Hvilke dashboard-widgets som er synlige (koble til eksisterende `DASHBOARD_LAYOUTS`)
- Hvilke sidebar-nav-items som fremheves vs. dimmes
- Hvilke hero-cards / CTA-er som vises
- Hvilke kritiske oppgaver som er relevante

```text
Rolle               | Primært innhold                        | Sekundært
────────────────────┼────────────────────────────────────────┼──────────────
personvernombud     | Behandlingsaktiviteter, DPIA, ROPA     | Avvik, Leverandører
sikkerhetsansvarlig | Prosesser, Kritikalitet, Kontroller     | Systemer, Hendelser
compliance_ansvarlig| Regelverk, Modenhet, Oppgaver           | Alt
daglig_leder        | KPI, Risiko, Status                     | Rapporter
ai_governance       | AI-systemer, AI Act, Risikovurdering    | Compliance
operativ_bruker     | Mine oppgaver, Systemer                 | Minimalt
```

**2. Oppdatere `Index.tsx` (Dashboard)**
- Importere `useUserRole` og hente `primaryRole`
- Bruke rolle til å filtrere `WIDGET_DEFS` — vise kun relevante widgets som standard
- Vise rollespesifikke hero-kort (f.eks. personvernombud ser "Opprett behandlingsaktivitet", sikkerhetsansvarlig ser "Se risikoer")
- Beholde "Tilpass"-knappen slik at brukere kan legge til widgets manuelt

**3. Oppdatere `Sidebar.tsx`**
- Bruke `primaryRole` til å sortere/fremheve relevante nav-items
- Dimme (opacity + smaller font) items som er mindre relevante for rollen
- Ikke skjule noe helt — bare visuell prioritering

**4. Oppdatere `DashboardCriticalTasks.tsx`**
- Filtrere oppgavene basert på rolle (f.eks. personvernombud ser DPA-mangler, sikkerhetsansvarlig ser NIS2)

**5. Oppdatere `DashboardHeroCards.tsx`**
- Vise rollespesifikke snarveier/CTA-er (personvernombud: "Ny behandlingsaktivitet", sikkerhetsansvarlig: "Se prosessoversikt")

### Filer som endres
- `src/lib/roleContentConfig.ts` (ny) — rolle-til-innhold-mapping
- `src/pages/Index.tsx` — rollebasert widget-filtrering
- `src/components/Sidebar.tsx` — visuell prioritering av nav
- `src/components/dashboard/DashboardCriticalTasks.tsx` — rollefiltrerte oppgaver
- `src/components/dashboard/DashboardHeroCards.tsx` — rollespesifikke CTA-er

### Ingen databaseendringer
Alt er konfigurasjonsbasert og bruker eksisterende `useUserRole`-hook.

