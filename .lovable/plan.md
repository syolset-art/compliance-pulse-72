
## Mål

Gjøre **Trust Center → Dokumentasjon & bevis** til ett sted for alle bevisdokumenter (policy, sertifikat, DPA, pentest, SOC2, rapporter osv.) – og la brukeren styre **hvem som har tilgang** til hvert enkelt dokument via en liste, ikke bare en av/på-bryter.

## Hva som er der i dag

`TrustCenterEvidence.tsx` viser allerede dokumenter i tre grupper: Policy, Sertifisering, Dokument. DPA, pentest, rapporter ligger som `document_type = agreement / evidence / report` under "Dokument". Synlighet er i dag binær: **Offentlig** eller **Intern** (Switch på hver rad).

Det som mangler:
1. En tydelig kategori for "Avtaler & bevis" (DPA, pentest, SOC 2, revisjonsrapporter) – ikke bare slått sammen under "Dokument".
2. Granulær tilgang per dokument – velge konkrete mottakere, ikke bare publisere globalt.

## Endringer

### 1. Ny tilgangsmodell per dokument

Erstatt dagens to-tilstands `visibility` med tre nivåer (lagres i eksisterende `visibility`-kolonne pluss en ny `access_list`):

```text
 Offentlig   – synlig i offentlig Trust Profile for alle
 Økosystem   – kun innloggede kunder/partnere i nettverket
 Begrenset   – kun mottakere du velger i en liste (default for DPA/pentest)
```

Når brukeren velger **Begrenset**, åpnes en dialog "Hvem har tilgang?" med:
- Søkbar liste over kontakter fra `network_connections` (allerede i basen) + mulighet å legge til e-post manuelt.
- Sjekkbokser for flervalg.
- Liste lagres i en ny tabell `trust_document_grants (document_id, recipient_email, recipient_name, granted_at, granted_by, revoked_at)`.

Visning i radkortet:
- I stedet for dagens Switch vises et lite "Tilgang"-chip: `Offentlig` / `Økosystem` / `3 mottakere` (klikkbar → åpner dialog).

### 2. Omorganisering av seksjoner i Evidence

Endre fra tre til fire grupper, med eksplisitte ikoner og forklaring:

```text
 Policyer           – interne regelverk (security_policy, privacy_policy, …)
 Sertifiseringer    – ISO 27001, SOC 2, Cyber Essentials, ISAE 3402
 Avtaler & bevis    – DPA, pentest, revisjonsrapporter, SOC 2-rapport
 Andre dokumenter   – øvrig
```

Mapping skjer i `src/lib/trustDocumentTypes.ts` (legg til `EVIDENCE_TYPES = ['agreement','evidence','report','pentest','dpa','soc2_report','audit_report']`).

### 3. Tilgangslogg

Når en mottaker legges til/fjernes, skriv en rad i eksisterende `lara_inbox` eller ny enkel `trust_document_grants` (anbefalt – egen tabell). Viser:
- "Lagt til av deg, 8. juni"
- "Tilgang trukket tilbake"

Vises i en "Tilgang & historikk"-fane på dokumentets detalj-popover (gjenbruker preview-dialogen).

### 4. UI-endringer (kun frontend + ny tabell)

- `src/pages/TrustCenterEvidence.tsx` – fire grupper, ny tilgangs-chip, ny dialog `<DocumentAccessDialog />`.
- `src/components/trust-center/DocumentAccessDialog.tsx` – ny komponent.
- `src/lib/trustDocumentTypes.ts` – `EVIDENCE_TYPES` + ny `evidenceTypeLabel`.
- Tabell-migrasjon for `trust_document_grants` (GRANT + RLS scoped til `auth.uid()`).

## Teknisk detalj

```sql
CREATE TABLE public.trust_document_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.vendor_documents(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,            -- eier av dokumentet (auth.uid())
  recipient_email text NOT NULL,
  recipient_name text,
  recipient_connection_id uuid,           -- valgfri kobling til network_connections
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- GRANT + RLS: eier kan CRUD egne rader (owner_user_id = auth.uid())
```

`visibility` beholder verdiene `published | hidden`, og vi tolker `hidden` + grants > 0 som **Begrenset**. Eventuelt utvider vi til `published | ecosystem | restricted | hidden` senere.

## Det vi IKKE gjør nå

- Ingen e-postvarsling til mottakere (kommer i Kundemodul).
- Ingen "kunde-portal"-visning – det dekkes når Kundemodulen bygges senere.
- Ingen versjonshåndtering her – det ligger allerede i Master-dokumenter.

## Resultat

Brukeren ser én ren Evidence-side med DPA/pentest/SOC2 i egen seksjon, og kan for hvert dokument klikke "Tilgang" og krysse av i en liste hvem som skal kunne se det – i stedet for en binær publiseringsbryter.
