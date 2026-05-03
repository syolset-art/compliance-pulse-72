## Mål
Sørge for at Trust Profile har de minimum nødvendige identitetsfeltene som gjør profilen troverdig for kjøpere.

## Nåsituasjon
På Trust Profile (`src/pages/TrustCenterProfile.tsx`) vises i dag i header / metadata-stripen:
- Navn (`companyProfile.name`)
- Org.nr
- Bransje
- Kategori
- Nettside (`domain`)

Manglende eller ikke synlige minimumsfelt:
- Juridisk navn (eget felt – i dag finnes bare `name`)
- Land for registrering (mangler helt i `company_profile`)
- Kort beskrivelse (finnes på `assets.description` for self-asset, men vises ikke på Trust Profile-headeren)
- Logo (lagres som `assets.logo_url`, men Trust Profile-headeren viser et generisk Shield-ikon i stedet for logoen; opplastingsknappen i `CompanyInfoForm.tsx` har heller ingen handler)

## Endringer

### 1. Database (migrasjon på `company_profile`)
Legg til to nye nullable kolonner:
- `legal_name text` – juridisk navn
- `country text` – land for registrering (ISO-kode eller fritekst, default "NO")

(Beskrivelse og logo bruker eksisterende felter på `assets` for self-asset – ingen nye kolonner.)

### 2. Trust Profile – Identitet-blokk (`src/pages/TrustCenterProfile.tsx`)
Erstatt dagens header + metadata-stripe med en tydelig "Identitet"-seksjon øverst:
- Logo (vis `selfAsset.logo_url` hvis satt, ellers initial-fallback i stedet for Shield)
- Juridisk navn (fall back til `name` hvis `legal_name` mangler)
- Org.nr + Land (samlet linje, f.eks. "933 036 729 · Norge")
- Nettside (klikkbar lenke)
- Kort beskrivelse (1–2 setninger fra self-asset)

Gjør samme oppdatering i preview-varianten lengre ned i filen (rundt linje 960–1075) som dupliserer headeren.

### 3. Readiness-sjekk
I `src/components/trust-center/PublishingReadiness.tsx` (eller tilsvarende readiness-logikk): legg til "Identitet" som et eget krav som må være komplett for at profilen skal regnes som troverdig. Manglende felter listes som åpne punkter:
- Juridisk navn
- Org.nr
- Land
- Nettside
- Beskrivelse
- Logo

### 4. Redigering (`src/components/company/CompanyInfoForm.tsx`)
- Legg til input for `legal_name` og `country` (select med vanlige land, default Norge), lagre til `company_profile`.
- Implementer faktisk logo-opplasting (bruker eksisterende `company-logos` storage-bucket – samme mønster som i `AssetHeader.tsx` linje 382), lagre `logo_url` på self-asset.
- Vis "Mangler – legg til" badge på tomme minimumsfelt.

### 5. i18n
Legge til EN/NB nøkler: `identity.legal_name`, `identity.country`, `identity.description`, `identity.logo`, `identity.missing`.

## Tekniske detaljer
- Migrasjon: `ALTER TABLE public.company_profile ADD COLUMN legal_name text, ADD COLUMN country text;`
- Beskrivelse leses allerede via `selfAsset` i Trust Profile-spørringen – gjenbruk eksisterende query.
- Logo-opplasting: gjenbruk pattern fra `AssetHeader.tsx` (samme bucket, `${assetId}/${filename}`).

## Filer som påvirkes
- `supabase/migrations/<ny>.sql` (ny)
- `src/pages/TrustCenterProfile.tsx`
- `src/components/company/CompanyInfoForm.tsx`
- `src/components/trust-center/PublishingReadiness.tsx`
- i18n-filer (nb/en)
