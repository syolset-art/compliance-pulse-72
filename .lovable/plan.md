

# Auto-oppslag av nøkkelpersoner basert på BrReg-data

## Bakgrunn
Når brukeren oppgir virksomhetsnavn og vi slår opp i BrReg, får vi allerede bransje og antall ansatte. Basert på dette kan vi automatisk vise hvilke nøkkelroller som er **obligatoriske**, **anbefalte** eller **valgfrie** -- og la brukeren fylle inn navn og e-post for hver.

## Rollelogikk basert på BrReg-data

| Rolle | Obligatorisk | Anbefalt | Valgfritt | Betingelse |
|-------|-------------|----------|-----------|------------|
| Compliance-ansvarlig | Alltid | -- | -- | Alle virksomheter |
| Personvernombud (DPO) | Helse, Offentlig med 50+ | Finans med 50+, alle med 200+ | Resten | Basert på bransje + antall ansatte |
| Sikkerhetsansvarlig (CISO) | -- | Helse, Finans, Offentlig, eller 200+ | Resten over 50 | Skjult for under 50 i tech/annet |

Eksempel: En helsebedrift med 300 ansatte vil se:
- Compliance-ansvarlig: **Obligatorisk**
- Personvernombud: **Obligatorisk** (med forklaring: "Helseforetak som behandler helseopplysninger er pålagt å ha personvernombud")
- Sikkerhetsansvarlig: **Anbefalt**

## Endringer

### 1. Database: Nye kolonner i `company_profile`
Legge til 6 nye kolonner:
- `compliance_officer` (TEXT, nullable)
- `compliance_officer_email` (TEXT, nullable)
- `dpo_name` (TEXT, nullable)
- `dpo_email` (TEXT, nullable)
- `ciso_name` (TEXT, nullable)
- `ciso_email` (TEXT, nullable)

### 2. CompactCompanyOnboarding (chat-basert)
Etter at selskapet er valgt og bekreftet fra BrReg:
- Vise en ny seksjon **"Nøkkelpersoner"** mellom bedriftsinfo og domene-feltet
- Basert på `industry` og `employees` fra BrReg-oppslaget, vise feltene dynamisk med merking:
  - Rød stjerne + "Påkrevd" for obligatoriske
  - Blå "Anbefalt"-etikett med info-ikon og forklaring for anbefalte
  - Grå "Valgfritt"-etikett for valgfrie
- Hvert rollefelt har navn + e-post
- Compliance-ansvarlig er alltid synlig og obligatorisk
- "Bekreft"-knappen validerer at obligatoriske felt er utfylt

### 3. CompanyOnboarding (fullskjerm stegvis)
Legge til et nytt steg **"key-persons"** mellom "size" og "use-cases":
- Tittel: "Hvem har nøkkelrollene?"
- Undertittel basert på bransje, f.eks.: "Basert på at dere er i helsesektoren med 300 ansatte, er følgende roller relevante"
- Samme dynamiske logikk som compact-versjonen
- Stegindikator oppdateres fra 5 til 6 steg
- Navigasjonsrekkefølge: company -> industry -> size -> **key-persons** -> use-cases -> team-size

### 4. Lagring
Begge flytene lagrer de nye feltene til `company_profile`-tabellen ved submit.

## Teknisk detalj

Ny hjelpefunksjon `getRequiredRoles(industry, employeeCount)` som returnerer en liste med roller og deres status:

```text
function getRequiredRoles(industry, employees):
  roles = []

  roles.push({ id: "compliance", label: "Compliance-ansvarlig", status: "required" })

  if industry in ["helse", "offentlig"] AND employees >= 50:
    dpoStatus = "required"
    dpoReason = "Helseforetak/offentlige virksomheter med over 50 ansatte er pålagt..."
  else if industry in ["finans"] AND employees >= 50:
    dpoStatus = "recommended"
  else if employees >= 200:
    dpoStatus = "recommended"
  else:
    dpoStatus = "optional"
  roles.push({ id: "dpo", status: dpoStatus, reason: dpoReason })

  if employees >= 200 OR industry in ["helse", "finans", "offentlig"]:
    cisoStatus = "recommended"
  else if employees >= 50:
    cisoStatus = "optional"
  else:
    cisoStatus = "hidden"
  roles.push({ id: "ciso", status: cisoStatus })

  return roles
```

### Filer som endres
- **Ny migrasjon**: 6 nye kolonner i `company_profile`
- **Ny fil**: `src/lib/keyPersonnelRules.ts` -- hjelpefunksjon for rollelogikk
- **Endret**: `src/components/onboarding/CompactCompanyOnboarding.tsx` -- ny nøkkelperson-seksjon
- **Endret**: `src/components/onboarding/CompanyOnboarding.tsx` -- nytt steg "key-persons"
