
# Aktivitetslogg (kontekstbevisst)

Ny side under Innstillinger som viser hvem som gjorde hva, når. Innholdet speiler alltid aktiv kontekst: **Egen virksomhet** eller **Partner-visning**. Ett hendelseslager, flere views.

## Kontekstmodell

Ett sentralt hendelseslager, filtrert av aktiv workspace-kontekst (samme mekanisme som resten av appen bruker for å skille kunde-/partnerdata).

- **Egen virksomhet** (`/settings/activity-log`): kun hendelser for eget `company_id`. Aktør = intern bruker eller Lara. Ingen partner-metadata vises.
- **Partner-visning** (`/partner/activity-log`): hendelser på tvers av partnerens kunder, pluss partnerens egne handlinger. Rader viser hvilken kunde hendelsen gjelder + om aktøren var kunde eller partner-konsulent.
- Bytte av kontekst i global context-switcher bytter automatisk datasett og rutens brødsmuler — ingen egen toggle på siden.
- Kunde ser aldri partnerens interne handlinger som ikke er relevante for kunden; partner ser kundens hendelser kun for kunder de har tilgang til (RLS via `msp_customers` + `has_role`).

Referanse: brukerens skisse — "Ett hendelseslager" med visningene "På objektet", "På partneren", "Samlet logg" (kunde) og "Hos partner" (partner på tvers).

## UI

Én tidslinje-side, samme komponent begge kontekster. Forskjeller styres av `context`-prop.

- Topplinje: tittel + kontekst-chip ("Egen virksomhet" / "Partner: [navn]")
- Filterrad: søk, kategori (Ressurser, Samsvar, Brukere/Abonnement, AI/Lara), tidsrom, aktør. I partner-visning: også **Kunde**-filter.
- Rader: aktør-avatar, handlingstekst, relativ tid, klikk → relatert ressurs
  - Partner-visning legger til liten kunde-etikett til venstre og et ikon for aktør-type (kunde / partner-konsulent / AI)
- Paginering 50 av gangen, "Last flere"

## Datakilde (kombinert)

Aggregert visning nå + ny sentral tabell for nye hendelser.

- Aggregert fra eksisterende: `assets`, `systems`, `asset_priority_history`, `requirement_status`, `vendor_documents`, `evidence_checks`, `user_roles`, `company_subscriptions`, `credit_transactions`, `lara_suggestion_states`, `process_agent_recommendations`
- Ny tabell for nye hendelser (se under)

## Teknisk

**Ny tabell** `public.activity_log`:
- `id uuid pk`, `created_at timestamptz default now()`
- `company_id uuid` — kunden hendelsen gjelder (alltid satt)
- `partner_id uuid null` — satt når handling utført i partner-visning
- `actor_id uuid null`, `actor_type text` ('customer_user' | 'partner_user' | 'ai' | 'system')
- `action text`, `category text` ('resource' | 'compliance' | 'account' | 'ai')
- `resource_type text`, `resource_id uuid`, `resource_label text`
- `metadata jsonb`
- Indekser: `(company_id, created_at desc)`, `(partner_id, created_at desc)`, `category`
- RLS:
  - Egen virksomhet: `company_id = <brukerens company>`
  - Partner: `partner_id = <partner>` OG kunden er i partnerens `msp_customers`
  - `super_admin` ser alt
- GRANT `SELECT, INSERT` til `authenticated`, `ALL` til `service_role`

**Frontend**:
- `src/pages/settings/ActivityLog.tsx` — egen virksomhet
- `src/pages/partner/PartnerActivityLog.tsx` — partner-visning (samme komponent, `context="partner"`)
- `src/components/activity-log/ActivityFeed.tsx`, `ActivityRow.tsx`, `ActivityFilters.tsx`
- `src/hooks/useActivityFeed.ts` — leser aktiv kontekst fra eksisterende workspace-context, henter og fletter fra `activity_log` + aggregerte kilder
- `src/lib/activityLog.ts` — helper `logActivity({ action, category, resource, metadata })` som setter `company_id`/`partner_id` fra aktiv kontekst automatisk
- Menypunkt: "Aktivitetslogg" i Innstillinger (egen virksomhet) og i Partner-innstillinger (partner)

**Instrumentering (fase 1)**: kall `logActivity` fra modul-/nivåendringer i `Subscriptions.tsx`, Lara-forslag godtatt/avvist, rolleendringer. Resten dekkes av aggregering til de får eksplisitt logging.

## Utenfor scope

- Eksport (CSV/PDF)
- Varsler/webhooks
- Full backfill av historiske hendelser før tabellen finnes
