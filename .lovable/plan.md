

## Plan: Splitt opp i Leverandører, Systemer og Assets (med Enheter)

### Hva som endres

Dagens `/assets`-side samler leverandører, enheter og alle asset-typer i én fanestruktur. Vi splitter dette til tre separate menypunkter med egne sider, men beholder den felles `assets`-tabellen som grafstruktur via `asset_relationships`.

### Ny navigasjonsstruktur

```text
Sidebar:
  Dashboard
  Leverandører    → /vendors      (ny side, vendor-fokusert)
  Systemer        → /systems      (eksisterende side, justert)
  Assets          → /assets       (ny side: enheter + andre assets)
  Arbeidsområder  → /work-areas
  ...
```

### Nye sider og endringer

**1. `/vendors` — Ny `VendorDashboard.tsx`**
- Flytt all vendor-logikk fra nåværende `Assets.tsx` hit
- Beholder fanene: Oversikt, Krever handling, Kart, Leverandørkjede, Sammenlign
- "Legg til leverandør"-knapp + demo-data-meny
- Filtrerer `assets` der `asset_type = 'vendor'`

**2. `/systems` — Eksisterende `Systems.tsx`**
- Beholder som den er (bruker `systems`-tabellen)
- Legge til kolonne/felt som viser koblet leverandør (via `vendor`-feltet eller `asset_relationships`)

**3. `/assets` — Omskrevet `Assets.tsx`**
- Viser enheter (`hardware`) + andre asset-typer (ikke vendor)
- Faner: "Enheter", "Andre assets"
- "Legg til asset/enhet"-knapp
- Enheter klikker til `/assets/:id` (device trust profile)

**4. Sidebar (`Sidebar.tsx`)**
- Erstatt enkelt `nav.assets` med tre menypunkter:
  - `Leverandører` → `/vendors` (ikon: `Building2` eller `Package`)
  - `Systemer` → `/systems` (ikon: `Cloud` eller eksisterende)
  - `Assets` → `/assets` (ikon: `Monitor` eller `HardDrive`)

**5. Routing (`App.tsx`)**
- Legg til `/vendors` route → `VendorDashboard`
- `/systems` peker til eksisterende `Systems.tsx`
- `/assets` peker til omskrevet `Assets.tsx`
- Behold `/assets/:id` og `/systems/:id` for profil-sider

### Grafstruktur (datamodell)

Alle relasjoner mellom entiteter bruker eksisterende `asset_relationships`-tabell:

```text
Leverandør (asset) ←→ System (asset_relationships)
System ←→ Enhet (asset_relationships)
Leverandør ←→ Enhet (asset_relationships)
```

Ingen databaseendringer nødvendig — `asset_relationships` med `source_asset_id`, `target_asset_id` og `relationship_type` dekker alle koblinger.

### Filer som opprettes/endres

- **Ny:** `src/pages/VendorDashboard.tsx` — Vendor-fokusert side (kode fra Assets.tsx)
- **Endres:** `src/pages/Assets.tsx` — Omskrives til enheter + andre assets
- **Endres:** `src/pages/Systems.tsx` — Legge til vendor-kobling-visning
- **Endres:** `src/components/Sidebar.tsx` — Tre separate menypunkter
- **Endres:** `src/App.tsx` — Ny `/vendors` route
- **Endres:** `src/locales/en.json` + `nb.json` — Nye labels

