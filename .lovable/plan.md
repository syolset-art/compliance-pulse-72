## Mål

1. Kontaktinformasjon skal være identisk mellom rediger-siden (`ContactsSection.tsx`) og visningen på Trust Profile (`TrustCenterProfile.tsx`).
2. Seksjonen som i dag heter **"Partner"** på Trust Profile-previewen skal hete **"Leverandører"** (NO) / **"Vendors"** (EN).

## Bakgrunn

Rediger-siden lagrer i dag kun til `asset.metadata.contacts.*` (general, privacy, security, incident_email, incident_phone, postal_address). Visningen leser i tillegg fra kolonnene `contact_name`, `contact_role`, `contact_email`, `privacy_contact_email`, `security_contact_email`, `privacy_contact_address`, `privacy_policy_url`, `incident_report_url` — med metadata som fallback. Resultat: flere felt som vises på profilen kan ikke redigeres, og felt som redigeres i metadata vises ikke alltid riktig.

## Endringer

### 1. `src/components/trust-center/edit/ContactsSection.tsx`
Utvid skjemaet med full feltparitet, gruppert som i visningen:

- **Hovedkontakt**
  - Navn (`contact_name`)
  - Rolle/tittel (`contact_role`) — f.eks. "Daglig leder"
  - E-post (eksisterende generell e-post — speiles til både kolonne `contact_email` og `metadata.contacts.general`)
- **Personvern / DPO**
  - E-post (speiles til `privacy_contact_email` + `metadata.contacts.privacy`)
  - Lenke til personvernerklæring (`privacy_policy_url`) — nytt felt
- **Sikkerhetskontakt**
  - E-post (speiles til `security_contact_email` + `metadata.contacts.security`)
- **Beredskap / hendelse** (uendret felter, fortsatt i metadata)
  - E-post (`metadata.contacts.incident_email`)
  - Telefon (`metadata.contacts.incident_phone`)
  - Lenke til avviksrapportering (`incident_report_url`) — nytt felt (kolonne)
- **Postadresse** (speiles til `privacy_contact_address` + `metadata.contacts.postal_address`)

Tekniske detaljer:
- `useAssetMetadata.updatePath` håndterer metadata. For å oppdatere kolonner samtidig: gjør en supplerende `supabase.from("assets").update({ <kolonne>: value })` ved siden av metadata-skrivingen (eller utvid hooken med en `updateColumns` helper for å unngå duplisering). Velg sistnevnte for å holde det rent.
- Behold defaultValue + onBlur-mønsteret som finnes i filen i dag.
- Hjelpetekster og placeholders på norsk, samme tone som eksisterende felter.

### 2. `src/pages/TrustCenterProfile.tsx`
- Kontaktseksjonen (linje 761–885 + duplikatet rundt 2164–2230): ingen ny lese-logikk nødvendig — den støtter allerede alle feltene. Verifiser at hovedkontaktens **navn + rolle** vises som undertekst, og legg til to nye rader for **"Personvernerklæring"** (lenke) og **"Avviksrapportering"** (lenke) når feltene finnes. Rendres som `primary` med `external: true` slik eksisterende kode allerede støtter.
- Linje 2239–2285: bytt seksjonsoverskrift fra `"Partner"`/`"Partner"` til `"Leverandører"`/`"Vendors"`. Ingen annen logikkendring.

### 3. Ingen DB-migrasjon
Alle kolonner (`contact_name`, `contact_role`, `privacy_policy_url`, `incident_report_url`, etc.) finnes allerede på `assets`-tabellen (brukes alt i visningen).

## Ut av scope
- Ingen endringer i e-postmaler, vendor-tabell, eller andre seksjoner.
- Ingen endring i lagringsmodellen utover å speile kolonne + metadata for de tre eksisterende e-postfeltene.
