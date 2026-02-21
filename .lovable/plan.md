

# Dashboard 1.0 -- Redesign for mestring og handlingskraft

## Problem

Dashboard 1.0 gir i dag en flat liste med widgets uten tydelig prioritering. Brukeren vet ikke:
- "Er jeg ferdig med noe?"
- "Hva skal jeg gjore na?"
- "Hva gjores sjelden vs. arlig?"
- "Hva er status pa tredjeparter, protokoller og oppgaver?"

Dashbordet mangler ogsa PostOnboardingRoadmapWidget etter at onboardingen er fullfort, og arskalenderen er gjemt bort.

## Losning: Tre tydelige soner

Restructurere Index.tsx til tre klare soner som folger PECB-livssyklusen og gir brukeren umiddelbar mestring.

### Sone 1: "Hva er status?" (topp)
- **OnboardingProgressWidget** (hvis ikke ferdig) / **PostOnboardingRoadmapWidget** (etter onboarding)
- **StatusOverviewWidget** -- domene-score (personvern, sikkerhet, AI)
- Ny **ComplianceHealthBar** -- enkel visuell linje som viser total % + modenhetsniva

### Sone 2: "Hva ma jeg gjore na?" (midten, storst fokus)
Ny widget: **ActionPriorityWidget** som erstatter CriticalTasksWidget + UpcomingTasksWidget i en samlet visning:
- **Kritisk na**: Apne hendelser, forfalte gjennomganger, ventende risikovurderinger (fra CriticalTasksWidget-data)
- **Neste prioriterte handlinger**: Manuelt krevende compliance-krav med hoyest prioritet
- **Kommende oppgaver**: Oppgaver med frist denne uken/maneden

### Sone 3: "Overblikk og arskalender" (bunn)
Fire sammendragskort i et grid:

1. **Tredjeparter** -- Leverandorer utenfor EU, manglende DPA, hoyrisikoleverandorer (fra ThirdPartyManagementWidget, men lenker til /assets)
2. **Protokoller (ROPA)** -- Status pa behandlingsoversikt (fra ROPAStatusWidget, lenker til /processing-records)
3. **Systemer og prosesser** -- Antall systemer, prosesser, SLA-oppnaelse for systems_processes (fra SLAWidget-data)
4. **Organisasjon og roller** -- SLA-oppnaelse for organization_governance + roles_access, roller tildelt

Etter disse: **ComplianceCalendarSection** (arskalenderen) -- alltid synlig (ikke collapsible), med tydelig markering av hva som gjores sjelden (arlig audit), kvartalsvis (risikovurdering), og lopende (avvikshandtering).

## PECB-forankring i arskalenderen

Oppdatert ComplianceCalendarSection med frekvensmerking:

| Kvartal | Aktiviteter | Frekvens |
|---------|-------------|----------|
| Q1 | Gap-analyse, Scope-definisjon, Rollefordeling | Arlig |
| Q2 | Risikovurdering, Policy-utvikling, Leverandoravtaler (DPA) | Arlig/Halvaarlig |
| Q3 | Kontrollimplementering, Opplaering, Overvaking og avvik | Lopende |
| Q4 | Internrevisjon, Ledelsesgjennomgang, Kontinuerlig forbedring | Arlig |

Hver aktivitet far en badge: "Arlig", "Kvartalsvis", "Lopende", "Sjelden"

## Filer som endres

1. **`src/pages/Index.tsx`** -- Omstrukturert layout med tre soner, fjerner redundante widgets, legger til PostOnboardingRoadmapWidget
2. **Ny: `src/components/widgets/ActionPriorityWidget.tsx`** -- Samler kritiske handlinger, neste steg og kommende oppgaver i en widget
3. **Ny: `src/components/widgets/ComplianceSummaryCards.tsx`** -- Fire sammendragskort (tredjeparter, protokoller, systemer, organisasjon)
4. **`src/components/widgets/ComplianceCalendarSection.tsx`** -- Oppdatert med frekvensbadges, alltid apen, PECB-faser markert
5. **`src/components/widgets/PostOnboardingRoadmapWidget.tsx`** -- Ingen endring, men brukes na mer fremtredende

## Tekniske detaljer

### ActionPriorityWidget
- Henter data fra `system_incidents` (apne hendelser), `systems` (forfalte gjennomganger), compliance requirements (manuelle krav)
- Viser maks 3 kritiske + 3 neste handlinger + 3 kommende oppgaver
- Hver handling har ikon, tittel, badge (prioritet/fase), og lenke til riktig side

### ComplianceSummaryCards
- Henter data fra `assets` (leverandorer), `systems` (systemer), compliance requirements (SLA-kategorier)
- Fire kort i 2x2 grid pa desktop, stacked pa mobil
- Hvert kort viser: tall, kort status, lenke til detaljer

### ComplianceCalendarSection endringer
- Fjern `Collapsible` -- alltid synlig
- Legg til `frequency` felt pa hver aktivitet: "arlig" | "kvartalsvis" | "lopende" | "sjelden"
- Vis badge med farge per frekvens
- Marker gjeldende kvartal tydeligere med fremhevet border og "Na"-badge
- Legg til ISO-referanse per aktivitet (f.eks. "ISO 27001 9.2" for internrevisjon)

### Index.tsx endringer
- Fjern: InherentRiskWidget, ControlsWidget, TaskProgressWidget, SystemLibraryWidget, AIUsageOverviewWidget, AIActComplianceWidget, ActivityReportWidget, MyRegulationsWidget (disse finnes pa sine respektive sider)
- Behold: OnboardingProgressWidget (som viser PostOnboardingRoadmapWidget nar ferdig)
- Behold: DomainComplianceWidget (rolle-spesifikk topp-widget)
- Legg til: ActionPriorityWidget, ComplianceSummaryCards, ComplianceCalendarSection
- Forenklet desktop-layout uten resizable panels

