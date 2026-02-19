

# Mynder Me - Datadeling og innholdsstyring

## Oversikt

Bygge en ny fane "Delt innhold" i Mynder Me-administrasjonen der compliance-ansvarlig kan velge hvilke data fra plattformen som skal deles med ansatte via Mynder Me-appen. Dataene formidles i et forenklet, ansattvennlig format.

## Hvilke data er relevante for ansatte?

Basert på dataene som allerede finnes i plattformen, er dette informasjonen ansatte har rett til og nytte av:

### 1. Behandlingsprotokoller (ROPA)
- **Kilde:** `system_processes` - prosesser som behandler personopplysninger
- **Verdi for ansatt:** "Slik bruker vi dine personopplysninger" - forenklet oversikt over formalet med behandlingen, rettslig grunnlag, og hvem som har tilgang

### 2. AI-systemer som pavirker ansatte
- **Kilde:** `ai_system_registry` - AI-systemer med risikovurdering
- **Verdi for ansatt:** Transparens om hvilke AI-systemer som brukes, om de tar automatiserte beslutninger, og grad av menneskelig tilsyn (AI Act Art. 13-14)

### 3. Systemer som behandler ansattdata
- **Kilde:** `assets` (systemer/leverandorer) + `system_data_handling` (datalokasjoner, AI-bruk)
- **Verdi for ansatt:** Oversikt over hvilke systemer som lagrer deres data, og hvor dataene befinner seg geografisk

### 4. Underleverandorer / Databehandlere
- **Kilde:** `system_vendors` - underleverandorer med EU/EOS-status
- **Verdi for ansatt:** Hvem deler arbeidsgiveren personopplysningene mine med? Er de innenfor EU/EOS?

### 5. Hendelser og avvik
- **Kilde:** `system_incidents` - hendelser som kan pavirke ansatte
- **Verdi for ansatt:** Varsling om sikkerhetsbrudd som pavirker dem (GDPR Art. 34)

### 6. Sertifiseringer og rammeverk
- **Kilde:** `selected_frameworks` - aktive rammeverk virksomheten folger
- **Verdi for ansatt:** Trygghet om at arbeidsgiver tar personvern og sikkerhet pa alvor

## Teknisk implementering

### 1. Ny database-tabell: `mynder_me_shared_content`

Konfigurasjonstabell som styrer hva som er delt med ansatte:

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| `id` | uuid | Primaernokkel |
| `content_type` | text | Kategori: `processing_records`, `ai_systems`, `data_systems`, `vendors`, `incidents`, `frameworks` |
| `is_enabled` | boolean | Om kategorien er aktivert for deling |
| `display_title_no` | text | Norsk visningstittel for ansattappen |
| `display_description_no` | text | Norsk forklaring til ansatte |
| `filter_criteria` | jsonb | Valgfri filtrering (f.eks. kun bestemte arbeidsomrader) |
| `created_at` / `updated_at` | timestamp | Tidsstempler |

### 2. Ny fane i MynderMeDashboard: "Delt innhold"

Ny komponent `SharedContentTab.tsx` med:
- Toggles for hver datakategori (behandlingsprotokoller, AI-systemer, systemer, leverandorer, hendelser, rammeverk)
- Forhåndsvisning av hva ansatte vil se for hver kategori
- Forklarende tekst for compliance-ansvarlig om hva som deles
- Teller som viser antall elementer i hver kategori

### 3. Nye API-endepunkter i `mynder-me-api`

| Endepunkt | Beskrivelse |
|-----------|-------------|
| `get-shared-content` | Returnerer oversikt over hva som er delt |
| `get-processing-records` | Forenklede behandlingsprotokoller |
| `get-data-systems` | Systemer som behandler ansattdata |
| `get-vendors` | Databehandlere/underleverandorer |
| `get-frameworks` | Aktive rammeverk og sertifiseringer |

Hvert endepunkt sjekker at kategorien er aktivert i `mynder_me_shared_content` for det leveres data.

### 4. Oppdatert UI

- Ny fane "Delt innhold" i tabsene (mellom "Varsler" og "Tilkoblinger")
- Kort-basert layout med en Switch-toggle per kategori
- Statuskort som viser "X behandlingsprotokoller delt", "Y AI-systemer synlige" osv.
- Forhåndsvisning-knapp som viser ansattens perspektiv

## Filer som endres/opprettes

| Fil | Endring |
|-----|---------|
| `supabase/migrations/...` | Ny tabell `mynder_me_shared_content` + seed-data |
| `src/components/mynder-me/SharedContentTab.tsx` | Ny komponent for innholdsstyring |
| `src/components/mynder-me/MynderMeDashboard.tsx` | Legge til ny fane |
| `supabase/functions/mynder-me-api/index.ts` | Nye endepunkter for delt innhold |
| `src/integrations/supabase/types.ts` | Oppdateres automatisk |

