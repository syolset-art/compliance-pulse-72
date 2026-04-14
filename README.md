# Mynder – Compliance & Governance Platform

Mynder er en norsk SaaS-plattform for compliance, personvern (GDPR), informasjonssikkerhet, AI-governance og bærekraft. Plattformen hjelper virksomheter med å etterleve regulatoriske krav som GDPR, ISO 27001, NIS2, EU AI Act og ESG-rapportering.

## Teknologistakk

- **Frontend:** React 18, TypeScript 5, Vite 5
- **Styling:** Tailwind CSS v3 med shadcn/ui-komponenter
- **State management:** TanStack React Query
- **Routing:** React Router v6
- **Internasjonalisering:** i18next (norsk bokmål + engelsk)
- **Tema:** next-themes (lys/mørk modus)
- **Backend:** Supabase (Lovable Cloud) – database, auth, edge functions, storage
- **Design tokens:** HSL-baserte CSS-variabler i `src/index.css`, Tailwind-config i `tailwind.config.ts`

## Mappestruktur

```
src/
├── assets/              # Bilder og statiske filer
├── components/          # React-komponenter
│   ├── ui/              # shadcn/ui base-komponenter (Button, Card, Dialog, etc.)
│   ├── dashboard-v2/    # Dashboard-widgets og -layout
│   ├── vendor-dashboard/# Leverandørstyring (TPRM)
│   ├── trust-center/    # Trust Center (offentlig compliance-profil)
│   ├── msp/             # MSP Partner Portal
│   ├── compliance/      # Compliance-oversikt, rammeverk, sjekklister
│   ├── ai-registry/     # AI-systemregister (EU AI Act)
│   ├── asset-profile/   # Systemkort / behandlingsoversikt
│   ├── customer-requests/ # Kundeforespørsler
│   ├── onboarding/      # Onboarding-wizard
│   ├── reports/         # Rapportering
│   ├── shared/          # Felles komponenter (PageHeader, StatusBadge, etc.)
│   ├── tasks/           # Oppgavehåndtering
│   ├── work-areas/      # Arbeidsområder
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Autentisering
│   ├── useUserRole.ts   # Rollestyring (15 roller)
│   └── ...
├── integrations/
│   └── supabase/        # Auto-generert Supabase-klient og typer (IKKE REDIGER)
├── lib/                 # Hjelpefunksjoner
├── locales/             # Oversettelsesfiler (nb/en)
├── pages/               # Sider (React Router routes)
├── utils/               # Utility-funksjoner
├── index.css            # Design system (CSS-variabler, utility-klasser)
├── App.tsx              # Hovedapp med routing
└── main.tsx             # Entrypoint
```

## Rollesystem

Plattformen har 15 brukerroller som styrer navigasjon og dashboard-innhold:

| Rolle (kode)           | Norsk navn                        |
|------------------------|-----------------------------------|
| `super_admin`          | Superbruker                       |
| `daglig_leder`         | Daglig leder                      |
| `personvernombud`      | Personvernombud (DPO)             |
| `sikkerhetsansvarlig`  | Sikkerhetsansvarlig (CISO)        |
| `compliance_ansvarlig` | Compliance-ansvarlig              |
| `ai_governance`        | AI Governance-ansvarlig           |
| `operativ_bruker`      | Operativ bruker                   |
| `risk_owner`           | Risikoeier                        |
| `internal_auditor`     | Internrevisor                     |
| `esg_officer`          | Bærekraftsansvarlig (ESG)         |
| `incident_manager`     | Hendelsesansvarlig                |
| `system_owner`         | Systemeier                        |
| `training_officer`     | Opplæringsansvarlig               |
| `vendor_manager`       | Leverandøransvarlig               |
| `it_manager`           | IT-ansvarlig                      |

Rollene er definert i `src/hooks/useUserRole.ts`. I demo-modus lagres aktiv rolle i localStorage.

## Hovedmoduler / sider

- **Dashboard** (`/`) – Rollebasert oversiktspanel med widgets
- **Compliance-oversikt** (`/compliance`) – Status for rammeverk (GDPR, ISO, NIS2)
- **Systemer** (`/systems`) – Register over IT-systemer og databehandlere
- **Behandlingsoversikt** (`/processing-records`) – GDPR Art. 30 protokoll
- **Leverandørstyring** (`/vendors`) – TPRM, risikovurdering av leverandører
- **AI-register** (`/ai-registry`) – EU AI Act-register for AI-systemer
- **Avvikshåndtering** (`/deviations`) – Hendelser og avvik
- **Oppgaver** (`/tasks`) – Oppgavestyring med frister og ansvarlige
- **Rapporter** (`/reports`) – Generering av compliance-rapporter
- **Trust Center** (`/trust-center/*`) – Offentlig compliance-profil for kunder
- **Bærekraft** (`/sustainability`) – ESG-rapportering
- **MSP Portal** (`/msp/*`) – Partnerportal for IT-leverandører
- **Innstillinger** (`/settings`, `/company-settings`) – Personlige og bedriftsinnstillinger
- **Kundeforespørsler** (`/customer-requests`) – Håndtering av compliance-forespørsler
- **Onboarding** (`/onboarding`) – Veiviser for nye brukere

## Design System

- **Farger:** HSL-baserte semantiske tokens (`--primary`, `--background`, `--muted`, etc.)
- **Primærfarge:** Lilla/purple (`270 45% 35%` lys, `270 40% 70%` mørk)
- **Komponenter:** shadcn/ui med egendefinerte varianter
- **Utility-klasser:** `glass-card`, `shadow-luxury`, `hover-lift`, `transition-silk`
- **Responsivt:** Mobile-first med Tailwind breakpoints
- **Tilgjengelighet (UU):** Viktig fokusområde – semantisk HTML, god kontrast, lesbar tekststørrelse

## Viktige regler

1. **ALDRI rediger** `src/integrations/supabase/client.ts` eller `types.ts` – disse er auto-generert
2. **ALDRI rediger** `.env` – denne oppdateres automatisk
3. Bruk semantiske design tokens, ikke hardkodede farger
4. All tekst skal støtte norsk (bokmål) og engelsk via i18next
5. Roller lagres i `user_roles`-tabell, ALDRI i profiltabellen
6. RLS-policyer kreves på alle tabeller med brukerdata

## Utvikling

```sh
npm i
npm run dev
```

## Lovable

Prosjekt-URL: https://lovable.dev/projects/beb5a963-0989-4df9-a1e4-a1d4eea260d3
