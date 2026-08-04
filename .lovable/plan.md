# Sensitive personopplysninger på GDPR-rolle

Når brukeren setter GDPR-rolle på en leverandør, skal det også kunne registreres om leverandøren behandler sensitive personopplysninger (særlige kategorier, GDPR art. 9).

## Hva brukeren får

I kortet "GDPR-rolle" på leverandørens Bruk-fane:

- Så snart en rolle er valgt (Behandlingsansvarlig, Databehandler eller Felles behandlingsansvarlig) vises en enkel av/på-bryter: **"Behandler sensitive personopplysninger"**.
- Slås den på, kommer et lite felt der brukeren kan huke av hvilke kategorier det gjelder: helseopplysninger, biometri, genetiske data, etnisitet, religion/livssyn, fagforeningsmedlemskap, seksuelle forhold, politisk oppfatning, straffedommer.
- Er rollen "Ikke satt", vises bryteren ikke — den hører til rollevalget.
- Er bryteren på, får kortet en tydelig, rolig markør ("Særlige kategorier") og teksten under oppdateres til å nevne at det stiller strengere krav (DPA, risikovurdering, ev. DPIA).
- Alt lagres direkte, på samme måte som de andre feltene i kortet.

## Hva det påvirker

- Leverandøren regnes som høyere eksponert i den avledede risikoen: sensitive personopplysninger gir et påslag på risikoscoren, på linje med hvordan åpne avvik og manglende dokumentasjon gjør i dag.
- Lenken "Påvirker: Personvern og datahåndtering" beholdes.
- Ingen endring i scoringsmodellen for modenhet — dette er et risikosignal, ikke et kravsvar.

## Teknisk

- Migrasjon på `assets`: nye kolonner `processes_sensitive_data` (boolean, default false) og `sensitive_data_categories` (text[], default tomt).
- `src/components/asset-profile/tabs/VendorUsageTab.tsx`: utvid GDPR-kortet med bryter + kategorivalg (Popover med checkbokser), lagret via eksisterende `handleFieldChange`. Nullstiller `processes_sensitive_data` og kategoriene hvis rollen settes tilbake til "Ikke satt".
- Ny konstant `SENSITIVE_DATA_CATEGORIES` i `src/lib/criticality.ts` eller egen liten fil, slik at samme liste kan gjenbrukes i AddVendorDialog senere.
- `src/lib/derivedRisk.ts`: legg til `processesSensitiveData` som input og gi et påslag i risikoscoren.
- Bruk semantiske tokens (`text-warning`, `bg-warning/10`) for markøren — ingen hardkodede farger.
