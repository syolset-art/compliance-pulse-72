

# Live hendelsesdata fra 7 Security til Mynder

## Konsept
Bygge en integrasjon der 7 Security som underleverandor kan pushe sikkerhetshendelser (incidents) direkte inn i Mynder. Hendelsene lander i Lara Innboks for godkjenning, og kobles automatisk til riktig system/vendor Trust Profil. Godkjente hendelser blir avvik i avviksregisteret.

## Dataflyt

```text
7 Security (live feed)
        |
        v
  Edge Function: "push-vendor-incidents"
  (mottar hendelser, validerer, lagrer)
        |
        +---> lara_inbox (ny type: "incident")
        |       Lara foreslaar matching til vendor/system
        |
        +---> system_incidents (etter godkjenning)
                Kobles til vendor asset + avviksregister
```

## Hva skal bygges

### 1. Database: Utvid system_incidents med kilde-sporbarhet
Legge til kolonner paa `system_incidents`:
- `source` (text) -- "manual", "7security", "acronis" etc.
- `source_incident_id` (text) -- ekstern ID fra leverandor
- `source_severity` (text) -- leverandorens egen alvorlighetsgrad
- `auto_created` (boolean) -- om den ble opprettet automatisk

Legge til ny `matched_document_type`-verdi "incident" i innboksen (ingen skjemaendring noedvendig, tekstfelt).

### 2. Edge Function: `push-vendor-incidents`
Ny backend-funksjon som simulerer mottak av live hendelsesdata fra 7 Security:
- Aksjon `push_incidents`: Mottar en liste med hendelser (tittel, alvorlighetsgrad, beskrivelse, paavirkede systemer)
- Aksjon `fetch_recent_incidents`: Henter siste hendelser fra 7 Security (mock) -- kan kalles fra UI
- For hver hendelse:
  - Oppretter innboks-element i `lara_inbox` med type "incident" og `matched_asset_id` satt til 7 Security-vendor
  - Setter confidence_score basert paa system-matching
  - Status = "new" (venter paa godkjenning)

Mock-data inkluderer realistiske hendelser:
- "Ransomware-forsok blokkert paa SRV-SQL01"
- "Uautorisert tilgangsforsok fra ekstern IP"
- "SSL-sertifikat utlopt paa webserver"
- "Mislykket backup paa NAS-BACKUP01"
- "Phishing-epost oppdaget og blokkert"

### 3. Lara Innboks: Stootte for hendelser
Utvide `LaraInbox.tsx`:
- Ny visuell type for hendelser (roed/oransje ikon istedenfor dokument-ikon)
- Godkjenning av hendelse oppretter automatisk et avvik i `system_incidents` med `source: "7security"`
- Vise alvorlighetsgrad-badge direkte i innboksen
- "Godkjenn"-knappen for hendelser oppretter avviket og kobler det til vendorens Trust Profil

### 4. Vendor Trust Profil: Hendelsefeed
Utvide `IncidentManagementTab` (asset-profile-versjonen):
- Ny seksjon "Live hendelser fra leverandor" med 7 Security-branding
- Knapp "Hent siste hendelser" som kaller edge-funksjonen
- Vise hendelser som ikke er behandlet ennaa med godkjenn/avvis-knapper
- Badge som viser antall ubehandlede hendelser
- Automatisk kobling mellom godkjente hendelser og avviksregisteret

### 5. Avviksregister: Kilde-indikator
Utvide `Deviations.tsx` og `DeviationCard`:
- Vise kilde-badge ("7 Security", "Manuell") paa avvikskort
- Filtreringsmulighet paa kilde
- Visuell indikator paa at avviket er automatisk opprettet

## Teknisk plan

### Steg 1: Database-migrasjon
```sql
ALTER TABLE system_incidents 
  ADD COLUMN source text DEFAULT 'manual',
  ADD COLUMN source_incident_id text,
  ADD COLUMN source_severity text,
  ADD COLUMN auto_created boolean DEFAULT false;
```

### Steg 2: Edge Function `push-vendor-incidents`
- Ny fil: `supabase/functions/push-vendor-incidents/index.ts`
- Oppdater `supabase/config.toml` med ny funksjon
- Mock-data med 5-6 realistiske sikkerhetshendelser
- To aksjoner: `fetch_recent_incidents` og `approve_incident`

### Steg 3: Frontend-endringer
- **LaraInbox.tsx**: Utvide med hendelsestype-stootte, alvorlighetsgrad-badges, og spesial-godkjenning som oppretter avvik
- **IncidentManagementTab.tsx** (asset-profile): Legge til "Live feed"-seksjon med hent-knapp og inline godkjenning
- **Deviations.tsx**: Legge til kilde-badge og filter
- **AddDeviationDialog.tsx**: Ingen endringer noedvendig (manuell flyt forblir uendret)

### Steg 4: Syntetiske data
Sette inn demo-hendelser i `lara_inbox` med type "incident" og kobling til 7 Security-asset for aa demonstrere flyten.

## Forventet resultat
- Kunden ser live hendelser fra 7 Security i Lara Innboks
- Hendelser kan godkjennes med ett klikk og blir automatisk avvik
- Trust Profilen til vendoren viser hendelseshistorikk
- Avviksregisteret viser tydelig hvilke avvik som kommer fra ekstern kilde
- Modellen er generaliserbar til andre leverandorer (Acronis, TietoEvry, osv.)

