

## Plan: Legg til brukerdefinert prioritet på leverandører

### Hva bygges
En prioritetsfunksjon der kunden selv kan sette prioritet (f.eks. Kritisk, Høy, Medium, Lav) på hver leverandør. Prioriteten vises på leverandørkort og i listen, og kan brukes som filter i leverandøroversikten.

### Endringer

#### 1. Database: Ny kolonne `priority` på `assets`-tabellen
- Migrering: `ALTER TABLE assets ADD COLUMN priority text DEFAULT null;`
- Fritekst-kolonne slik at kunder kan bruke forhåndsdefinerte verdier (critical/high/medium/low) men også egne verdier i fremtiden

#### 2. Leverandørprofil (`AssetHeader.tsx`)
- Legge til en klikkbar prioritets-badge i header-metadata-raden
- Klikk åpner en Select-dropdown med valgene: Kritisk, Høy, Medium, Lav, (Ingen)
- Lagrer direkte til `assets.priority` via Supabase update
- Fargekoding: Kritisk=rød, Høy=oransje, Medium=gul, Lav=grønn

#### 3. Leverandørkort (`VendorCard.tsx`)
- Vise prioritets-badge på kortet (hvis satt)
- Samme fargekoding som i headeren

#### 4. Leverandørliste-filter (`VendorListTab.tsx`)
- Legge til `priorityFilter` state
- Legge til prioritets-filter i filter-popoveren
- Filtrere listen basert på valgt prioritet
- Oppdatere Asset-interfacet med `priority`-felt

### Filer som endres
1. **Database-migrering** — Ny `priority`-kolonne på `assets`
2. **`src/components/asset-profile/AssetHeader.tsx`** — Prioritets-velger i headeren
3. **`src/components/vendor-dashboard/VendorCard.tsx`** — Prioritets-badge
4. **`src/components/vendor-dashboard/VendorListTab.tsx`** — Prioritets-filter

