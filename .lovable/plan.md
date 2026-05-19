## Mål
Partner skal slippe å logge inn for å lese meldinger. På en egen Innstillinger-side under partnerdelen ser de hvor mange brukere som har tilgang, og kan slå på videresending av alle Mynder-meldinger til en valgfri e-postadresse.

## Ny side: `MSPPartnerSettings`
Rute: `/msp-settings` (tilgjengelig fra Sidebar → "Innstillinger" og fra et tannhjul-ikon i MSPPartnerDashboard-headeren).

Layout: standard MSP-side med Sidebar + `pt-16`, maks-bredde `max-w-4xl`, tre seksjoner som Card:

### 1. Team-tilgang
- Header: "Brukere med tilgang til partnerdelen"
- Stor tallvisning (f.eks. `3 brukere`) + kort beskrivelse
- Liste med avatar, navn, e-post og rolle (Partner-admin / Partner-rådgiver). Henter fra `user_roles` join `profiles` (filtrerer på `msp_admin` + `msp_member`, faller tilbake til demo-data om tom).
- Knapp "Inviter bruker" (åpner placeholder-toast i denne iterasjonen — invitasjonsflyt er ikke i scope).

### 2. E-postvideresending av meldinger
- Toggle: "Videresend alle innkommende meldinger til e-post"
- Input: "Mottaks-e-post" (valideres som e-post)
- Valgfritt: "Kopi (CC)" og "Daglig sammendrag i stedet for hver melding"
- Hjelpetekst: "Du får alt — kundesvar, aksepterte tilbud, påminnelser — i innboksen din. Du trenger ikke logge inn i Mynder for å holde deg oppdatert."
- Lagre-knapp → persisteres i `localStorage` under nøkkelen som allerede brukes i `MSPMessages.tsx` (`msp-messages-settings-v1`) så innstillingene speiles begge steder.

### 3. (uendret) Lenke til Fakturering
Liten kort-lenke "Fakturering og adresse →" som peker til eksisterende `/msp-billing`-side, så Innstillinger blir det naturlige inngangspunktet.

## Endringer i eksisterende filer
- **`src/App.tsx`**: ny route `/msp-settings → MSPPartnerSettings`.
- **`src/components/Sidebar.tsx`** (MSP-seksjonen): legg til "Innstillinger" som nav-element nederst.
- **`src/pages/MSPPartnerDashboard.tsx`**: tannhjul-knapp i header som lenker til `/msp-settings`.
- **`src/pages/MSPMessages.tsx`**: behold eksisterende settings-dialog, men legg til en liten "Administrer i Innstillinger →"-lenke øverst i dialogen så det er én tydelig hovedplassering. Logikken og localStorage-nøkkelen deles.

## Datakilder
- Brukere: `supabase.from("user_roles").select("user_id, role, profiles(full_name, email)").in("role", ["msp_admin","msp_member"])`. Hvis tomt → vis 3 demo-brukere (samme tone som annen demo-data) slik at siden ikke ser tom ut.
- Forwarding-innstillinger: kun `localStorage` foreløpig (samme som dagens dialog). Ingen ny tabell i denne iterasjonen — kan flyttes til DB senere uten å endre UI.

## Ute av scope
- Faktisk e-postutsending fra backend (kun UI + lagrede preferanser).
- Invitasjonsflyt for nye partner-brukere.
- Rolleendring i UI.
