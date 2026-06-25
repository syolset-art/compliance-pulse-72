Forenkle `/trust-center/edit` til én enkelt sjekkliste-tabell som viser hva som mangler og hva som er på plass. Brukeren kan legge ved en lenke eller laste opp et dokument direkte fra hver rad — innholdet lagres slik at det dukker opp i de eksisterende seksjonene "Ressurser" eller "Compliance" på samme side / profil.

### Endringer i `src/pages/TrustCenterEditProfile.tsx`

Behold:
- Topp-header (tilbake-lenke, tittel, SavedIndicator)
- Trust Center URL-kortet
- `CompanyInfoForm` (selskapsinformasjon)
- `PublishStickyBar` + `ContextualHelpPanel`
- `EditActiveFrameworksDialog` (åpnes fra tabellen)

Fjern fra denne siden (skjules — eksisterende komponenter beholdes for bruk andre steder/i drawer):
- "Modenhet per kontrollområde"-seksjonen (utvidbar liste av kontroller)
- "Etterlevelse" / regelverk-listen
- `BrandingSection`, `ContactsSection`, `SubprocessorsSection`, `ResourcesSection`, "Powered By Mynder"-ingress

Ny seksjon (erstatter alle fjernede):
- Ett kort med tittel "Hva mangler og hva er på plass" og en enkel tabell med kolonner:
  1. **Element** — navn (f.eks. "Personvernerklæring", "ISO 27001-sertifikat", "Databehandleravtale-mal", "Logo", "Kontaktperson sikkerhet", "GDPR aktivert")
  2. **Type** — liten chip: `Ressurs` eller `Compliance` (avgjør hvor opplastet innhold lagres)
  3. **Status** — `På plass` (grønn ✓) / `Mangler` (grå ○) / `Delvis` (oransje)
  4. **Handling** — én knapp `Legg til` som åpner en liten meny med to valg: `Lim inn lenke` eller `Last opp dokument`. Når raden er fylt: vis filnavn / lenketekst + `Bytt ut` og `Fjern`.

Rader genereres dynamisk:
- Compliance-rader: én per aktivert framework i `selected_frameworks` (status = "På plass" hvis dokument finnes i `framework_documents` eller `vendor_documents` med matchende `framework_id`).
- Ressurs-rader: faste sjekkpunkter — Personvernerklæring (lenke på asset), Databehandleravtale, Sikkerhetspolicy, Sertifikater (ISO/SOC), Logo (fra `BrandingSection`-data), Kontaktperson sikkerhet (fra contacts).
- Sluttrad: "Legg til regelverk" → åpner `EditActiveFrameworksDialog`.

Status-beregning gjenbruker eksisterende queries (`selected_frameworks`, `vendor_documents` med `document_type` in `certificate|policy|guideline|dpa`, `assets.privacy_policy_url`, contacts-metadata).

### Lagring av nye oppføringer

- **Lenke:** lagres på `assets`-raden (`privacy_policy_url` for personvern) eller i `vendor_documents` med `document_url` + `document_type` korresponderende til radens type.
- **Opplasting:** bruker eksisterende Supabase storage `documents`-bucket og lager rad i `vendor_documents` med riktig `document_type` (`policy`, `certificate`, `guideline`, `dpa`) og — for compliance-rader — `framework_id`. Da vises de automatisk i den separate `ResourcesSection` / framework-visning andre steder, slik brukeren ber om.

### Ny komponent

- `src/components/trust-center/edit/EditChecklistTable.tsx` — selvstendig tabell-komponent som tar `asset`, `companyProfile`, `frameworks` som props og håndterer queries + opplasting/lenke-dialoger internt. Holder `TrustCenterEditProfile.tsx` slank.

### Notat
- Eksisterende seksjonskomponenter (`ResourcesSection`, `SubprocessorsSection`, etc.) beholdes urørt — de brukes fortsatt fra andre flater (profilvisning, drawer). Vi fjerner kun deres bruk på denne ene siden.