## Mål
Erstatte dagens partnernavn-input-felt (med status-ikon) i `CompanyInfoForm.tsx` med en autocomplete/combobox som viser en dropdown-liste over tilgjengelige partnere når brukeren begynner å skrive. Prototypen skal illustrere at partnerne hentes fra en katalog (fremdeles hardkodet `PARTNER_DIRECTORY`).

## Endringer

### 1. UI-komponent: `CompanyInfoForm.tsx`
Bytt ut det nåværende `<Input>`-feltet for partnernavn (linje 517–555) med en shadcn-basert combobox:

```text
┌─────────────────────────────────────┐
│ Partnernavn                         │
│ ┌─────────────────────────────────┐ │
│ │ F.eks. Acme...         ▼        │ │
│ └─────────────────────────────────┘ │
│   Mynder MSP-partner AS             │
│   Acme IT AS                        │
│   NordSec AS                        │
│   7 Security                        │
└─────────────────────────────────────┘
```

- Bruk shadcn `Command` + `Popover` (allerede tilgjengelig i prosjektet) for en søkbar dropdown.
- Behold `PARTNER_DIRECTORY` som datakilde — dette er fortsatt en prototype.
- Ved valg av partner fra listen: forhåndsutfyll `partner_type`, `partner_role_description` og `partner_name` som i dag.
- Ved fritekst som ikke matcher listen: tillat fritekst-input (for manuell inntasting), men marker at partneren ikke finnes i katalogen.

### 2. Oppbevaring av eksisterende logikk
- Debounce-logikken fjernes — dropdown erstatter den.
- `partnerLookup`-state fjernes.
- Forhåndsutfylling av `partner_type` og `partner_role_description` beholdes.
- Tomt søk (ingen tekst) skal vise hele listen.

## Ikke i scope
- Ingen database-endringer — `PARTNER_DIRECTORY` forblir hardkodet.
- Ingen endringer i `usePartnerInfo`, `company_profile`-tabell eller andre komponenter.
- Ikke opprette en generisk `<PartnerAutocomplete>`-komponent nå (kan gjøres senere hvis behovet oppstår andre steder).