

## Plan: Personopplysningskategorier på Datahåndtering-fanen

### Problem
Fanen «Datahåndtering» mangler en seksjon for å registrere hvilke typer personopplysninger som samles inn. Oppbevaring og sletting henger logisk sammen med datatypene — uten å vite hva som samles inn, gir ikke retningslinjer for oppbevaring mening. Det finnes allerede en mock-basert `ProcessDataTypesTab` med kategorier (ORDINÆR, SENSITIV, SÆRLIG), men ingen database-tabell eller reell data bak.

### Løsning
Legg til en ny «Personopplysninger»-boks på Datahåndtering-fanen (asset-profile) der brukeren kan registrere hvilke datatyper som behandles, med kategori (Ordinær / Sensitiv / Særlig). Lagre i en ny tabell `asset_data_categories`. Oppbevarings-seksjonen kobles visuelt til disse datatypene.

### Database

**Ny tabell: `asset_data_categories`**

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| id | uuid PK | |
| asset_id | uuid NOT NULL | Referanse til asset |
| data_type_name | text NOT NULL | F.eks. «Fullt navn», «IP-adresse», «Helseopplysninger» |
| category | text NOT NULL DEFAULT 'ordinary' | `ordinary`, `sensitive`, `special` |
| retention_period | text | F.eks. «3 år», «Slettes ved oppsigelse» |
| legal_basis | text | F.eks. «Samtykke», «Avtale», «Berettiget interesse» |
| source | text DEFAULT 'manual' | `manual`, `ai_detected` (fra personvernerklæring/DPA-analyse) |
| created_at | timestamptz | |

RLS: Åpen tilgang (matcher eksisterende mønster for asset-tabeller).

### UI-endringer

**`src/components/asset-profile/tabs/DataHandlingTab.tsx`**
- Legg til ny Card «Personopplysninger som behandles» plassert **over** «Oppbevaring og sletting»
- Viser registrerte datatyper med fargekodede kategori-badges (blå=Ordinær, oransje=Særlig, rød=Sensitiv) — gjenbruk fargeskjema fra `ProcessDataTypesTab`
- «Legg til»-knapp åpner en enkel inline-form eller dialog med: navn, kategori (dropdown), oppbevaringstid, rettslig grunnlag
- Hver rad har slett-knapp
- AI-detekterte typer vises med en liten «AI»-badge
- Tom-tilstand: info-tekst om at AI kan kartlegge dette automatisk fra personvernerklæring

**Kobling til oppbevaring**
- «Oppbevaring og sletting»-seksjonen viser et hint/teller: «X datatyper uten definert oppbevaringstid» dersom noen registrerte datatyper mangler `retention_period`

### Forhåndsdefinerte datatyper (valgmeny)
Tilby vanlige norske personopplysningstyper som forslag:
- Fullt navn (fornavn, etternavn)
- Kontaktinformasjon (e-post, telefon, adresse)
- Fødselsnummer / personnummer
- IP-adresse
- Enhetsidentifikatorer
- Helseopplysninger
- Biometriske data
- Fagforeningsmedlemskap
- Strafferettslige opplysninger

### Filer

| Fil | Endring |
|-----|---------|
| **Migration** | Opprett `asset_data_categories` med RLS |
| `DataHandlingTab.tsx` (asset-profile) | Ny «Personopplysninger»-seksjon med CRUD, varsel om manglende oppbevaringstid |
| `ProcessDataTypesTab.tsx` | Migrer fra MOCK_DATA_TYPES til å hente fra `asset_data_categories` (valgfritt, fase 2) |

