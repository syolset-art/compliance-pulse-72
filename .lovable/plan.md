
# Deling av privat Trust Profile

Siden Trust Profile ikke skal publiseres offentlig ennå, gir vi brukeren en kontrollert måte å dele den med utvalgte kunder/leverandører.

## Kjernevalg

**Token-lenke som standard** (rask, friksjonsfri) + **e-postinvitasjon som opsjon** (sporing per mottaker).

## Bruksflyt

Ny knapp «Del profil» i Trust Profile-headeren og på dashbordet, som åpner en dialog med to faner:

### Fane 1 — Privat lenke (default)
- Klikk «Generer lenke» → produserer unik URL: `trust.mynder.no/s/{token}` (32-tegns tilfeldig token)
- Kopier-til-utklippstavle-knapp
- Innstillinger: utløpsdato (7d / 30d / 90d / aldri), passordbeskyttelse (valgfritt 4-6 siffer)
- Liste over aktive lenker med visningstall og «Trekk tilbake»-knapp

### Fane 2 — Inviter via e-post (opsjon)
- Legg til én eller flere e-postadresser + valgfri personlig melding
- Systemet sender e-post med unik lenke per mottaker
- Sporing: hvem har åpnet, når, hvor mange ganger
- Kan trekke tilbake tilgang per mottaker

## Filer som endres/lages

**Nye:**
- `src/components/trust-center/ShareTrustProfileDialog.tsx` — dialog med to faner
- `src/components/trust-center/ShareLinksList.tsx` — liste over aktive lenker + status
- `src/pages/SharedTrustProfile.tsx` — mottakerside som validerer token og viser profil (read-only variant av `TrustCenterProfile`)
- Migrasjon: tabell `trust_share_links` (id, asset_id, token, expires_at, password_hash nullable, recipient_email nullable, personal_message, revoked_at, view_count, last_viewed_at, created_by, created_at) + `trust_share_link_views` (link_id, viewed_at, ip_hash, user_agent) for sporing
- Edge function `validate-trust-share-link` (validerer token/passord, logger visning, returnerer profil-data)
- Edge function `send-trust-share-invite` (app email via Lovable Emails)
- React Email template `trust-share-invitation.tsx`

**Endres:**
- `src/components/dashboard-trust/TrustProfileHero.tsx` — legg til «Del profil»-knapp
- `src/pages/TrustCenterProfile.tsx` — legg til «Del profil»-knapp i header
- `src/App.tsx` — ny route `/s/:token` → `SharedTrustProfile`

## Sikkerhet
- Token: 32 tegn, kryptografisk tilfeldig (`gen_random_bytes`)
- RLS: kun eier kan lese/opprette/tilbaketrekke lenker for sine egne assets
- Public route `/s/:token` går via edge function med service role — validerer token, sjekker `expires_at` og `revoked_at`, verifiserer passord om satt
- Ingen indeksering (robots noindex på delt side)
- IP hashes for anonymisert sporing (GDPR-vennlig)

## Ute av scope
- Offentlig publisering (fortsatt skjult)
- OAuth/kunde-innlogging
- Kommentarer/spørsmål fra mottaker (kan komme senere)

## Åpne spørsmål å bekrefte før bygging
1. Skal delt profil vise **alle** seksjoner, eller skal brukeren kunne velge hva som skal med per lenke (f.eks. skjule kontakter/dokumenter)?
2. Er e-postinvitasjon-sporing (åpninger per mottaker) viktig nok å prioritere i første versjon, eller starter vi kun med token-lenke og legger e-post til senere?
