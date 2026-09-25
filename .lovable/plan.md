# ARK-RISIKO-01 – arkitekturvurdering (ingen kodeendring)

## 1) Konklusjon: Endre (blokker i dagens form)
Domenemodellen (versjonert RiskModel, longlist/register/ikke_relevant, template_key, hendelsesbibliotek i kode, agent foreslår – menneske vedtar) støttes. Plattformvalget og forutsetningene stemmer ikke med prosjektet:
- Prosjektet kjører på Postgres (Lovable Cloud) med RLS, ikke Azure SQL/T-SQL. Rå T-SQL gir to databaser, to sikkerhetsmodeller og ingen gjenbruk. Bygg i Postgres.
- Det finnes ingen tenant-modell i dag: ingen org_id på risiko-/avvikstabeller. `systems`, `system_risk_assessments`, `process_risk_scenarios`, `system_incidents` og `integration_audit_log` har policy «Allow all access» (`true`, rolle public). Alle tre P1-funn er altså reelle, og tenant-isolasjon må komme først.

## 2) Krav før implementering
1. Tenant-fundament: `organizations` + `organization_members` (bruker, org, rolle). `org_id NOT NULL` på alle nye tabeller. RLS via en security definer-funksjon `is_org_member(org_id)`. Ingen «true»-policyer på risikodomenet.
2. Tenant-sikre FK-er: sammensatte fremmednøkler `(org_id, id)`, f.eks. `risk(org_id, risk_model_id) -> risk_model(org_id, id)`, samme for scope_id og policy_id. Da kan ingen referere på tvers av org.
3. Reell immutability: status `draft -> approved -> superseded`. En trigger blokkerer UPDATE/DELETE på godkjente versjoner for alle roller, også service_role. Endringer skjer bare som ny versjon (`version`, `supersedes_id`). Unik indeks på én aktiv godkjent versjon per (org, scope).
4. Principal/godkjenning på serversiden: godkjenning skjer kun via en server-funksjon som leser `auth.uid()` og krever en menneskelig sesjon med godkjennerrolle. Agenter (MCP/agent_access_tokens) kjører som egen principal-type, og funksjonen avviser dem. `approved_by` settes av serveren og aldri av klienten. Klienten får ingen direkte UPDATE-rett på status.
5. Append-only audit: egen `risk_audit_log` (org_id, actor_id, actor_type human|agent, handling, før/etter, tidspunkt), skrevet av triggere. Kun INSERT, ingen UPDATE/DELETE.
6. JSON-skjemavalidering for likelihood_scale, consequence_dimensions og action_matrix, både i en valideringstrigger og i koden (samme skjema).

## 3) Dette finnes og kan gjenbrukes
- `user_roles` + `has_role()` (security definer) er mønster for rolle- og godkjennersjekk.
- `agent_access_tokens` med eier-RLS kan brukes som grunnlag for agent-principal.
- MCP-serveren (`src/lib/mcp/*`) er inngangen for agentforslag, med kun utkast-verktøy.
- `process_risk_scenarios` (likelihood/consequence/mitigation) og `system_risk_assessments` er dagens risikodata og migreres til `risk` med template_key.
- `system_incidents` (avvik) forblir uendret, som foreslått.
- `update_updated_at_column()`, valideringstrigger-mønster (`validate_assets_publish_mode`) og `pin.ts` (proveniens human vs agent) passer godt til å vise godkjent vs agentutkast.
- Hendelsesbiblioteket kan ligge i `src/lib/` på samme måte som `controlAreas.ts`/`deviationCategories.ts`.

## 4) Anbefalt rekkefølge
1. Tenant-fundament + medlemskap + RLS-hjelpefunksjon (P1-a).
2. `risk_model` med versjonering, immutability-trigger og sammensatte FK-er (P1-a, P1-b).
3. Godkjenningsfunksjon + skille mellom agent og menneske som principal + audit-log (P1-c).
4. `risk` (risk_model_id, register_state, template_key) + hendelsesbibliotek i kode.
5. Migrering av eksisterende risikodata. Stram deretter inn de åpne «true»-policyene på tilstøtende tabeller.
6. Agentverktøy (kun utkast) i MCP, deretter UI.
7. Negative tester: kryss-tenant-referanse, endring etter vedtak, agent forsøker å godkjenne. Alle skal feile.

## 5) Beslutninger
CEO/eier:
- Skal vi bli på dagens plattform (anbefalt) eller bevisst flytte til Azure? Det er en strategisk beslutning om kostnad og dataresidens, ikke en detalj.
- Hvem kan vedta en risikomodell (rolle), og kreves det to godkjennere?
- Tenant-modellen: er en MSP-partner egen org med tilgang til kundeorg-er?
- Oppbevaringstid for audit og om kunder skal kunne eksportere den.
- Skal standard risikomodell leveres av Mynder, eller skal hver kunde lage sin egen?

Teknisk team:
- Tabell- og JSON-skjemadesign, FK-strategi, trigger- og funksjonsdesign.
- Hvordan agent-principal representeres (token-claim eller egen rolle).
- Migrasjonsplan og testoppsett.
- Om hendelsesbibliotekets versjon lagres på hver risk (anbefalt: `template_version`).
