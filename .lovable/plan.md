
# Plan: Restrukturere Rediger Trust Profile

Jeg implementerer alle 14 endringene i prompten i én sammenhengende refaktorering av `TrustCenterEditProfile.tsx` + `CompanyInfoForm.tsx`, og oppretter nye komponenter for AI-godkjenningsflyt og nye seksjoner.

## Filer som endres

- `src/pages/TrustCenterEditProfile.tsx` — full omstrukturering av seksjonsrekkefølge og navigasjon
- `src/components/company/CompanyInfoForm.tsx` — fjerne kontaktperson-felter (flyttes til ny seksjon), legge til AI-godkjent/foreslått visning

## Nye komponenter

- `src/components/trust-center/edit/AISuggestionField.tsx` — gjenbrukbar wrapper for Lara-foreslått / Bekreftet / Tomt-tilstand med Bekreft/Endre/Avvis-handlinger. Bruker `metadata.confirmed_fields[]` på asset for persistens.
- `src/components/trust-center/edit/ContactsSection.tsx` — rolleadresser (generell, personvern, sikkerhet, hendelse, postadresse). Lagrer i `assets.metadata.contacts`.
- `src/components/trust-center/edit/DataStorageSection.tsx` — region (multi), oppbevaringsperiode, GDPR-rettsgrunnlag (multi), rolle i behandling. Lagrer i `assets.metadata.data_storage`.
- `src/components/trust-center/edit/PrivacySection.tsx` — GDPR-status, datatyper, oppbevaringspolicy, overføringsmekanismer, lagringslokasjoner, sertifiseringer. `assets.metadata.privacy`.
- `src/components/trust-center/edit/SecurityDetailsCard.tsx` — strukturerte felter (kryptering, tilgangskontroll, pentest, opplæring) som vises over de eksisterende 17 kontrollene. `assets.metadata.security_details`.
- `src/components/trust-center/edit/IncidentsSection.tsx` — hendelseshåndtering + forretningskontinuitet. `assets.metadata.incidents`.
- `src/components/trust-center/edit/AIVendorsSection.tsx` — AI-bruk, leverandørrisikostyring, underleverandører-liste. `assets.metadata.ai_vendors`.
- `src/components/trust-center/edit/DocumentationSection.tsx` — opplastingsflyt mot eksisterende `framework_documents` / vendor_documents-tabell, med "Les"-knapp (åpner i `<iframe>` dialog), public-toggle, slett.
- `src/components/trust-center/edit/PublishStickyBar.tsx` — sticky bottom bar når readiness ≥ 80%.

## Edge function

- `supabase/functions/suggest-trust-profile/index.ts` (ny) — Lara-forslag for de nye strukturerte feltene. Mottar domene/bransje/teknologi-hint, returnerer JSON med forslag per seksjon. Bruker `google/gemini-2.5-flash` via Lovable AI gateway. Forslag caches i `assets.metadata.lara_suggestions`.

## Datamodell

Ingen migrasjoner nødvendig for nye seksjoner — alt lagres som JSON i eksisterende `assets.metadata`-felt under nøklene over. `confirmed_fields: string[]` driver "bekreftet"-state per felt-id.

For dokumentasjon brukes eksisterende `vendor_documents`-tabell (filtrert på self-asset).

## Endringer i `TrustCenterEditProfile.tsx`

Ny rekkefølge i `<main>`:

```text
1. Page header (tilbake-link + tittel + ny subtittel)
2. Trust Center URL-card (flyttet fra #public til toppen)
3. Lara-intro card (Sparkles-ikon, ny tekst)
4. PublishingReadiness
5. Quick nav tabs (9 ankere + Detaljinnstillinger-knapp)
6. <section id="company"> — CompanyInfoForm (uten kontaktpersoner) + Hva leverer
7. <section id="contacts"> — ContactsSection
8. <section id="data-storage"> — DataStorageSection
9. <section id="privacy"> — PrivacySection
10. <section id="security"> — SecurityDetailsCard + eksisterende 17 kontroller (Info-card fjernes)
11. <section id="incidents"> — IncidentsSection
12. <section id="ai-vendors"> — AIVendorsSection
13. <section id="regulations"> — uendret
14. <section id="documentation"> — DocumentationSection (erstatter "Dokumentasjon og bevis")
15. PublishStickyBar (når readiness ≥ 80%)
```

Den gamle `<section id="public">` (linje 298–337) fjernes (URL-en er flyttet opp).

## Endringer i `CompanyInfoForm.tsx`

- Fjern alle kontaktperson-blokker (Kontaktperson / DPO / Sikkerhetskontakt + tilhørende `LaraContactAssist`).
- Behold selskapsfelter (org.nr, navn, land, bransje, ansatte, beskrivelse, logo).
- Pakk hvert felt i `<AISuggestionField>` slik at de viser "Foreslått av Lara"-state inntil bruker bekrefter.

## Språk og tilgjengelighet

- Alle nye komponenter implementerer både `nb` og `en` via `i18n.language` (følger eksisterende mønster).
- Tailwind semantiske tokens (`bg-primary`, `text-success`, `border-border`) — ingen hardkodede farger.
- Ikoner får eksplisitt `h-4 w-4` / `h-3 w-3`.

## Akseptansekriterier

- URL-card vises øverst, ingen duplikat lengre nede.
- 9 quick nav-tabs scroller til riktig anker.
- CompanyInfoForm viser ikke lenger DPO/CISO/Compliance-navn.
- Hver Lara-foreslått verdi har Bekreft/Endre/Avvis-knapper og oppdaterer `confirmed_fields`.
- Dokumentasjon-seksjonen kan laste opp, toggle public, lese (in-app dialog) og slette.
- Sticky publiseringsbar vises kun når readiness ≥ 80%.
- Ingen jargong (PGP, security.txt, DSAR, ECDSA) i brukervendt tekst.
