## Mål
Partnernavn, organisasjonsnummer, webadresse og logo i Tilbudsmerking skal automatisk hentes fra brukerens trust profile (company_profile + self-asset), uten falske fallback-verdier som "Dintero AS".

## Endringer

### 1. `src/hooks/usePartnerBranding.ts`
- Utvid Supabase-query mot `company_profile` til å hente `name, legal_name, org_number, domain`.
- Legg til en ny query mot `assets` der `asset_type = 'self'` for å hente `logo_url`.
- Auto-felt:
  - `autoName = legal_name || name` (trimmet). Ingen "Dintero AS"-fallback — tom streng hvis ingenting finnes.
  - `autoOrgNumber = org_number`.
  - `autoDomain = domain`.
  - `autoLogoUrl = selfAsset.logo_url`.
- Overstyringer i localStorage vinner fortsatt over auto. Logo: hvis bruker ikke har lastet opp egen logo, brukes `autoLogoUrl` (URL fra storage), ellers data-URL fra overrides.
- Utvid `PartnerBrandingOverrides` og `PartnerBranding` med `domain` + `isAutoDomain`, og legg til `autoDomain`.

### 2. `src/components/msp/PartnerBrandingCard.tsx`
- Legg til input-felt **Webadresse** (auto-fylles, kan overstyres, samme mønster som navn/org).
- Vis webadresse i mini-preview under org.nr.
- Bytt hardkodet "Dintero AS"-placeholder/visning til `branding.autoName || "Mangler — fyll inn"`. Hvis auto-feltet er tomt og bruker ikke har overstyrt, vis hjelpetekst "Mangler — fyll inn i organisasjonsprofilen" med lenke til `/settings` (eller bare beskrivelse).
- Logo-knapp: hvis `autoLogoUrl` finnes og brukeren ikke har overstyrt, vis "Bruker logo fra organisasjonsprofil" og knapp "Last opp egen logo for tilbud" + "Tilbakestill til auto" når overstyrt.

### 3. Ingen DB-endringer
Alle data finnes allerede.

## Teknisk
- Kun frontend. To eksisterende Supabase-tabeller leses (`company_profile`, `assets`).
- React Query brukes som før; query-keys: `partner-branding-profile`, `partner-branding-self-asset`.
- Semantiske tokens for all styling.
