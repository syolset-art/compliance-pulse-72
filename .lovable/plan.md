## Mål

Et nytt selvstendig modul **Agentstyring** der virksomheten registrerer og styrer AI-agenter (egne Lara-flyter + BYOA som Copilot/GitHub Copilot) etter Mynders MACF-rammeverk. Lever på samme nivå som Leverandørmodulen: egen sidebar-seksjon, egen rute, eget register med KPI-er, tabellvisning og detaljside per agent.

## Scope (denne iterasjonen)

1. **Sidebar-oppføring** "Agenter" under hovednavigasjon, mellom Leverandører og Meldinger. Samme mønster som `vendorLink` (kollapsbar med Oversikt + Rapporter, klar for fremtidige under-sider).
2. **Hovedside `/agents`** – AI-agentregister (matcher skjermbildet):
   - Topp: tittel "AI-agenter", undertekst "Registrerte agenter tilknyttet din Trust Profile · MACF-styrt", knapper Eksporter + Registrer agent.
   - 4 KPI-kort: Totalt registrert · Aktive i produksjon · Venter MACF-godkjenning · BYOA-agenter.
   - To grupperte tabeller:
     - **Mynder — Lara-flyter** (interne agenter)
     - **BYOA — Bring your own agent** (eksterne)
   - Kolonner: Agent (navn + undertittel) · Type-pille · Status · MACF-nivå · Tillit-score (mini-bar + tall) · Handling-knapp.
   - "Mynders tilnærming"-infoboks nederst.
   - Footer-merknad om hvordan Tillit-score beregnes.
3. **Detaljside `/agents/:id`** – tab-basert profil (Oversikt, MACF, Risikovurdering, Audit-logg, Tilkoblinger). Første iterasjon: Oversikt + MACF synlige, øvrige tabs som tomme placeholders.
4. **Registrer agent-dialog** – wizard med felt: navn, type (Mynder/BYOA), leverandør/team, beskrivelse, formål, datatilfang, tool-sett, MACF-mål-nivå. Lara-forslag for risikoklassifisering (matcher AI-philosophy memory).
5. **Demo-data + seed** – `lib/demoSeedAgents.ts` med agentene fra skjermbildet (Lara Leverandørgjennomgang, Tilgangskontroll, Policy-agent, Copilot for M365, GitHub Copilot) slik at modulen ser levende ut umiddelbart, parallelt med leverandør-demo.

## Datamodell (Supabase)

Ny tabell `ai_agents` med RLS:

```text
ai_agents
├── id (uuid pk)
├── organization_id (uuid)
├── name (text)
├── subtitle (text)               // "Totto · audit-logging på"
├── kind (enum: mynder | byoa)
├── provider (text)               // "Microsoft", "GitHub", "Mynder"
├── owner_team (text)
├── status (enum: active | review | inactive | pending)
├── macf_level (enum: not_assessed | L1 | L2 | L3 | L3_pending)
├── trust_score (int 0-100)       // avledet, lagres for visning
├── risk_category (enum)          // gjenbruk samme verdier som AI-systemer
├── purpose (text)
├── data_scope (text[])
├── tools (text[])
├── audit_logging (bool)
├── rbac_roles (text[])
├── created_at / updated_at
```

Tilleggstabell `agent_macf_assessments` for revisjonsspor (en rad per evaluering, lagrer score-komponenter + tidspunkt). RLS scoped på `organization_id` via samme helpers som `assets`.

## Filplassering

```text
src/pages/AgentRegistry.tsx
src/pages/AgentProfile.tsx
src/components/agents/
├── AgentTable.tsx          // én tabell, gjenbrukes for begge seksjoner
├── AgentKpiRow.tsx
├── AgentTrustBar.tsx       // mini-progress + score
├── MacfLevelBadge.tsx
├── RegisterAgentDialog.tsx
├── AgentApproachCallout.tsx
├── AgentScoreFootnote.tsx
└── tabs/
    ├── AgentOverviewTab.tsx
    └── AgentMacfTab.tsx
src/hooks/useAgents.ts
src/hooks/useAgentMetrics.ts
src/lib/agentMacf.ts         // MACF-nivåer, scoring, fargesystem
src/lib/demoSeedAgents.ts
```

## Designtokens

- Pillefarger: Mynder = primary/15 (deep purple), BYOA = warning/15.
- MACF-nivåer: L1 muted, L2 success, L3 primary, "venter"/"ikke vurdert" = warning/muted med varseltrekant.
- Tillit-score-bar bruker eksisterende risiko-fargeregel (>=75 success, 50–74 warning, <50 destructive) — i tråd med Core-memory.

## i18n

Alle strenger via nye `agents.*`-nøkler i `nb` og `en` (Agentstyring / Agent governance, Tillit-score / Trust score, BYOA, MACF-nivå, osv.).

## Module-aktivering

Hekt på samme soft-gate/aktiveringsmønster som Vendors (samme moduleActivationEvents-flyt). Default: vises for super_admin og når feature-flagget `agents` er aktivt; ellers skjult fra sidebar – akkurat som `showVendorsNormal`.

## Ute av scope nå

- Faktisk MACF-evaluering / runtime-gating av agenter.
- BYOA-integrasjonsoppdagelse (Copilot-konnektorer).
- Eksport-PDF (knappen finnes, men leverer kun CSV-stub i denne iterasjonen).

## Åpent spørsmål før bygg

Skal "Agenter" knyttes til **Trust Profile** (vises på offentlig profil med MACF-nivå og score) i denne iterasjonen, eller holdes internt først og publiseres i en oppfølging? Skjermbildets undertittel antyder Trust Profile-kobling, men det er en større endring som påvirker `trust_profile_sections` og publish-logikk.
