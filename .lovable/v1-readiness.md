# Mynder v1 — Lovable Cloud-backend: beslutningsgrunnlag

_Sjekk utført 26. juni 2026. Read-only. Ingen endringer er gjort i database, edge functions eller auth-konfigurasjon._

---

## 1. Sammendrag

| Område | Status | Kort |
|---|---|---|
| Plattformhelse (DB, ressurser) | 🟢 Grønn | 19,6 MB data, 4 % disk, 60 % minne, 15/60 connections. Ingen restart, ingen treghet. |
| Plattformkapasitet for pilot (3–10 betalende kunder) | 🟢 Grønn | Lovable Cloud kjører Postgres + PgBouncer + storage. Mer enn nok for pilotvolum. |
| Auth-grunnmur | 🟡 Gul | E-post + Google er tilgjengelig, men onboarding-flyt (invitasjoner, org-tilhørighet, e-postbekreftelse, reset-side) er ikke produksjonsmoden. |
| Filopplasting (storage-buckets) | 🟢 Grønn (per bruker) / 🟡 Gul (per org) | Per-bruker isolasjon fungerer (`storage.foldername(name)[1] = auth.uid()`). Ingen org-/partner-scoping ennå. |
| **Tilgangskontroll på data (RLS)** | 🔴 **Rød** | 46 av 187 policies er `USING (true) WITH CHECK (true)` — dvs. ingen kontroll. 59 av 81 tabeller mangler tenant-kolonne, så multi-tenant isolasjon eksisterer ikke i databasen. |
| Multi-tenant (MSP partner ↔ kunde) | 🔴 **Rød** | Ingen `org_id` / `partner_id` på sentrale tabeller (assets, vendor_documents, tasks, lara_inbox, msp_*). Enhver innlogget bruker kan i prinsippet lese alle andre kunders data. |
| Edge functions | 🟡 Gul | 33 funksjoner. 16 bruker `SERVICE_ROLE_KEY` — alle kjører med `verify_jwt = false` og må validere bruker selv i kode. Få av dem gjør det i dag. |
| Demo-data | 🟡 Gul | Demo-seed lever i `src/lib/demoSeed*` og kjøres klient-side. Ikke skadelig i seg selv, men må skjules bak en `demo_enabled`-bryter før prod. |
| Lint-/sikkerhetsskanner | 🔴 Rød | 99 sikkerhetsfunn, 79 lint-advarsler — alle henger sammen med RLS-problemet over. |

---

## 2. Anbefaling: 🟡 **GUL — kjør videre med Lovable Cloud, men med strammere v1-scope**

**Du trenger ikke flytte backend til Azure/Postgres/API.** Det Lovable Cloud leverer (Postgres, RLS, auth, storage, edge functions, AI Gateway) er teknisk det du trenger for en betalt pilot. Problemet er ikke plattformen — det er at databasen ble lagd som demo, ikke som produkt.

Det du har i dag er en **prototype med åpen database bak et innlogget UI**. Det er ikke et v1-problem unikt for Lovable Cloud; samme problem ville fulgt med til Azure dersom du flyttet skjemaet uendret.

### Hvorfor ikke rød (flytt backend)
- Plattformen i seg selv er stabil og rask nok.
- Storage-policies for filopplasting er korrekt mønster (per bruker), bare ikke utvidet til org.
- Auth, e-post, AI Gateway og credits er på plass — flytting hadde tatt 4–8 uker bare å gjenskape.

### Hvorfor ikke grønn (kjør v2-plan direkte)
- 46 "alle får alt"-policies + 59 tabeller uten tenant-kolonne betyr at en hardning er **ikke en patch — det er en datamodelloperasjon**.
- 16 edge functions bruker service_role uten å verifisere bruker. Hver må gjennomgås før den kan eksponeres for ekte kunder.
- Demo-data må flagges av før første betalende kunde slipper inn.

### Konkret anbefaling for en strammere v1
Kutt scope til **én brukermodus om gangen** for å redusere RLS-arbeidet:

1. **v1.0 — Trust Center for én organisasjon (ikke MSP)**: én bedrift logger inn, ser sine data. Krever bare `org_id` på 20–25 tabeller, ikke 80. 2–3 uker arbeid.
2. **v1.1 — MSP-partnerlag på toppen** kommer i neste iterasjon når Trust Center-stacken er hard.

Dette gir betalt pilot på 4 uker uten å rive ned partnerkoden — den blir bare ikke eksponert offentlig før den er sikret.

---

## 3. Topp 10 kritiske funn

| # | Funn | Konsekvens | Plassering |
|---|---|---|---|
| 1 | 46 policies med `USING (true) WITH CHECK (true)` på sentrale tabeller (assets, company_profile, employee_*, framework_*, ai_*) | Enhver innlogget bruker kan lese/skrive andres data | `pg_policies WHERE policyname LIKE 'Allow all access%'` |
| 2 | `assets`, `vendor_documents`, `tasks`, `lara_inbox` har **ingen** tenant-kolonne | Kan ikke skille kundedata uten skjemaendring | `information_schema.columns` |
| 3 | `evidence_checks` har eksplisitte anon INSERT/UPDATE/DELETE-policies | Uautentisert kan endre evidence-data via API | `pg_policies` |
| 4 | 16 edge functions bruker `SERVICE_ROLE_KEY` og `verify_jwt=false` | Bypasser RLS uten å sjekke hvem som ringer | `supabase/functions/*/index.ts` (grep) |
| 5 | `mynder-me-api` aksepterer `x-employee-token` som ren bearer i header | Token-lekkasje = full lesetilgang | `supabase/functions/mynder-me-api/index.ts` |
| 6 | Storage `vendor-documents` og `documents` scoper kun per `auth.uid()`, ikke per org | Når team-funksjoner introduseres kan kollegaer i samme org ikke dele filer | `pg_policies storage.objects` |
| 7 | `user_roles` finnes med `has_role()`-funksjon, men brukes nesten ingen steder i policies | Roller har ingen reell effekt på datatilgang i dag | `pg_policies WHERE qual LIKE '%has_role%'` |
| 8 | Klient-side demo-seed kjører via `localStorage`-flagg, ikke server-side | Ekte og demo-data kan blandes i samme org | `src/contexts/DemoSyncContext.tsx`, `src/lib/demoSeed*.ts` |
| 9 | Ingen `delete_account` / GDPR-sletterutine | Kan ikke svare på rettighetshenvendelser | (mangler) |
| 10 | Reset-passord-side mangler (`/reset-password`) | Glemt-passord-e-post logger brukeren rett inn uten å bytte | `src/pages/Auth.tsx` |

---

## 4. Plattformhelse — detaljer

```
Database:   up
PgBouncer:  up
Restarts:   0 (since boot)
Memory:     60 % (av instans)
Data disk:  4 % (19,6 MB brukt)
Connections: 15 / 60        (lav)
Pool clients: 1 / 200       (lav)
WAL size:   96 MB           (normalt for en aktiv prosjekt-DB)
Region:     eu-west-1
```

**Tolkning:** Du har masse hodeplass. Pilotvolum (3–10 partnere, ~50 kunder, ~5 000 dokumenter) treffer ikke takene i nærheten. Skalering er ikke et beslutningskriterium for å flytte backend nå.

Treigste spørringer er alle korte (< 2 ms snitt) — ingen reelle ytelsesproblemer. De fleste er åpenbare PostgREST-spørringer fra dashboardet og kan optimaliseres senere med indekser hvis nødvendig.

---

## 5. Inventar (utdrag — full liste i database)

**Tabeller:** 81 i `public`. 0 uten RLS. 187 policies totalt.

**Edge functions (33):**
```
analyze-doc-gap, analyze-document, analyze-process-agent-fit, analyze-vendor,
analyze-vendor-gap, chat, check-document-expiry, check-evidence-freshness,
classify-deviation, classify-document, classify-evidence-document,
classify-framework-doc, discover-trust-sources, fetch-7security-data,
generate-work-area-document, lookup-system, mynder-me-api, push-vendor-incidents,
suggest-ai-features, suggest-ai-purpose, suggest-assets, suggest-baseline-answers,
suggest-company-description, suggest-deviations, suggest-key-contacts,
suggest-process-risk, suggest-processes, suggest-system-risk,
suggest-vendor-category, suggest-vendor-data-types, suggest-vendor-processes,
suggest-work-area-assets, sync-acronis
```

**Storage-buckets:**
- `documents` (privat) — scope per `auth.uid()` ✅
- `vendor-documents` (privat) — scope per `auth.uid()` ✅
- `company-logos` (offentlig) ✅ tilsiktet

---

## 6. Kostnads- og driftsbilde

- **Lovable Cloud-prising** følger forbruk (DB-størrelse, AI-kall via gateway, storage, edge-invocations). Pilotvolum er innenfor de minste tierene.
- **Backup:** automatisk i Lovable Cloud (point-in-time recovery håndteres av plattform). Du trenger en intern rutine for å verifisere restore, men trenger ikke bygge egen backup.
- **Skalering ved vekst:** Lovable Cloud lar deg oppgradere instans (Cloud → Advanced settings) når connections/minne nærmer seg tak. Du er langt unna i dag.
- **Egen Azure/Postgres ville lagt til:** managed Postgres-drift, egen auth (Azure AD B2C eller Supabase self-host), egen edge runtime, egen filstore med signed URLs, egen monitoring. Realistisk 4–8 ukers reimplementering for samme funksjon — uten å fjerne RLS-problemet, som ville fulgt med.

---

## 7. Hvis du går videre med Lovable Cloud — neste steg

Forslag til neste fase (kun til diskusjon — ikke godkjent):

1. **Datamodell-konsolidering** (1 uke): legg til `org_id` på de 20–25 tabellene Trust Center faktisk bruker. Bygg `organizations` + `organization_members`.
2. **RLS-omskriving** (1 uke): erstatt alle `Allow all access` med `EXISTS (SELECT 1 FROM organization_members WHERE user_id=auth.uid() AND org_id=table.org_id)` via security-definer-funksjon.
3. **Edge function-revisjon** (3–4 dager): hver service_role-funksjon validerer JWT og henter `auth.uid()`.
4. **Demo-modus bak flagg** (2 dager): `demo_enabled` på org-nivå, seedingen kjører bare når flagget er på.
5. **Auth-flyt** (3 dager): invitasjon, e-postbekreftelse på, `/reset-password`-side.

Estimat samlet: **3 uker fokusert arbeid** til betalt pilot for Trust Center single-org. MSP-laget kommer separat etter.

---

## 8. Hvis du vil flytte backend ut likevel

Da må disse reimplementeres:
- 81 tabeller + indekser + constraints i ny Postgres
- 33 edge functions i Node/.NET/Python
- Auth (Azure AD B2C eller egen)
- Storage med signed URLs (Azure Blob)
- AI-rute (egen wrapper rundt OpenAI/Gemini, du mister Lovable AI Gateway-kredittene)
- Frontend må peke på nye URL-er og kontrakter

Estimat: **6–10 uker** før du er der du er i dag — og RLS-/multi-tenant-arbeidet kommer i tillegg.

---

## Konklusjon
Backenden er teknisk levedyktig for pilot. Hovedrisikoen er datamodell og policies, ikke plattformvalg. Min anbefaling er **fortsett på Lovable Cloud, men krymp v1 til Trust Center single-org først**.
