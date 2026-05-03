## Mål
Sørge for at Trust Profile alltid viser status på de tre obligatoriske artefaktene en kjøper alltid spør etter, og at brukeren enkelt kan legge dem til (lenke eller opplastet fil) fra Dokumentasjon-siden i Trust Center.

## De tre minimumskravene
1. **Personvernpolicy** — lenke eller opplastet dokument
2. **Databehandleravtale (DPA)** — lenke, opplastet dokument, eller markert som "tilgjengelig på forespørsel"
3. **Sikkerhetssertifisering ELLER security whitepaper** — minst én av: ISO 27001 / SOC 2 / ISAE 3402-sertifisering, eller egenerklært security whitepaper (lenke/dokument)

Hvis noen av disse mangler, skal det vises **synlig som "Ikke dokumentert"** — ikke skjules.

## Nåsituasjon
- `TrustCenterProfile.tsx` viser i dag policies/certs/documents gruppert, men har ingen eksplisitt "må-ha"-sjekkliste. Manglende dokumenter er kun synlige som "Nothing visible yet" inni en kollapsbar seksjon.
- DPA-statusen finnes som `meta.dpa_verified` (boolean), men ingen lenke/fil-felt.
- `TrustCenterEvidence.tsx` (Dokumentasjon-undermenyen) lar deg laste opp filer, men har ingen quick-action for å legge inn en **lenke** til en eksisterende, offentlig policy (vanlig for personvernpolicy som ofte ligger på selskapets nettside).

## Endringer

### 1. Utvid `vendor_documents` med URL og "on request"-flagg (migrasjon)
Legg til to nullable kolonner slik at lenker kan registreres på linje med opplastede filer:
- `external_url text` — direktelenke til en publisert policy (f.eks. https://acme.no/personvern)
- `available_on_request boolean default false` — DPA-spesifikk: "tilgjengelig på forespørsel"

Eksisterende `file_path` blir nullable i praksis (vi sender tom streng i dag — dette gjøres ved at vi bruker `external_url` når fil mangler).

### 2. Ny komponent `RequiredArtifactsBlock`
Ny fil: `src/components/trust-center/RequiredArtifactsBlock.tsx`. Viser de tre må-ha-kravene som tre rader øverst i Dokumentasjon-seksjonen på Trust Profile:

```
┌─────────────────────────────────────────────────────────────┐
│ Påkrevde dokumenter for kjøpere                             │
├─────────────────────────────────────────────────────────────┤
│ ✓ Personvernpolicy            → Åpne (lenke til acme.no)    │
│ ⚠ Databehandleravtale          [ Ikke dokumentert ] [Legg til]│
│ ✓ Sikkerhetssertifisering      ISO 27001:2022               │
└─────────────────────────────────────────────────────────────┘
```

Logikk for hver rad:
- **Privacy Policy:** `documented = vendorDocs.some(d => d.document_type === "privacy_policy")` (lenke eller fil)
- **DPA:** `documented = vendorDocs.some(d => ["agreement","dpa"].includes(d.category) || d.document_type==="agreement" && d.display_name kontains "DPA"/"databehandler")` ELLER `meta.dpa_on_request`
- **Sikkerhet:** `documented = certs.length > 0 || vendorDocs.some(d => d.document_type === "security_policy" || d.document_type === "security_whitepaper")`

Status-pille:
- ✓ "Dokumentert" (success-grønn) med visning av kilden (lenke-ikon eller filnavn)
- ⚠ "Ikke dokumentert" (warning-oransje) med CTA "Legg til" som åpner Dokumentasjon-siden med riktig dialog forhåndsfylt

### 3. Trust Profile (`TrustCenterProfile.tsx`)
- Sett inn `<RequiredArtifactsBlock />` øverst i "DOKUMENTASJON OG BEVIS"-seksjonen (linje 513) — over den eksisterende kollapsbare gruppeoversikten.
- Gjør det samme i preview-varianten rundt linje 1240.
- Oppdater "Sammendrag"-tellerne (linje 496–508) til å vise en ny "Må-ha 2/3"-teller i stedet for kun DPA-status, slik at kjøperen ser umiddelbart om profilen mangler noe kritisk.

### 4. Dokumentasjon-siden (`TrustCenterEvidence.tsx`)
Legg til en sticky toppseksjon "Påkrevd dokumentasjon" (over de eksisterende Policies/Certs/Documents-listene):
- Tre rader med samme status som Trust Profile (✓ / ⚠).
- Hver rad har to handlinger:
  - **Lim inn lenke** → liten input + "Lagre" knapp (oppretter en `vendor_documents`-rad med `external_url` satt og tom `file_path`)
  - **Last opp fil** → åpner eksisterende `AddEvidenceDialog` med dokumenttype forhåndsvalgt
- For DPA: tilleggsvalg "Tilgjengelig på forespørsel" som setter `meta.dpa_on_request = true` på self-asset.

### 5. Utvid `AddEvidenceDialog.tsx`
- Legg til en `defaultDocumentType?: string`-prop slik at vi kan åpne dialogen med riktig type forhåndsvalgt fra "Legg til"-knappene.
- Legg til en "Lim inn lenke i stedet for fil"-modus som setter `external_url` og hopper over storage-opplasting.
- Legg til ny subtype `security_whitepaper` (cat: certification eller egen kategori).

### 6. Visning av lenke-baserte dokumenter
Der vendor_documents listes (Trust Profile + Evidence), endre rad-handlingen slik at:
- Hvis `external_url` er satt: åpne lenken i ny fane (med ekstern-ikon).
- Ellers: bruk dagens signed-URL preview.

### 7. i18n-nøkler (NB/EN)
- `trust.required.title` → "Påkrevde dokumenter for kjøpere" / "Required documents for buyers"
- `trust.required.privacy` → "Personvernpolicy" / "Privacy Policy"
- `trust.required.dpa` → "Databehandleravtale" / "Data Processing Agreement"
- `trust.required.security` → "Sikkerhetssertifisering eller whitepaper" / "Security certification or whitepaper"
- `trust.required.documented` → "Dokumentert" / "Documented"
- `trust.required.missing` → "Ikke dokumentert" / "Not documented"
- `trust.required.onRequest` → "Tilgjengelig på forespørsel" / "Available on request"
- `trust.required.addLink` → "Legg til lenke" / "Add link"
- `trust.required.addFile` → "Last opp fil" / "Upload file"

## Tekniske detaljer
- **Migrasjon:** `ALTER TABLE public.vendor_documents ADD COLUMN external_url text, ADD COLUMN available_on_request boolean DEFAULT false; ALTER TABLE public.vendor_documents ALTER COLUMN file_path DROP NOT NULL;`
- **Ingen RLS-endringer** — bruker eksisterende policies.
- **`AddEvidenceDialog` insert** må håndtere både `file_path` (opplasting) og `external_url` (lenke). For lenker: sett `file_name = external_url`, `file_path = ''`, `external_url = url`, `status = "verified"`.
- **DPA on-request:** lagres i `assets.metadata.dpa_on_request` på self-asset (samme mønster som `dpa_verified`).

## Filer som påvirkes
- Ny: `src/components/trust-center/RequiredArtifactsBlock.tsx`
- `src/pages/TrustCenterProfile.tsx` (sett inn blokken to steder)
- `src/pages/TrustCenterEvidence.tsx` (sticky toppseksjon)
- `src/components/trust-center/AddEvidenceDialog.tsx` (defaultDocumentType + lenke-modus + security_whitepaper-type)
- `src/lib/trustDocumentTypes.ts` (legg til `security_whitepaper`)
- Ny migrasjon for `vendor_documents`
