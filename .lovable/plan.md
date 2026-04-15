

## Slett, rediger og status med godkjenner — dokumenter på Evidence-siden

### Hva skal bygges
Hvert dokument i listen skal kunne **slettes**, **redigeres inline**, og brukeren skal kunne **endre status** (Utkast, Venter, Godkjent, Utløpt). Når status settes til "Godkjent", lagres navnet på godkjenneren og vises i UI.

### Database-endring
Legge til to nye kolonner på `vendor_documents`:
- `approved_by` (text, nullable) — hvem som godkjente
- `approved_at` (timestamptz, nullable) — når det ble godkjent

### UI-endringer i `TrustCenterEvidence.tsx`

**1. Handlingsknapper per rad**
- Erstatte den passive ExternalLink-knappen med en **DropdownMenu** (tre-prikk-meny) med:
  - "Rediger" → åpner inline redigeringsdialog
  - "Slett" → bekreftelses-dialog → sletter fra DB
  - "Endre status" → undermeny med statusvalg

**2. Statusvelger med godkjenner**
- Statusvalg: `draft`, `pending`, `verified` (= godkjent), `expired`
- Når bruker velger "Godkjent/Verifisert" → prompt for navn (eller autofyll fra profil)
- Badge viser "Godkjent av [Navn]" ved hover eller inline tekst

**3. Redigeringsdialog**
- Enkel dialog med felter: Visningsnavn, Dokumenttype, Gyldighets-datoer, Synlighet, Notater
- Lagre oppdaterer `vendor_documents` direkte

**4. Sletting**
- AlertDialog-bekreftelse → DELETE fra `vendor_documents` + invalidate query

### Filer som endres
1. **DB-migrasjon** — `ALTER TABLE vendor_documents ADD COLUMN approved_by text, ADD COLUMN approved_at timestamptz`
2. **`src/pages/TrustCenterEvidence.tsx`** — DropdownMenu per rad, slett-logikk, status-endring med godkjenner-felt, redigerings-dialog

