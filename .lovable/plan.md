

# Mynder Me - Agent API for ansatte

## Konsept

Mynder Me er en personlig AI-agent-app for ansatte som kobler seg til virksomhetens Mynder-plattform. Appen gir ansatte innsyn i personvern, sikkerhet og AI-politikk, og hjelper dem med compliance i hverdagen.

### Verdi for compliance-ansvarlig
- Automatisk distribusjon av policyer og oppdateringer til alle ansatte
- Sporbar gjennomforing av sikkerhetskurs (dokumenterbar compliance)
- Redusert manuelt arbeid - informasjon pushes automatisk
- Oversikt over hvem som har fullfort kurs, lest policyer, og godkjent samtykker
- Hendelseslogg som viser at ansatte ble varslet ved avvik

### Verdi for ansatte
- Personlig AI-agent som forklarer policyer pa et forstaelig sprak
- Automatisk varsling ved hendelser som pavirker dem
- Kontroll over egne personopplysninger og samtykker
- Phishing-beskyttelse og sikkerhetsrad
- Mandlige mikro-kurs tilpasset deres rolle

## Implementering i Mynder-plattformen

### Fase 1: API-lag (Edge Functions)

Opprette en `mynder-me-api` edge function som fungerer som gateway for Mynder Me-appen:

**Endepunkter (branching i en funksjon):**

| Handling | Beskrivelse |
|----------|-------------|
| `get-policies` | Henter aktive personvern- og sikkerhetspolicyer |
| `get-incidents` | Henter hendelser relevant for den ansatte |
| `get-courses` | Henter tilgjengelige mikro-kurs |
| `submit-course-completion` | Logger fullfort kurs |
| `get-consents` | Viser aktive samtykker og databehandlinger |
| `get-ai-systems` | Henter AI-systemer som pavirker den ansatte |

### Fase 2: Database

Nye tabeller:

**`employee_connections`** - Kobling mellom Mynder Me-app og virksomheten
- `id`, `company_id`, `employee_token` (anonymisert), `connected_at`, `status`
- Ingen persondata lagres pa virksomhetens side - bare en token

**`security_micro_courses`** - Sikkerhetskurs-bibliotek
- `id`, `title`, `title_no`, `content`, `content_no`, `duration_minutes`, `category`, `created_at`

**`course_completions`** - Sporingslogg
- `id`, `employee_token`, `course_id`, `completed_at`, `score`

**`employee_notifications`** - Meldinger til ansatte
- `id`, `company_id`, `type` (incident/policy_update/course_assignment), `title`, `content`, `severity`, `created_at`, `expires_at`

### Fase 3: Administrasjonsside

Ny side i Mynder: `/mynder-me` med:
- Oversikt over tilkoblede ansatte (anonymisert - kun antall)
- Kurs-administrasjon (opprett, tildel, se fullforingsrate)
- Varslings-senter (send ut meldinger til ansatte)
- Statistikk-dashboard: fullforingsrate, gjennomsnittlig responstid

### Fase 4: Sidebar-integrasjon

Legge til "Mynder Me" som menyvalg i sidebaren under en ny seksjon "Ansatte" med ikon.

## Teknisk oversikt

| Fil/Komponent | Endring |
|---------------|---------|
| `supabase/functions/mynder-me-api/index.ts` | Ny edge function - API gateway |
| Database-migrering | 4 nye tabeller med RLS |
| `src/pages/MynderMe.tsx` | Ny administrasjonsside |
| `src/components/mynder-me/` | Dashboard, kurs-admin, varslings-senter |
| `src/components/Sidebar.tsx` | Nytt menypunkt |
| `src/App.tsx` | Ny route `/mynder-me` |
| `src/locales/nb.json` og `en.json` | Oversettelser |

## Sikkerhet

- Ansatte autentiseres via token-basert system (ikke bruker-ID)
- Virksomheten ser kun aggregerte data, aldri individuelle ansatte
- Edge function validerer token for hvert kall
- RLS-policyer sikrer at kun autoriserte virksomheter kan opprette kurs og varsler

