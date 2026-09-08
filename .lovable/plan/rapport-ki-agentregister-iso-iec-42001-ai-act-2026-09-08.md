# Rapport: KI-agentregister (ISO/IEC 42001 + AI Act)

Ny rapport under Rapporter som viser alle etablerte KI-agenter i virksomheten, med styringsinformasjon strukturert etter ISO/IEC 42001 og EU AI Act.

Merk: standarden for KI-styringssystem er ISO/IEC 42001 (ikke 41001, som er facility management). Rapporten bygges mot 42001.

## Hva brukeren får

- Nytt punkt i Rapporter-menyen: «KI-agenter» (EN: «AI agents»).
- Rapportsiden viser:
  - Toppsammendrag: antall agenter totalt, hvor mange som er satt i arbeid, hvor mange som behandler personopplysninger, hvor mange som mangler mandat/kontrollpunkt.
  - Tabell over alle agenter: navn, arbeidsområde(r) (med «Delt»-markering), prosess(er), status (foreslått / satt i arbeid), kontrollnivå, ansvarlig, sist endret.
  - AI Act-seksjon: hver agent plasseres i risikokategori (uakseptabel / høy / begrenset / minimal) med begrunnelse, og en sjekkliste over åpenhetskrav, menneskelig kontroll og logging — grønn/gul markering per agent.
  - ISO/IEC 42001-seksjon: agentene mappes mot kravområdene (kontekst og roller, mål og policy, risikovurdering, ressurser/data, drift og kontrollpunkter, overvåking og logging, forbedring). Viser dekket/mangler med lenke til der det fylles ut.
  - Rad-klikk går til agentprofil eller prosessens Verdistrøm-fane.
  - Eksport til PDF/utskrift med samme mønster som eksisterende rapporter.
- Tom tilstand for kunder som ikke har kartlagt ennå: «Ingen KI-agenter registrert» med knapp til Arbeidsområder → Kartlegg KI-muligheter.

## Datagrunnlag (gjenbruk, ingen skjemaendring)

- `process_agent_recommendations` (status `recruited` = etablert, `autonomous`/`copilot` = foreslått), koblet til prosess og arbeidsområde.
- Lokale prototype-agenter fra `agentMacf` med `process_names`.
- `buildWorkAreaAgents()` i `src/lib/agentWorkAreas.ts` for agent → prosess → arbeidsområde, inkludert delt-logikk.
- `process_ai_usage` for persondata/risikokategori som input til AI Act-klassifisering.
- Mandat/kontrollpunkter fra `agentMandate` og policyer fra agentens policy-fane.

## Teknisk

- Ny side `src/pages/AgentGovernanceReport.tsx`, rute `/reports/ai-agents` i `App.tsx`, nytt element i `ReportsMenu` i `src/components/Sidebar.tsx` og et kort i `src/pages/Reports.tsx`.
- Ny hook `src/hooks/useAgentGovernanceReport.ts` som slår sammen kildene over til én rapportmodell.
- Ny `src/lib/aiActClassification.ts`: forklarbar frontend-klassifisering (risikonivå + begrunnelse) og ISO/IEC 42001-kravmapping. Alltid begrunnelse, aldri bare et nivå.
- Nye presentasjonskomponenter under `src/components/reports/agents/`.
- Norsk grensesnitt («KI», ikke «AI»), eksisterende designsystem, WCAG AA.

## Ikke i denne runden

- Ingen databaseskjemaendring, ingen automatisk håndheving av mandat eller policy.
- Ingen offisiell samsvarserklæring — rapporten er et styringsoverblikk, og teksten sier tydelig at klassifiseringen er et utkast som må bekreftes av et menneske.
