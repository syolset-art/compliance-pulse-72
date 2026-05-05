## Restructure Trust Center editor as "Innholdsmatrise"

### Mål
Erstatte den nåværende `/trust-center/edit-profile`-visningen med en **strukturert innholdsmatrise** som speiler de fire opplastede skjermbildene. Matrisen viser alle felt i Trust Centeret i én tabell, gruppert per tema, med tre kolonner: **Felt** · **Vises i Trust Profile (one-pager)** · **Vises i Trust Center (full visning)**. Hver rad er redigerbar inline eller åpner et lite redigeringsark.

Dette blir den nye "én sannhet" for hva brukeren har lagt inn — i stedet for dagens lange seksjonsbaserte skjema.

### Struktur (eksakt fra skjermbildene)
9 grupper, ca. 35 felt:

1. **Identitet og organisasjon** — Selskapsnavn/logo, Kort beskrivelse, Org.nr/land/nettside/bransje, Kontaktinfo, Tilleggsnotater
2. **Score og modenhet** — Trust Score, Modenhet per kontrollområde, Detaljerte kontroller
3. **Regelverk og rammeverk** — Aktiverte regelverk, Sertifiseringer, DPA-status
4. **Personvern og datahåndtering** — GDPR-status, Datatyper, Lagringslokasjoner, Overføringsmekanismer, Oppbevaringspolicy, GDPR-rettsgrunnlag, Personvernerklæring
5. **Sikkerhet** — Sikkerhetsmodenhet, Kryptering, Tilgangskontroll, Pen-test/bug bounty, Sikkerhetsopplæring
6. **Hendelser og kontinuitet** — Hendelseshåndtering, Forretningskontinuitet
7. **AI og leverandørstyring** — Tredjepart-modenhet, AI-bruk, Leverandørrisikostyring, Underleverandører
8. **Dokumenter og policyer** — Personvernerklæring, Sikkerhetsretningslinjer, DPA, Risikovurdering, Andre dokumenter
9. **Signatur og verifikasjon** — Signatur-status, Verifikasjonsside, Manifest-hash, Aktivitetslogg

Hver rad har:
- **Felt-kolonne**: tittel + kort hjelpetekst (fra skjermbildet)
- **Profile-kolonne**: hva som vises på one-pager (badge/blå tekst, eller grå "Ikke synlig")
- **Center-kolonne**: hva som vises i full visning (lilla tekst)
- **Status-pille**: Utfylt / Mangler / Auto-generert
- **Edit-knapp**: åpner inline editor eller lenker til riktig delside (f.eks. dokumenter → `/trust-center/evidence`, kontroller → eksisterende ekspanderbar liste)

Fargekoding/legend nederst (matchende skjermbildet):
- Blå prikk = Vises på Trust Profile
- Lilla prikk = Vises i Trust Center
- Grå = Ikke synlig på flaten

### Implementering

**Ny komponent:** `src/components/trust-center/TrustContentMatrix.tsx`
- Tar `asset`, `companyProfile`, `frameworks`, `evaluation` som props
- Definerer matrisen som en konstant (gruppe → rader) — én plass å vedlikeholde struktur
- Hver rad har `id`, `labelNb/En`, `helpNb/En`, `profileDisplayNb/En`, `centerDisplayNb/En`, `getValue(asset, companyProfile)`, `editAction` (inline | navigate)
- Render: gruppert tabell med sticky-aktige headers, responsiv (stables til kort på mobil)

**Erstatte i `src/pages/TrustCenterEditProfile.tsx`:**
- Behold: header, `PublishingReadiness`, Trust Center URL-kort, hjelp-drawer
- Fjern: de lange separate seksjonene (Virksomhet, Hva leverer, GDPR-rolle, Modenhet-akkordion, Regelverk, Dokumentasjon-knapper)
- Erstatt med `<TrustContentMatrix … />` som ny hovedseksjon
- Behold quick-nav-tabs men pek til matrisens ankere (`#identitet`, `#score`, `#regelverk`, …)

**Inline edit-mønster:**
- Enkle felt (tekst/badges): klikk på verdi → popover/sheet med samme inputs som i dag
- Komplekse felt (kontroller, dokumenter): "Rediger" lenker til eksisterende sider/dialoger — gjenbruker `CompanyInfoForm`, `AddEvidenceDialog`, kontroll-akkordion-koden flyttet til en dialog

**Datakilder (allerede i bruk):**
- `assets` (selv-asset, metadata)
- `company_profile`
- `selected_frameworks`
- `vendor_documents` (for dokumenter/policies/sertifiseringer-status)
- `useTrustControlEvaluation` (modenhetsscore per område)

**Feltstatus-logikk:** ny helper `getFieldStatus(rowId, data) → "filled" | "missing" | "auto"` for å drive status-pillen og readiness-tallet.

### Hva som IKKE endres
- `TrustCenterProfile.tsx` (forhåndsvisning) — uendret
- `PublicTrustCenterLayout.tsx` — uendret
- Underliggende datamodell — ingen migrering trengs
- Andre Trust Center-undersider (`/evidence`, `/regulations`, `/products`) — uendret, fortsatt linkbare fra matrisen

### Filer
- **Ny:** `src/components/trust-center/TrustContentMatrix.tsx`
- **Ny:** `src/components/trust-center/TrustContentMatrixRow.tsx` (rad + edit-popover)
- **Ny:** `src/lib/trustContentMatrixDefinitions.ts` (gruppene/radene)
- **Endret:** `src/pages/TrustCenterEditProfile.tsx` (slanker, plugger inn matrisen)

### Åpent spørsmål
Skal matrisen **erstatte** dagens skjema fullstendig (alt redigeres via popovers fra matrisen), eller leve **side om side** øverst som et oversiktskart, med dagens detaljerte seksjoner under? Anbefaler full erstatning — det matcher intensjonen i skjermbildene og fjerner duplisering. Si fra hvis du vil ha hybrid.