## Endring: Leverandørrad i aktivering av Trust Profile

På hver leverandørrad i aktiveringsveiviseren (steg "Kritiske leverandører") gjør vi to ting:

### 1. Fjern feltet "Dette er vår IT-/sikkerhetspartner"
Hele boksen med avkrysning + betinget "Type partner"-nedtrekk (linjene ca. 1798–1838 i `ActivateTrustProfileWizard.tsx`) tas bort.

### 2. Gjør "Hva gjør de for dere?" om til en nedtrekksliste
I stedet for et fritekstfelt blir dette en `Select` der brukeren velger leverandørtype. Listen inkluderer MSP og MSSP, samt vanlige kategorier:

- MSP (Managed Service Provider)
- MSSP (Managed Security Service Provider)
- IT-partner
- Skytjeneste / hosting
- HR-system
- Økonomi / fakturering
- Kommunikasjon / e-post
- Markedsføring
- Konsulent
- Annet

"Annet" viser et lite fritekstfelt så brukeren kan presisere.

### 3. Datamodell
- `CriticalVendorRow` beholder `purpose` (nå satt fra valgt nedtrekksverdi, ev. fritekst når "Annet").
- `isSecurityPartner` fjernes fra typen og default-rad.
- `partnerType` beholdes og settes automatisk når brukeren velger MSP / MSSP / IT-partner / Konsulent — slik at `handlePublish` fortsatt kan plukke ut sikkerhetspartner basert på `partnerType` i stedet for `isSecurityPartner`.

### 4. `handlePublish`
Logikken som i dag filtrerer på `v.isSecurityPartner` byttes til å filtrere på `v.partnerType` i settet `{msp, mssp, it_partner}`. Resten av partner-payloaden (showOnProfile, grantAuthority, additional[]) er uendret.

### Filer som endres
- `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx` — fjerne checkbox-blokk, erstatte purpose-input med Select + valgfri "Annet"-input, oppdatere `CriticalVendorRow`-type, `EMPTY_ROW`, og `handlePublish`.

Ingen DB-endringer; `partner`-objektet som lagres beholder samme form.
