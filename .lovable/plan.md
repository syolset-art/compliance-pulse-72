

# Legg til leverandor - Smart sokeflyt med BrReg, CVR, Bolagsverket

## Oversikt
En ny flyt for a legge til leverandorer fra Trust Profil-siden eller Assets-siden. Brukeren velger forst om de vil legge til en eller flere leverandorer, og deretter soker vi automatisk i offentlige registre basert pa land.

## Brukerflyt

### Steg 1: Velg antall
To knapper:
- **En leverandor** - Legg til en enkelt leverandor med detaljert informasjon
- **Flere leverandorer** - Legg til flere raskt etter hverandre (forenklet skjema per leverandor)

### Steg 2: Sok etter leverandor
Et sokefelt der brukeren skriver inn leverandornavn. Under feltet velger brukeren land med flagg-knapper:

- Norge (soker i BrReg API)
- Danmark (soker i CVR API - virk.dk)
- Sverige (soker i demo-data, Bolagsverket har ikke offentlig API)

Nar brukeren skriver og trykker sok:

**Prioritert sokerekkefolge:**
1. Offentlig register (BrReg/CVR) - soker pa navn via `https://data.brreg.no/enhetsregisteret/api/enheter?navn={query}`
2. Eksisterende vendor-database (assets-tabellen) - matcher mot allerede registrerte leverandorer
3. Nettsoek (fallback) - ber brukeren oppgi nettside-URL for manuell registrering

### Steg 3: Resultatvisning
Viser treff fra registeret som klikkbare kort:
- Selskapsnavn + org.nummer
- Bransje (naeringskode)
- Adresse
- Antall ansatte

Brukeren velger riktig treff, og felter fylles ut automatisk.

Dersom ingen treff:
- Viser "Fant ikke i registeret" med mulighet til a soke pa nytt
- Alternativ: "Legg inn manuelt" med felt for navn, land, nettside-URL
- Alternativ: "Sok i var database" som soker blant eksisterende vendors

### Steg 4: Kontaktperson (valgfritt)
Etter at leverandoren er valgt/opprettet:
- Kontaktperson (navn)
- E-post
- Rolle/tittel
Alle felt er valgfrie med "Hopp over"-knapp.

### Steg 5: Bekreftelse
Sammendrag av leverandoren som legges til, med "Legg til"-knapp.

For "Flere leverandorer"-flyten: Etter bekreftelse vises "Legg til ny" som starter fra steg 2 igjen, pluss en liste over allerede lagte leverandorer.

## Teknisk implementasjon

### Ny hook: `src/hooks/useVendorLookup.ts`
Utvidelse av BrReg-logikken til a stotte:
- **BrReg navnesok**: `GET https://data.brreg.no/enhetsregisteret/api/enheter?navn={query}&size=5`
- **CVR navnesok**: Demo-modus med simulert API-respons (CVR krever autentisering i produksjon)
- **Sverige**: Demo-modus med noen hardkodede svenske selskaper
- **Internt sok**: Query mot `assets`-tabellen der `asset_type = 'vendor'`
- Returnerer standardisert resultatformat uavhengig av kilde

### Database-endringer
Ny kolonne pa `assets` for kontaktinfo:
```sql
ALTER TABLE assets ADD COLUMN contact_person text;
ALTER TABLE assets ADD COLUMN contact_email text;
ALTER TABLE assets ADD COLUMN org_number text;
```

### Ny komponent: `src/components/dialogs/AddVendorDialog.tsx`
Egen dialog for leverandor-flyten, separert fra den generelle AddAssetDialog:
- Steg-basert wizard med fremdriftsindikator
- Bruker `useVendorLookup` for soket
- Minimalistisk, tilgjengelig design med WCAG-hensyn
- Responsivt - stacker vertikalt pa mobil

### Endrede filer
- `src/pages/Assets.tsx` - Koble "Legg til leverandor"-knappen til ny dialog
- `src/pages/AssetTrustProfile.tsx` - Legg til "Legg til leverandor"-knapp i header for self-type
- `src/locales/nb.json` og `src/locales/en.json` - Nye oversettelsesnokler

### Sokeresultat-format (standardisert)
```text
{
  source: 'brreg' | 'cvr' | 'bolagsverket' | 'internal' | 'manual',
  name: string,
  orgNumber: string | null,
  country: string,
  industry: string | null,
  address: string | null,
  employees: number | null,
  url: string | null
}
```

### UI-struktur for dialogen
```text
+------------------------------------------+
| Legg til leverandor                    X |
| Steg 1 av 4                             |
| [====--------] fremdrift                 |
|                                          |
| Hvor mange vil du legge til?             |
|                                          |
| [  En leverandor  ] [Flere leverandorer] |
+------------------------------------------+

+------------------------------------------+
| Legg til leverandor                    X |
| Steg 2 av 4                             |
|                                          |
| Sok etter leverandor                     |
| [Leverandornavn...              ] [Sok]  |
|                                          |
| Land:                                    |
| [Norge] [Danmark] [Sverige] [Annet]     |
|                                          |
| Resultater fra Bronnoysundregistrene:    |
|                                          |
| +--------------------------------------+ |
| | Visma AS               919 477 822   | |
| | IT-tjenester · Oslo · 200+ ansatte   | |
| +--------------------------------------+ |
| | Visma Software AS      936 854 572   | |
| | Programvare · Oslo                    | |
| +--------------------------------------+ |
|                                          |
| Fant ikke det du lette etter?            |
| [Sok i var database] [Legg inn manuelt]  |
+------------------------------------------+
```

### Demo-data for Sverige og Danmark
Noen hardkodede selskaper for prototypen:
- **Sverige**: Spotify AB, Klarna AB, Ericsson AB, IKEA
- **Danmark**: Novo Nordisk, Maersk, Lego, Vestas

