

# Plan: Agent-Native Bevis-Innhenting og Automatisk Trust Score-Nedgradering

## Oversikt
Bygge et system der bakgrunnsagenter automatisk overvåker bevis-status og nedgraderer Trust Score når evidens blir foreldet. Tre lag: datamodell, edge function (agent), og UI-integrasjon.

## 1. Database: Evidence Freshness Tracking

Ny tabell `evidence_checks` som logger agentens automatiske sjekker:

```sql
CREATE TABLE evidence_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL,
  check_type text NOT NULL,        -- 'certificate_expiry', 'document_status', 'vendor_change'
  control_key text NOT NULL,       -- kobler til TrustControlDefinition.key
  status text NOT NULL DEFAULT 'fresh',  -- 'fresh', 'stale', 'expired', 'missing'
  last_verified_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  staleness_days integer DEFAULT 0,
  details jsonb DEFAULT '{}',
  agent_id text DEFAULT 'system',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

Ny kolonne på `assets.metadata` — ingen migrasjon nødvendig, bare bruke JSONB-feltet `evidence_freshness_score` som agenten oppdaterer.

## 2. Edge Function: `check-evidence-freshness`

Ny bakgrunnsagent som kjører periodisk og sjekker:

| Sjekk | Logikk | Nedgradering |
|---|---|---|
| **Sertifikat-utløp** | `vendor_documents.valid_to` < nå + 30d | `stale` → `expired` |
| **Dokument-alder** | `vendor_documents.created_at` > 365 dager | `fresh` → `stale` |
| **Leverandør-endringer** | Metadata-endringer uten oppdatert review | Kontroll → `partial` |
| **Manglende evidens** | Kontroll uten tilhørende dokument | `missing` |

Agenten oppdaterer `evidence_checks`-tabellen og setter `assets.metadata.evidence_penalties` med en liste over nedgraderte kontroller.

## 3. Trust Score-Integrasjon

Endre `useTrustControlEvaluation.ts` til å hente `evidence_checks` for asset og justere kontrollstatus:

```
if evidence_check.status === 'expired' → kontroll.status = 'missing'
if evidence_check.status === 'stale'   → kontroll.status = 'partial'  
```

Dette betyr at Trust Score automatisk synker når evidens forfaller — uten manuell intervensjon.

## 4. UI: Evidence Status på Trust Profile

På Trust Profile-siden, vise per kontrollområde:
- Grønn prikk: Alle bevis ferske
- Gul prikk + "2 bevis utløper snart": Stale evidens
- Rød prikk + "Utløpt evidens": Expired, Trust Score nedgradert

Legge til et lite "Agent status"-badge i Trust Profile-headeren som viser siste sjekk-tidspunkt.

## Filer

| Fil | Endring |
|---|---|
| `evidence_checks` tabell | Ny migrasjon |
| `supabase/functions/check-evidence-freshness/index.ts` | Ny edge function |
| `src/hooks/useTrustControlEvaluation.ts` | Hente evidence_checks, justere kontrollstatus |
| `src/lib/trustControlDefinitions.ts` | Ny `applyEvidencePenalties()` funksjon |
| `src/pages/TrustCenterProfile.tsx` | Vise evidence-status per kontrollområde |
| `src/components/trust-controls/EvidenceStatusBadge.tsx` | Ny komponent for fersk/stale/expired-indikator |

## Teknisk

- Edge function bruker service role key for å lese alle assets og dokumenter
- Evidens-sjekken er idempotent — kan kjøres mange ganger uten duplikater
- Staleness-regler: Dokument >365d = stale, Sertifikat <30d til utløp = stale, Utløpt = expired
- Trust Score-formelen forblir uendret — kun input-kontrollene justeres basert på evidens-status

