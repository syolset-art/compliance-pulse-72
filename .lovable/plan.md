# Plan: Guidet integrasjonsflyt med ekstern aktør-støtte

## Oversikt

Utvide integrasjonsflyten til å støtte:
1. **Guidet spørsmål** før API-nøkkel (som Lovable)
2. **Ulike aktørtyper** som kan utføre integrasjonen
3. **Gjestekonto-invitasjon** for eksterne (IT-leverandør, regnskapsfører)
4. **Audit log** for revisjon av hvem som utførte integrasjonen

## Arkitektur (basert på diagram)

```
┌─────────────────┐     ┌─────────────────┐
│   IT-leverandør │     │    Kunden selv  │
│      (MSP)      │     │ (egen Acronis)  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│         Mynder Integrasjonsflyt         │
│  ┌───────────────────────────────────┐  │
│  │  Hvem utfører integrasjonen?      │  │
│  │  • Jeg selv (admin)               │  │
│  │  • IT-leverandør/MSP              │  │
│  │  • Regnskapsfører                 │  │
│  │  • Intern IT-ansvarlig            │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│    Tekniske kilder    Forretningskilder │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ Acronis │  │ Entra   │  │UniMicro │  │
│  │  (IT)   │  │  (IT)   │  │(Regnsk.)│  │
│  └─────────┘  └─────────┘  └─────────┘  │
└─────────────────────────────────────────┘
```

## Database-skjema

### 1. Ny enum: `integration_performer_role`

```sql
CREATE TYPE integration_performer_role AS ENUM (
  'it_provider',      -- IT-leverandør/MSP
  'accountant',       -- Regnskapsfører
  'internal_it',      -- Intern IT-ansvarlig
  'owner'             -- Kunden selv
);
```

### 2. Ny tabell: `integration_performers`
Lagrer informasjon om hvem som kan utføre integrasjoner (gjester).

```sql
CREATE TABLE integration_performers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES company_profile(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role integration_performer_role NOT NULL,
  organization_name TEXT,        -- F.eks. "Hult IT AS"
  invite_token TEXT UNIQUE,      -- Sikker token for invitasjon
  invite_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'invited', -- invited, active, revoked
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  created_by TEXT                -- E-post til den som inviterte
);
```

### 3. Ny tabell: `integration_audit_log`
Revisjonssporing for alle integrasjonshandlinger.

```sql
CREATE TABLE integration_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integration_connections(id) ON DELETE CASCADE,
  performer_id UUID REFERENCES integration_performers(id),
  action TEXT NOT NULL,          -- 'created', 'api_key_added', 'synced', 'revoked'
  performed_by_email TEXT,
  performed_by_name TEXT,
  performed_by_role integration_performer_role,
  performed_by_organization TEXT,
  details JSONB,                 -- Ekstra info
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. Oppdater: `integration_connections`
Legg til referanse til hvem som satte opp.

```sql
ALTER TABLE integration_connections
ADD COLUMN setup_performer_id UUID REFERENCES integration_performers(id),
ADD COLUMN setup_completed_at TIMESTAMPTZ,
ADD COLUMN performer_role integration_performer_role;
```

## UI-flyt

### Steg 1: Velg integrasjonstype (eksisterende)
Bruker velger Acronis, Entra, UniMicro, etc.

### Steg 2: Velg hva som skal importeres (eksisterende)
Systemer, lokasjoner, nettverk, etc.

### Steg 3: NY - Hvem skal utføre integrasjonen?

```
┌──────────────────────────────────────────────────────────────┐
│  🔗 Hvem skal sette opp koblingen?                           │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  👤 Jeg gjør det selv                                    │ │
│  │     Jeg har admin-tilgang til Acronis                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  🏢 IT-leverandør / MSP                                  │ │
│  │     Send invitasjon til din IT-partner                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  📊 Regnskapsfører                                       │ │
│  │     For regnskapssystemer (UniMicro, Tripletex)         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  🔧 Intern IT-ansvarlig                                  │ │
│  │     Kollega med teknisk tilgang                          │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Steg 4a: Hvis "Jeg gjør det selv" → API-input (eksisterende)

### Steg 4b: Hvis ekstern aktør → Invitasjonsskjema

```
┌──────────────────────────────────────────────────────────────┐
│  📧 Inviter IT-leverandør                                    │
│                                                               │
│  Fyll ut informasjon om din IT-partner:                      │
│                                                               │
│  Firmanavn                                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Hult IT AS                                               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Kontaktperson (e-post)                                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ support@hult-it.no                                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Kontaktperson (navn)                                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Ola Nordmann                                             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ℹ️ Hva skjer videre?                                    │ │
│  │  1. Vi sender en e-post med invitasjonslenke            │ │
│  │  2. IT-leverandøren logger inn og legger til API-nøkkel │ │
│  │  3. Du får varsel når integrasjonen er klar             │ │
│  │  4. Alt dokumenteres for revisjon                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  [ Avbryt ]                        [ Send invitasjon 📧 ]   │
└──────────────────────────────────────────────────────────────┘
```

### Steg 5: Venteskjerm / Status

```
┌──────────────────────────────────────────────────────────────┐
│  ⏳ Venter på IT-leverandør                                  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Acronis                                                 │ │
│  │  Status: Invitasjon sendt                               │ │
│  │  Sendt til: support@hult-it.no                          │ │
│  │  Dato: 28. januar 2026                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  [ Send påminnelse ]  [ Kanseller invitasjon ]              │
└──────────────────────────────────────────────────────────────┘
```

## Gjestekonto-portal

Når ekstern aktør klikker på invitasjonslenken:

```
┌──────────────────────────────────────────────────────────────┐
│  🔐 Mynder - Integrasjonsoppsett                             │
│                                                               │
│  Du er invitert av Bedrift AS til å sette opp                │
│  Acronis-integrasjon.                                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  📧 Logg inn eller opprett konto                        │ │
│  │                                                           │ │
│  │  E-post: support@hult-it.no (forhåndsutfylt)            │ │
│  │  Passord: ********                                       │ │
│  │                                                           │ │
│  │  [ Logg inn ]                                            │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

Etter innlogging → Begrenset visning kun for integrasjonsoppsett.

## Revisjonsvisning

I integrasjonsdetaljer vises audit log:

```
┌──────────────────────────────────────────────────────────────┐
│  📋 Revisjonslogg for Acronis                                │
│                                                               │
│  28.01.2026 14:32 - Integrasjon opprettet                    │
│  Utført av: Kari Hansen (admin@bedrift.no)                   │
│                                                               │
│  28.01.2026 14:35 - Invitasjon sendt                         │
│  Til: Ola Nordmann (support@hult-it.no)                      │
│  Organisasjon: Hult IT AS                                    │
│  Rolle: IT-leverandør                                        │
│                                                               │
│  29.01.2026 09:15 - API-nøkkel lagt til                      │
│  Utført av: Ola Nordmann (support@hult-it.no)                │
│  Organisasjon: Hult IT AS                                    │
│  Rolle: IT-leverandør                                        │
│                                                               │
│  29.01.2026 09:16 - Første synkronisering fullført           │
│  12 enheter importert                                         │
└──────────────────────────────────────────────────────────────┘
```

## Implementeringsrekkefølge

### Fase 1: Database & Backend
- [ ] Opprett `integration_performer_role` enum
- [ ] Opprett `integration_performers` tabell med RLS
- [ ] Opprett `integration_audit_log` tabell med RLS
- [ ] Oppdater `integration_connections` med nye kolonner
- [ ] Edge function for å sende invitasjon
- [ ] Edge function for å validere invite token

### Fase 2: UI - Integrasjonsflyt
- [ ] Nytt steg "Hvem utfører integrasjonen?" i AddAssetDialog
- [ ] Invitasjonsskjema for eksterne
- [ ] Venteskjerm med status
- [ ] Påminnelses-funksjon

### Fase 3: Gjestekonto-portal
- [ ] Landingsside for invitasjonslenke
- [ ] Begrenset innlogging/registrering
- [ ] Forenklet integrasjonsoppsett-visning

### Fase 4: Revisjon & Oversikt
- [ ] Audit log visning i integrasjonsdetaljer
- [ ] Eksport av revisjonslogg
- [ ] Varsler ved statusendringer

## Filer som endres/opprettes

| Fil | Endring |
|-----|---------|
| `supabase/migrations/xxx_integration_performers.sql` | Nye tabeller |
| `src/components/dialogs/AddAssetDialog.tsx` | Nytt steg for aktørvalg |
| `src/components/integration/InvitePerformerForm.tsx` | NY: Invitasjonsskjema |
| `src/components/integration/IntegrationAuditLog.tsx` | NY: Revisjonsvisning |
| `src/components/integration/IntegrationStatus.tsx` | NY: Statusvisning |
| `src/pages/IntegrationSetup.tsx` | NY: Gjestekonto-portal |
| `supabase/functions/send-integration-invite/index.ts` | NY: Send invitasjon |
