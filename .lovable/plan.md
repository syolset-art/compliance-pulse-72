
# Dokumentopplasting og bevisklassifisering (Draft / Evidence / Verified)

Ny opplastings- og klassifiseringsflyt for Trust Profile. Hvert dokument knyttes til ett eller flere av de fem kontrollområdene, klassifiseres av Lara (AI), og må bekreftes av et menneske før det blir bevis. Verifisering registreres som en separat handling.

## De fem kontrollområdene
- Governance & Accountability
- Operations & Security
- Identity & Access
- Privacy & Data Handling
- Third Party & Supply Chain

## Bevisstatus (tre nivåer)

| Status | Hvem setter | Trust Score |
|---|---|---|
| Draft | System ved opplasting | Nei |
| Evidence | Bruker (bekreftelse) | Ja, hvis `usedForTrustScore=true` |
| Verified | Bruker (registrerer ekstern verifikator) | Ja, høyere vekt |

Regel: AI kan aldri sette Evidence eller Verified. AI foreslår kun.

## Brukerflyt

```text
[Last opp fil] → status = Draft
        ↓
[«Lara analyserer dokumentet…»]
        ↓
   ┌──────────────────────────────┐
   │ AI ok / confidence over terskel? │
   └──────────────────────────────┘
       ja ↓                    nei ↓
[Review-kort med forslag]   [Manuell klassifisering]
       ↓
[Bruker: Aksepter / Rediger / Avvis]
       ↓
[«Bekreft som bevis»-dialog] → status = Evidence
       ↓ (valgfritt, senere)
[«Legg til verifikasjon»-dialog] → status = Verified
```

## Review-kort
Vises som `Sheet` etter opplasting. Innhold:
- Filnavn + foreslått dokumenttype
- AI confidence (diskret)
- Foreslåtte kontrollområder (chips, redigerbare)
- Foreslåtte støttede kontroller (liste, redigerbare)
- AI-sammendrag
- Kvalitetsfunn med varselikoner (manglende eier/godkjenning/versjon/revisjon, draft, utløpt, sensitiv info)
- Foreslått delingsnivå
- Ekstrahert metadata: eier, versjon, sist oppdatert, godkjenningsdato, godkjent av, neste revisjon, utløpsdato

Handlinger: Aksepter · Rediger · Avvis · Lagre som utkast

## «Bekreft som bevis»-dialog
Tekst: *"Bekrefter du at dette dokumentet er gjeldende, relevant og kan brukes som bevis i Trust Profile?"*

Felter:
- Bekreftet av
- Rolle
- Bekreftelsesdato (auto)
- Delingsnivå: Kun intern / Delt med inviterte partnere / Offentlig
- Brukes i Trust Score: Ja / Nei

Setter `status = Evidence`.

## «Legg til verifikasjon»-handling
Separat knapp på dokumenter med status Evidence. Felter:
- Verifisert av
- Verifikatortype: Ekstern revisor / Sertifiseringsorgan / Intern reviewer / Kunde / Partner / Annet
- Verifikasjonsdato
- Verifikasjonsgrunnlag: ISO-revisjon / Sikkerhetsgjennomgang / Juridisk gjennomgang / Kundedue diligence / Annet
- Notater
- Utløpsdato (valgfritt)

Setter `status = Verified`.

## Manuell fallback
Når AI feiler eller confidence < terskel: melding *"Lara kunne ikke klassifisere dette dokumentet med høy nok sikkerhet. Klassifiser manuelt."*

Felter: dokumenttype, kontrollområde(r), støttede kontroller, eier, versjon, godkjenningsstatus (Ja/Nei/Ukjent), godkjent av, godkjenningsdato, neste revisjon, delingsnivå, bruk for Trust Score.

## Audit trail
Tidslinje nederst i dokumentkortet:
- Lastet opp av · tidspunkt
- AI klassifisert · tidspunkt
- Bekreftet av · rolle · tidspunkt
- Verifisert av · tidspunkt
- Sist endret

## Teknisk

### Datamodell — utvider `vendor_documents`
Migrasjon legger til:
- `control_areas` text[]
- `supported_controls` text[]
- `evidence_status` text check in (`draft`,`evidence`,`verified`) default `draft`
- `ai_confidence` numeric
- `ai_summary` text
- `extracted_metadata` jsonb (owner, version, last_updated, approval_date, approved_by, next_review_date, expiry_date)
- `quality_findings` jsonb
- `confirmed_by`, `confirmed_role`, `confirmed_at`
- `verified_by`, `verifier_type`, `verification_date`, `verification_basis`, `verification_notes`, `verification_expiry_date`
- `sharing_level` text check in (`internal`,`partners`,`public`)
- `used_for_trust_score` boolean default false
- `audit_trail` jsonb default '[]'

GRANTs/RLS uendret (bruker eksisterende policy).

### Edge function
Ny: `supabase/functions/classify-evidence-document/index.ts`
- Input: `document_id` + signert URL eller tekstinnhold
- Bruker Lovable AI Gateway (`google/gemini-3-flash-preview`) via AI SDK med `Output.object` (Zod-skjema for alle forslag)
- Skriver tilbake til `vendor_documents`
- Returnerer confidence + forslag

### Komponenter
Nye filer:
- `src/components/trust-controls/EvidenceUploadDialog.tsx` — opplastingsflyt + AI-indikator
- `src/components/trust-controls/EvidenceReviewSheet.tsx` — review-kort
- `src/components/trust-controls/EvidenceManualForm.tsx` — manuell fallback
- `src/components/trust-controls/ConfirmAsEvidenceDialog.tsx`
- `src/components/trust-controls/AddVerificationDialog.tsx`
- `src/components/trust-controls/EvidenceAuditTrail.tsx`
- `src/components/trust-controls/ControlAreaChips.tsx` — multi-select av de fem områdene
- `src/components/trust-controls/EvidenceStatusBadge.tsx` — utvides/erstattes med Draft/Evidence/Verified
- `src/lib/evidenceStatus.ts` — enum, labels, Trust Score-vekting
- `src/hooks/useClassifyEvidence.ts` — kaller edge function, håndterer timeout/fallback

Endrede filer:
- `src/lib/controlAreas.ts` — bekrefter at alle fem områder er definert (legg til `privacy` hvis mangler)
- `src/components/asset-profile/tabs/VendorEvidenceTab.tsx` — bruker ny upload-dialog
- `src/pages/TrustCenterEvidence.tsx` — grupperer bevis per kontrollområde, viser statusbadges
- `src/lib/scoringEngine.ts` — vekter kun dokumenter med status ≥ Evidence og `used_for_trust_score=true`; høyere vekt for Verified

## Avgrensning
- Selve filopplastingen gjenbruker eksisterende `vendor-documents`-bucket
- Demo-data: noen seedede dokumenter med ulike statuser så flyten kan vises uten å laste opp ekte filer
- Lara Inbox-flyten er ikke endret i denne iterasjonen
