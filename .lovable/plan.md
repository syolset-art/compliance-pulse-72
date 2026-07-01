# Guided klassifisering av bevisdokumenter

Mål: hvert dokument som lastes opp går gjennom en kort, guidet flyt der **status opptjenes** (Uploaded → Classified → Confirmed → Attested → Verified) og **vekting utledes** (aldri velges) — happy path er to bekreftelser.

## Prinsipper

- Brukeren velger aldri tier selv. Tier utledes fra dokumenttype + attestasjonssignaler AI leser.
- Smarte defaults: AI forhåndsutfyller type, kontrollkobling og metadata. Minste vei = «bekreft → bekreft → ferdig».
- Status vises alltid som **etikett + ikon**, aldri farge alene (WCAG AA).
- Ingen blindveier: et «bare vis»-dokument kan alltid kobles til en kontroll senere.
- Ærlig vekt-indikator: liten forklaring på *hvorfor* dokumentet får sin tier ("Akkreditert revisjon funnet → 0,95").

## Statusmodell (utvidet)

Dagens `evidence_status` (draft / evidence / verified) utvides til fem trinn som matcher opptjeningen:

| Status | Betydning | Hvem setter |
|---|---|---|
| Uploaded | Fil mottatt, AI kjører | System |
| Classified | Type + tier låst av AI, brukeren har bekreftet type | Bruker (steg 1) |
| Confirmed | Plassering bekreftet (kontroll og/eller ressurs) | Bruker (steg 2) |
| Attested | Ansvarlig person har bekreftet med navn/rolle/dato | Bruker (steg 3, valgfri) |
| Verified | Ekstern verifikator har godkjent | Verifikator |

Draft/Evidence/Verified beholdes som *visnings-alias* i eksisterende UI-komponenter så vi ikke bryter kortene — vi mapper: Uploaded/Classified = Draft, Confirmed/Attested = Evidence, Verified = Verified.

## Tier-modell (utledet)

```text
GDPR-sertifisert / akkreditert revisjon      → 1,00
ISO 27001 / SOC2 / tilsvarende sertifikat    → 0,85
Signert avtale / policy m/ godkjenner        → 0,60
Egenerklært / uverifisert                    → 0,30
```

AI leser signaler fra dokumentet (signatur, sertifikatnummer, revisor, dato) og setter tier ved steg 1. Brukeren ser tier + kort forklaring, men har ingen "endre tier"-knapp. En "Uenig?"-lenke åpner et notat som sendes til verifikator.

## Flyten (ny 4-stegs wizard, erstatter dagens 2-stegs ReviewForm)

**Steg 0 — Slipp filen** (auto)
- Fil lastes opp → `status = uploaded`. Toast: "Lara leser dokumentet …"

**Steg 1 — «Hva er dette?»**
- AI-forslag: dokumenttype + tier-signaler + dato/utløp.
- Ett valg: bekreft type, eller korriger via dropdown.
- Dato < 6 mnd-sjekk: hvis utdatert, vis rødt merke her (før plassering).
- Bekreft → `status = classified`, tier låses.

**Steg 2 — «Hvor hører det hjemme?»** (gaffelen)
- To valg (kan velges begge):
  - **Koble til kontroll** — AI har forhåndsvalgt matchende kontroll(er). Bekreftelse gir control weight × tier × kritikalitet.
  - **Bare vis som compliance-dokument** — går til Trust Profile ressurser, ingen scorepåvirkning.
- Bekreft → `status = confirmed`. Vekting låst.

**Steg 3 — «Bekreft at dette stemmer»** (valgfritt)
- Navn + rolle + dato → `status = attested`.
- Egen boks: "Venter på verifisering" (Verified er egen flyt via AddVerificationDialog, urørt).

Ferdig-skjerm viser status-stigen med hva som mangler for full uttelling ("Legg til attestering for +X poeng").

## Vekt-indikator

Kompakt panel i steg 1 og på dokumentkortet:

```text
Vekting: 0,85 · ISO 27001-sertifikat oppdaget
Kontroll: "Databehandleravtale er på plass" (weight 2, kritikalitet 1,5)
Bidrag til score: 2 × 1,5 × 0,85 = 2,55
```

## Kobling til kontrollkort-tilstander

- Tom → ingen bevis, ingen score.
- Bevis kreves → har Confirmed, mangler Attested/Verified for nivå 4. Kortet: "Trenger ett verifisert bevis for nivå 4."
- Delvis dekning → AI markerer manglende kravpunkt i `supportedControls`. Kortet viser gap.
- Utdatert → dato > 6 mnd, tier degraderes automatisk (visning) og gap-badge dukker opp.
- Ikke relevant → egen handling på kortet, utenfor opplastingsflyt.

## Teknisk oversikt

**Nye/endrede filer:**
- `src/lib/evidenceStatus.ts` — utvid `EvidenceStatus` til 5 verdier, legg til tier-typer og `deriveTier(cls)`-funksjon. Behold gammel type som alias for bakoverkompatibilitet.
- `src/lib/evidenceTier.ts` (ny) — tier-tabell, signaldeteksjon-regler, `tierWeight`, `explainTier()`.
- `src/hooks/useClassifyEvidence.ts` — utvid respons med `tier`, `tierSignals`, `suggestedControls[]` (id + confidence), `documentDate`, `isOutdated`.
- `supabase/functions/classify-evidence-document/index.ts` — utvid prompt til å returnere tier-signaler, dokumentdato, foreslåtte kontroller. Fortsatt Gemini via Lovable AI.
- `src/components/trust-controls/EvidenceUploadDialog.tsx` — bytt ut ReviewForm med 4-stegs wizard (`Step1TypeConfirm`, `Step2Placement`, `Step3Attest`, `StepDone`). Behold `manual`-gren som fallback.
- `src/components/trust-controls/EvidenceStatusPill.tsx` — utvid til 5 status-varianter, ikon + etikett.
- `src/components/trust-controls/TierBadge.tsx` (ny) — liten pille med tier + forklaring i popover.
- `src/components/trust-controls/EvidenceProgress.tsx` (ny) — horisontal status-stige for ferdig-skjerm og dokumentkort.
- Migration: legg til kolonner på `vendor_documents`: `tier numeric`, `tier_source text`, `tier_signals jsonb`, `document_date date`, `attested_by text`, `attested_role text`, `attested_at timestamptz`, `placement text[]` ('control' | 'resource'). Utvid check-constraint på `evidence_status`.
- `src/pages/TrustCenterEvidence.tsx` — bruk ny `EvidenceStatusPill` + `TierBadge`, vis attestasjonsknapp når status = confirmed.

**Uendret:** `AddVerificationDialog`, `ConfirmAsEvidenceDialog` (kan brukes internt fra ny wizard i steg 3), scoring-motoren (leser bare `tier` og `evidence_status`).

**Migrasjon av eksisterende data:** `draft → uploaded`, `evidence → confirmed`, `verified → verified`. Tier settes til 0,60 default på eksisterende Confirmed, 0,30 på Draft — kan re-klassifiseres senere.

## Scope-avgrensning

- Ingen endringer i partner/MSP-opplastingen (`PartnerEvidenceUploadDialog`) i denne runden — kan følge etter når mønsteret er verifisert.
- Verifikator-rollen (hvem kan sette Verified) beholdes som "Venter på verifisering" — låses i egen sak.
- Publiseringssiden av Trust Profile (hva som vises utad) endres ikke — kun status/tier-etiketter oppdateres.
