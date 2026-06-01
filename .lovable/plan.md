## Mål

På den publiserte Trust Profilen skal "Kritiske leverandører" og system-listen slås sammen til **én** seksjon som ruller opp på leverandørnivå. Hver rad viser leverandøren (f.eks. "Microsoft — skyinfrastruktur og samhandling · databehandler · DPA ✓"), og kan ekspanderes for å vise systemene som leverandøren leverer — hvert med eget behandlingssted.

## Nåværende tilstand

- `CriticalVendorsSection` (rendert i `TrustCenterProfile.tsx` linje 894) viser topp 5 vendor-assets med kritikalitet og risikopille.
- Systemer vises i dag som egen liste/komponent i intern visning, men er ikke knyttet til vendor-raden på publisert profil.
- I databasen er `systems.vendor_asset_id → assets.id` (leverandør). `system_data_handling.data_locations[]` inneholder behandlingssted per system. `assets.gdpr_role` brukes for «databehandler»-etiketten, og DPA finnes som `vendor_documents` av type DPA knyttet til leverandøren.

## Endring

### 1. Ny komponent: `VendorSystemsRollupSection`
Erstatter `CriticalVendorsSection` på Trust Profile-visningen.

Hver rad (collapsed) viser:
- Leverandørnavn (`assets.name`)
- Kort beskrivelse / kategori (`vendor_category` eller `description`)
- GDPR-rolle som chip («Databehandler» / «Behandlingsansvarlig» fra `gdpr_role`)
- DPA-status (`✓` hvis det finnes et `vendor_documents`-dokument av DPA-type for leverandøren, ellers `–`)
- Land/region om tilgjengelig
- Kritikalitets- og risikopille (gjenbruk `getCriticality` + `computeRisk` som i dag)
- Chevron + antall systemer (f.eks. «3 systemer»)

Ekspandert tilstand viser en innfelt liste over systemer (`systems` der `vendor_asset_id = vendor.id`), hvor hvert system viser:
- Systemnavn + kort beskrivelse
- Behandlingssted (`system_data_handling.data_locations`) som badges
- Eventuelt risiko/kritikalitet på systemet

### 2. Data
Én Supabase-spørring som henter alle vendor-assets sortert etter kritikalitet/risiko (som i dag), pluss to parallelle spørringer:
- `systems` filtrert på `vendor_asset_id IN (...)` for å gruppere per leverandør
- `system_data_handling` for behandlingssteder
- `vendor_documents` (kun `document_type` for DPA-flagg) per `vendor_id`

Bygges som tre `useQuery`-kall, eller én kombinert med `select`-joins der det er enkelt. Resultatet mappes til `{ vendor, systems: [{system, locations[]}], hasDpa }[]`.

### 3. UI / interaksjon
- Bruker eksisterende `Collapsible` (`@/components/ui/collapsible`) for ekspander/kollapser.
- Beholder Apple-minimal stilen og semantiske tokens (`bg-card`, `border-border`, success/warning/destructive for DPA og risiko).
- I `readOnly` (publisert) modus: ingen «Administrer»/«Legg til»-knapper, ingen navigasjon til `/vendors/:id`. Rad er kun trykkbar for å ekspandere.
- I redigeringsmodus (intern): beholder dagens «Administrer»-knapp.

### 4. Filer som skal endres / opprettes
- **Ny**: `src/components/trust-center/VendorSystemsRollupSection.tsx` — komponenten beskrevet over.
- **Endret**: `src/pages/TrustCenterProfile.tsx` linje 87 + 894 — bytt import og bruk fra `CriticalVendorsSection` til `VendorSystemsRollupSection`.
- **Slettet/avviklet**: `CriticalVendorsSection.tsx` (eller la stå hvis brukt andre steder — sjekkes; om kun her, fjernes).

Ingen DB-endringer. Ren frontend.

### 5. Tekster
- Seksjonstittel: «Leverandører og systemer» (NB) / «Vendors and systems» (EN).
- Undertekst: «Tredjeparter vi bruker, med tilhørende systemer og behandlingssted» / «Third parties we use, with their systems and processing locations».
- DPA-chip: «DPA ✓» / «DPA –».
- GDPR-rolle: «Databehandler» / «Behandlingsansvarlig» (mapping fra `gdpr_role`).

## Ut av scope
- Endringer i intern leverandør- eller systemside.
- Endringer i datamodellen.
- Redigering av systemer fra Trust Profile-visningen.
