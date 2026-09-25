# ARK-RISIKO-01 / issue #148 – implementeringsklar plan

Forbehold: issue #148 (Mynder-AS/daling-1.0) er privat og kunne ikke leses herfra (GitHub svarer 404). Det finnes heller ingen kanoniske ADR-/invariant-filer i dette prosjektet. Planen bygger derfor på issue-teksten slik den er gjengitt i chat og på faktisk kode og database. Sjekk den mot akseptansekriteriene i #148 før bygging.

## Status i dag (verifisert)
- Core bruker Postgres med RLS (Lovable Cloud), ikke Azure SQL.
- Det finnes ingen org_id-tenantmodell. `company_profile` brukes som «organisasjon», og aktiv org velges i klienten (`ActiveOrganizationContext`, localStorage).
- Risiko- og avvikstabellene (`process_risk_scenarios`, `system_risk_assessments`, `system_incidents`, `systems`, `integration_audit_log`) har policy `true` for public.
- Core MCP (`src/lib/mcp`) autentiserer agenter med OAuth-token fra Core auth. `supabaseForUser(ctx)` kjører som brukeren. En agent har altså i dag samme `auth.uid()` som mennesket den handler for. Dette er kjernen i P1-c.
- `agent_access_tokens` (hashet personlig kode, eier-RLS) finnes allerede.
- Mynder Agents er en egen runtime (MCP «Mynder Agents»: agents, playbooks, runs, evidence, `get_pending_approvals`, `decide_approval`, `auto_approve_rules`). Agentpolicy og agentstyring i Core-UI lagres bare i localStorage og håndheves ikke.

## Konklusjon
Støtt domenemodellen og endre plattformen: Core i Postgres er kanonisk for RiskModel og Risk. Mynder Agents får ingen egen RiskModel. P1-a, P1-b og P1-c er reelle og blokkerer vedtaksfunksjonen til de er løst. Ingen av punktene krever CEO. Se «Beslutninger».

## 1) Eierskap
Core eier:
- `risk_model` (versjoner, JSON-skalaer, vedtak) og `risk` (register_state, template_key, template_version).
- Hendelsesbiblioteket (versjonert i kode).
- Tenant, medlemskap, roller og godkjennerrett.
- Vedtaksfunksjonen, immutability og audit-loggen.

Mynder Agents eier:
- Agentidentitet, playbooks, kjøringer, evidens fra kjøringer og sin egen godkjenningskø for agenthandlinger.
- Agents lagrer bare referanser (`core_org_id`, `risk_id`, `draft_id`, `run_id`), aldri kopi av modellen.

Grensen:
- Agents kan lese modellen og opprette eller endre utkast via Core-kontrakten.
- Vedtak skjer bare i Core av et menneske. `decide_approval` i Agents gjelder agentens handlinger og kan aldri vedta en risikomodell.

## 2) Capability/API-kontrakt (provider-uavhengig)
Kontrakten er versjonert: `risk.v1`. Den eksponeres som MCP-verktøy i Core MCP og som en edge function med samme skjema, slik at Claude, ChatGPT, Copilot og Agents-runtime bruker samme kontrakt.

| Capability | Agent | Menneske | Merknad |
|---|---|---|---|
| `risk_model.get` / `list` | ja | ja | leser alltid én org |
| `risk_model.propose_draft` | ja | ja | lager ny utkastversjon |
| `risk_model.update_draft` | ja | ja | kun når status = draft |
| `risk_model.submit_for_approval` | ja | ja | setter status til pending |
| `risk_model.approve` / `reject` | nei | ja, med godkjennerrolle | eksponeres ikke som MCP-verktøy |
| `risk.list` / `propose` / `update_draft` / `set_register_state` | ja | ja | kun for utkast og longlist |
| `risk.audit.list` | ja | ja | kun lesing |

- Hvert kall bærer `org_id`, `idempotency_key`, `reason` og `provenance` (`agent_run_id`, modell/leverandør som fritekst-metadata, ikke logikk).
- Svar bruker enhetlige feilkoder: `CROSS_TENANT`, `IMMUTABLE`, `SELF_APPROVAL_FORBIDDEN`, `ACTOR_NOT_HUMAN`, `SCHEMA_INVALID`.

## 3) Gjenbruk av tenant, RLS, audit og fullmakt
- Tenant: `company_profile.id` brukes som `org_id` (ingen ny org-tabell). Nytt: `organization_members(org_id, user_id, role)` og `is_org_member(org_id)` / `has_org_role(org_id, role)` som security definer. Mønsteret følger `has_role`.
  - MSP-tilgang: partnerbrukere får medlemskap med rollen `partner_delegate` i kundeorgen. Aktiv org i klienten blir bare et filter; serveren håndhever tilgangen.
- Tenant-sikre FK-er: `UNIQUE(org_id, id)` på foreldretabeller og sammensatte FK-er `(org_id, risk_model_id)`, `(org_id, scope_id)`, `(org_id, policy_id)`.
- Immutability: en `BEFORE UPDATE/DELETE`-trigger på `risk_model` avviser endringer når `status IN ('approved','superseded')`. Unntaket er at status kan gå fra approved til superseded via vedtaksfunksjonen. Triggeren gjelder alle roller. Én aktiv approved per (org_id, scope_id), via partial unique index.
- Actor og fullmakt (P1-c):
  - En `actor_context()`-funksjon avleder `actor_type` fra JWT-claims. OAuth-klient-tokens (`client_id` finnes) og `agent_access_tokens` gir `agent`. En vanlig nettleserøkt gir `human`.
  - `approve_risk_model(id)` er security definer. Den krever `actor_type = 'human'` og `has_org_role(org_id,'risk_approver')`, og at godkjenneren ikke er `created_by`/`submitted_by` for versjonen (ingen selvgodkjenning). `approved_by`, `approved_at` og `content_hash` settes av serveren.
  - Klienten får ikke UPDATE-rett på `status` eller `approved_*`. Dette håndheves både med kolonne-grants og med triggeren.
  - Fullmakten gjenbruker `agentMandate.ts` som visning. Håndhevelsen flyttes til serveren (`agent_mandates` på sikt, ikke i denne leveransen).
- Audit: ny append-only `risk_audit_log` (org_id, entity, entity_id, action, actor_id, actor_type, agent_run_id, before, after, at), fylt av triggere. Kun INSERT. `integration_audit_log` gjenbrukes ikke, fordi den har en åpen `true`-policy.

## 4) Testmatrise (SQL/pgTAP og e2e i `e2e/`)
| # | Scenario | Forventet |
|---|---|---|
| T1 | Bruker i org A leser eller skriver risk_model i org B | 0 rader / `CROSS_TENANT` |
| T2 | Risk i org A peker på risk_model i org B | FK-feil |
| T3 | scope_id / policy_id fra en annen org | FK-feil |
| T4 | MSP-delegat uten medlemskap leser kundeorg | 0 rader |
| T5 | UPDATE eller DELETE på approved-versjon (klient, service_role, agent) | `IMMUTABLE` |
| T6 | Endring av approved skjer via ny versjon | ny rad, supersedes_id satt, gammel blir superseded |
| T7 | To samtidige approve på samme scope | én lykkes (unik indeks) |
| T8 | Agenttoken kaller approve (MCP og REST) | `ACTOR_NOT_HUMAN` |
| T9 | Menneske godkjenner egen innsendt versjon | `SELF_APPROVAL_FORBIDDEN` |
| T10 | Klient setter `approved_by` eller `status` direkte | avvist |
| T11 | Agent oppretter eller endrer utkast | ok, audit med actor_type=agent |
| T12 | Audit UPDATE eller DELETE | avvist |
| T13 | Ugyldig JSON i skalaer eller matrise | `SCHEMA_INVALID` |
| T14 | Samme idempotency_key sendes to ganger | én effekt |

## 5) Filer, RFC og ADR
Nye:
- `docs/adr/0001-core-kanonisk-for-risikomodell.md`: Core eier og Agents refererer. Postgres, ikke Azure SQL.
- `docs/adr/0002-tenant-modell-org-id.md`: company_profile som org, medlemskap, sammensatte FK-er.
- `docs/adr/0003-actor-type-og-menneskelig-vedtak.md`: P1-c, ingen selvgodkjenning.
- `docs/rfc/risk-capability-contract-v1.md`: kontrakten over med skjema og feilkoder.
- `docs/invariants.md`: I1 tenant-isolasjon, I2 approved er uforanderlig, I3 bare mennesker vedtar, I4 audit er append-only.
- Migrasjoner, i rekkefølge: (a) organization_members og helper-funksjoner, (b) risk_model, risk, triggere og audit, (c) approve/reject-funksjonene.
- `src/lib/risk/eventLibrary.ts` (hendelsesbibliotek v1) og `src/lib/risk/schemas.ts` (zod for JSON-feltene, samme skjema som valideringstriggeren).
- `src/lib/mcp/tools/risk_*.ts` (get, list, propose_draft, update_draft, submit, risk.*). Ingen approve-verktøy.
- `supabase/functions/risk-api/index.ts` (samme kontrakt for Agents-runtime).
- `supabase/tests/risk_*.sql` (T1–T14) og `e2e/risk-approval.spec.ts`.

Endres:
- `src/lib/mcp/index.ts`: registrere de nye verktøyene og instruksjonene.
- `src/lib/mcp/supabase.ts`: videresende actor-kontekst.
- `create-agent-code`: markere tokenet som agent-principal.
- `ActiveOrganizationContext`: bare et filter.
- `.lovable/mcp/manifest.json`.

Senere, egen leveranse: migrering av `process_risk_scenarios` til `risk` og innstramming av `true`-policyene på tilstøtende tabeller.

## Rekkefølge
1. ADR 0001–0003, invariants og RFC.
2. Tenant-migrasjon og T1–T4.
3. risk_model og risk med immutability og audit, og T5–T7, T12–T13.
4. Actor-kontekst og approve/reject, og T8–T10.
5. Kontrakt (MCP og edge function) og T11, T14.
6. Minimal UI for godkjenning i Core.
7. Datamigrering og policy-innstramming.

## Beslutninger
Ingen materiell produktbeslutning blokkerer. Tekniske valg er tatt over: Postgres, company_profile som org, actor_type fra claims og ingen approve via MCP. Det eneste som kan endre plattformvalget er en eventuell strategisk flytting til Azure. Den er ikke forutsatt her.
