

# Leverandor Trust Profile - Dokumentstyring og Lara Innboks

## Oversikt
Utvide Trust Profile med strukturert dokumenthandtering, gyldighet/versjon-sporing, en Lara-innboks for mottatt dokumentasjon, og grunnlag for kravmatching -- klart til demo i morgen.

## Endringer

### 1. Utvid vendor_documents-tabellen
Legg til kolonner for versjon, gyldighet, status og sporbarhet:
- `version` (text) - f.eks. "v1.0", "v2.1"
- `valid_from` (date) - gyldig fra
- `valid_to` (date) - gyldig til (utlopsdato)
- `status` (text) - "current", "expired", "pending_review", "superseded"
- `requested_at` (timestamptz) - nar dokumentet ble forespurt
- `received_at` (timestamptz) - nar det ble mottatt
- `reminder_sent_at` (timestamptz) - siste purring sendt
- `source` (text) - "manual_upload", "email_inbox", "vendor_portal"

### 2. Ny tabell: vendor_document_requests
For automatisert oppfolging (foresporsler, frister, purringer):
- `id`, `asset_id`, `document_type`, `requested_by`, `due_date`
- `status` ("pending", "received", "overdue", "cancelled")
- `reminder_count`, `last_reminder_at`, `notes`
- `created_at`

### 3. Ny tabell: lara_inbox
Laras innboks der innkommende dokumenter lander:
- `id`, `sender_email`, `sender_name`, `subject`, `received_at`
- `file_name`, `file_path` (storage ref)
- `matched_asset_id` (nullable - AI-foreslatt match)
- `matched_document_type` (nullable)
- `confidence_score` (float - AI-matchens sikkerhet)
- `status` ("new", "auto_matched", "manually_assigned", "rejected")
- `processed_at`, `processed_by`

### 4. Oppgradert DocumentsTab
Redesign med tre seksjoner:
- **Dokumentoversikt**: Tabell med kolonner for type, versjon, gyldig til, status (fargekodede badges), kilde
- **Foresporsler og purringer**: Aktive foresporsler med frist, status, og "Send purring"-knapp (demo-modus)
- **Last opp**: Behold eksisterende opplastingsfunksjonalitet med nye felter (versjon, gyldig fra/til)

### 5. Ny komponent: LaraInboxPanel
En innboks-visning tilgjengelig fra Trust Profile (og globalt):
- Liste over innkommende dokumenter med avsender, emne, tidspunkt
- AI-matchforslag: "Lara foreslaar: Koble til [Leverandornavn] som [Dokumenttype]"
- Godkjenn/Avvis-knapper for hver match
- Ved godkjenning: dokument flyttes til riktig Trust Profile automatisk
- Demo-data forhåndsutfylt med realistiske eksempler

### 6. Ny tab i Trust Profile: "Innboks"
Legg til en "Innboks"-tab som viser Lara-innboksen filtrert for den aktuelle leverandoren, med antall ventende dokumenter som badge.

### 7. Demo-data
Sett inn realistisk demodata:
- 3-5 dokumenter per leverandor (DPA, penetrasjonstest, ISO-sertifikat) med versjon og gyldighet
- 2 aktive foresporsler (en overdue, en pending)
- 3 innboks-elementer der Lara har foreslatt match med hoy confidence

## Tekniske detaljer

**Database-migrasjoner:**
```sql
-- Utvid vendor_documents
ALTER TABLE vendor_documents
  ADD COLUMN version text DEFAULT 'v1.0',
  ADD COLUMN valid_from date,
  ADD COLUMN valid_to date,
  ADD COLUMN status text DEFAULT 'current',
  ADD COLUMN requested_at timestamptz,
  ADD COLUMN received_at timestamptz,
  ADD COLUMN reminder_sent_at timestamptz,
  ADD COLUMN source text DEFAULT 'manual_upload';

-- Ny tabell for foresporsler
CREATE TABLE vendor_document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  requested_by text,
  due_date date NOT NULL,
  status text DEFAULT 'pending',
  reminder_count integer DEFAULT 0,
  last_reminder_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Ny tabell for Lara innboks
CREATE TABLE lara_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_email text,
  sender_name text,
  subject text,
  received_at timestamptz DEFAULT now(),
  file_name text,
  file_path text,
  matched_asset_id uuid REFERENCES assets(id),
  matched_document_type text,
  confidence_score float,
  status text DEFAULT 'new',
  processed_at timestamptz,
  processed_by text,
  created_at timestamptz DEFAULT now()
);
```

**Nye/endrede filer:**
- `src/components/asset-profile/tabs/DocumentsTab.tsx` - Fullstendig redesign med versjon/gyldighet/status
- `src/components/asset-profile/tabs/LaraInboxTab.tsx` - Ny komponent for innboks
- `src/components/asset-profile/tabs/DocumentRequestsSection.tsx` - Foresporsler og purringer
- `src/pages/AssetTrustProfile.tsx` - Legg til Innboks-tab med badge
- `src/locales/nb.json` og `en.json` - Nye oversettelser

**DocumentsTab redesign:**
- Tabellvisning med sorterbare kolonner: Navn, Type, Versjon, Gyldig til, Status, Kilde, Dato
- Status-badges: Gront (current), Gult (expiring soon), Rodt (expired), Blatt (pending_review)
- Expiry-varsel: Dokumenter som utloper innen 30 dager far gul varsel-badge

**LaraInboxTab:**
- Viser innkommende dokumenter med Lara-sommerfugl-ikon
- "Lara foreslaar"-kort med confidence-prosent og handlingsknapper
- Animert overgang nar dokument godkjennes og flyttes til profilen

**Foresporsler-seksjon:**
- Aktive foresporsler med countdown til frist
- "Send purring"-knapp (simulert i demo)
- Overdue-foresporsler markert med rodt

