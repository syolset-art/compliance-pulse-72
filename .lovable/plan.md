

## Plan: Nettverksbasert deling (LinkedIn-modell)

### Problem
I dag kan brukeren dele med hvem som helst — inkludert å legge til vilkårlige navn uten verifisering. Det bør fungere som LinkedIn: man kan bare dele med kontakter som har **godtatt å være i nettverket**.

### Konsept
Innfør en **nettverkstabell** (`network_connections`) som representerer godkjente forbindelser mellom organisasjoner. Deling og forespørsler begrenses til kontakter med status `accepted`.

### Database

**Ny tabell: `network_connections`**

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| id | uuid PK | |
| invited_by_user_id | uuid NOT NULL | Bruker som sendte invitasjon |
| organization_name | text NOT NULL | Navn på kontaktens organisasjon |
| contact_person | text | Kontaktperson |
| contact_email | text NOT NULL | E-post (brukes for identifisering) |
| connection_type | text NOT NULL | `customer` eller `vendor` |
| status | text NOT NULL DEFAULT 'pending' | `pending`, `accepted`, `declined` |
| invited_at | timestamptz DEFAULT now() | |
| accepted_at | timestamptz | |

RLS: Autentiserte brukere kan CRUD egne rader (`invited_by_user_id = auth.uid()`).

### UI-endringer

**1. ManageSharingDialog — erstatt hardkodede kunder**
- Fjern `DEMO_CUSTOMERS`-listen
- Hent fra `network_connections` der `status = 'accepted'`
- «Legg til kunde»-skjemaet erstattes med «Inviter til nettverk»-funksjon som oppretter en `pending`-rad
- Kontakter med status `pending` vises som grå/disabled med «Avventer»-badge
- Kun `accepted`-kontakter kan velges for deling

**2. SendRequestWizard — begrens leverandørvalg**
- I steg 2 (velg leverandør): vis kun leverandører som finnes i `network_connections` med `accepted` status, ELLER som allerede er registrert som assets av typen `vendor`
- Legg til info-banner: «Du kan bare sende forespørsler til leverandører i nettverket ditt»

**3. Ny «Nettverk»-seksjon på Forespørsler-siden**
- Ny fane «Nettverk» på `/customer-requests`-siden
- Viser alle forbindelser med status (akseptert, avventer, avslått)
- Knapp for å invitere nye kontakter (navn, e-post, type)
- Mulighet til å fjerne forbindelser

**4. Invitasjons-badge i sidebar**
- Vis antall ventende invitasjoner som badge (valgfritt, fase 2)

### Filer

| Fil | Endring |
|-----|---------|
| **Migration** | Opprett `network_connections`-tabell med RLS |
| `ManageSharingDialog.tsx` | Hent fra DB i stedet for demo-data, vis kun aksepterte kontakter |
| `SendRequestWizard.tsx` | Filtrer leverandører mot nettverksforbindelser |
| `CustomerRequests.tsx` (page) | Legg til «Nettverk»-fane |
| Ny: `NetworkTab.tsx` | Liste over forbindelser, inviter-skjema, statusvisning |
| `nb.json` / `en.json` | Nye oversettelser for nettverkskonseptet |

### Flyt
1. Bruker inviterer kontakt → rad opprettes med `pending`
2. Kontakt aksepterer (demo: umiddelbart eller via knapp) → status = `accepted`
3. Kun `accepted`-kontakter vises som delbare i ManageSharingDialog og SendRequestWizard

