
## Problem

I dag er det tre steder som ikke speiler hverandre:

1. **Bevis** (`/trust-center/evidence`) — sannhetskilden. Her ligger alle dokumenter brukeren har lastet opp (`vendor_documents`-tabellen), med en bryter som markerer hvert dokument som **Offentlig** eller **Intern**.
2. **Retningslinjer** (`/trust-center/policies`) — viser i dag fire **hardkodede demo-policies** og er helt frakoblet det brukeren faktisk har lagt inn.
3. **Trust Profile** (`/trust-center/profile/...` — den offentlige visningen) — viser riktig kun publiserte dokumenter under "Policies" og "Sertifiseringer", men gruppene **"Dokumenter"** og **"Datahåndtering"** er hardkodet tomme. Det betyr at hvis brukeren publiserer en databehandleravtale, en pentest-rapport eller annet bevis, vises det aldri i Trust Profilen.

Målet: alt brukeren markerer som offentlig i **Bevis**, skal automatisk speiles både i **Retningslinjer**-siden og i den offentlige **Trust Profilen**.

## Løsning

### 1. Gjør Retningslinjer-siden ekte (`src/pages/TrustCenterPolicies.tsx`)

Bytt ut hardkodet `demoPolicies`-liste med samme datakilde som Bevis-siden:

- Hent self-asset, så `vendor_documents` filtrert til dokumenttyper som er retningslinjer (samme `policyTypes`-liste som i `TrustCenterEvidence`: `policy`, `privacy_policy`, `acceptable_use`, `incident_response`, `security_policy`, `data_protection_policy`).
- Vis status-badge (Publisert/Utkast = `visibility === "published"` eller ei).
- Vis "Offentlig"-merke (Globe) for de som er publisert, slik at brukeren ser hva som faktisk vises eksternt.
- Gjør raden klikkbar så den åpner samme preview-dialog (signed URL fra `vendor-documents`-bucket).
- "Ny policy"-knappen åpner samme `AddEvidenceDialog` som Bevis-siden bruker, forhåndsfylt til kategori "policy".
- Filter-toggle øverst: "Alle / Kun offentlige / Kun interne".
- Tom-state: hvis ingen policy-dokumenter finnes, vis CTA "Legg til din første retningslinje".

Resultat: Retningslinjer-siden er nå et **filtrert utsnitt av Bevis** som kun viser policy-dokumenter, med samme rediger/slett/publisér-handlinger som i Bevis.

### 2. Gjør "Dokumenter"-gruppen i Trust Profile ekte (`src/pages/TrustCenterProfile.tsx`)

I dag finnes utvidet sammendrag av `vendorDocs` allerede i komponenten, filtrert på `visibility=published`. Vi utvider grupperingen:

```ts
const POLICY_TYPES = ["policy","privacy_policy","acceptable_use",
  "incident_response","security_policy","data_protection_policy"];
const CERT_TYPES = ["certification"];

const policies = vendorDocs.filter(d => POLICY_TYPES.includes(d.document_type));
const certs    = vendorDocs.filter(d => CERT_TYPES.includes(d.document_type));
const otherDocs = vendorDocs.filter(d =>
  !POLICY_TYPES.includes(d.document_type) &&
  !CERT_TYPES.includes(d.document_type));
```

Bytt så de to "hardkodet 0"-radene:

```ts
{ key: "documents", icon: FileText, label: "Dokumenter",
  count: otherDocs.length, items: otherDocs }
```

Og fjern den falske "Datahåndtering"-raden fra "Dokumentasjon og bevis"-seksjonen (datahåndtering hører hjemme i en egen seksjon, ikke som tom dokumentboks). Dette gjøres begge steder hvor blokken er duplisert (linje ~485 og ~1176).

I tillegg: utvid `select` på linje 114 så vi får med `display_name` for finere visning i Trust Profilen — samme felt som Bevis-siden viser.

### 3. Konsistent terminologi

I Trust Profilen — kall seksjonen "Retningslinjer" på norsk i stedet for "Policies", slik at den matcher venstremenyen og Bevis-sidens kategori-filter.

## Tekniske detaljer

- **Ingen databaseendringer.** Alt er allerede i `vendor_documents` med `visibility`-kolonnen.
- **Felles konstanter:** flytt `POLICY_TYPES`, `CERT_TYPES` og `docTypeLabel`-funksjonen fra `TrustCenterEvidence.tsx` til `src/lib/trustDocumentTypes.ts` så Bevis, Retningslinjer og Trust Profile bruker samme definisjon.
- **Spørringer:** Retningslinjer-siden bruker samme query-key-mønster som Bevis (`["vendor-documents-policies", asset?.id]`) og invalideres parallelt ved endring.
- **Preview:** gjenbruk samme signed-URL-flyt som i `TrustCenterEvidence` (1 times signed URL fra `vendor-documents`-bucket).

## Filer som endres

- `src/pages/TrustCenterPolicies.tsx` — full omskrivning, fra hardkodet til ekte data.
- `src/pages/TrustCenterProfile.tsx` — vis ekte `otherDocs`, fjern fake "Datahåndtering"-rad, oppdater label til "Retningslinjer" (begge duplikatblokkene).
- `src/lib/trustDocumentTypes.ts` — ny, delte konstanter og `docTypeLabel`.
- `src/pages/TrustCenterEvidence.tsx` — importér fra ny felles fil i stedet for å definere lokalt.
