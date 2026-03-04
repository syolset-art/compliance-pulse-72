

## Analyse: Hvor hører maskiner og mobiltelefoner hjemme?

### Nåværende struktur

| Side | Innhold | Tabell |
|------|---------|--------|
| `/assets` | Kun leverandører (`asset_type = "vendor"`) | `assets` |
| `/systems` | Programvare/tjenester | `systems` |
| `/work-areas` | Arbeidsområder med tilknyttede eiendeler | `work_areas` + `assets` |

Acronis-synkroniseringen (`sync-acronis`) mapper allerede enheter til `assets`-tabellen med `asset_type = "hardware"`. Men **ingen side viser hardware-eiendeler i dag** — `/assets` filtrerer kun på `vendor`.

### Anbefaling: Ny fane "Enheter" på `/assets`-siden

`/assets`-siden er allerede bygget som et eiendelregister med faner. Den heter "Eiendeler" i navigasjonen. Det er naturlig å legge til en **"Enheter"**-fane her som viser alle `asset_type = "hardware"` eiendeler — PC-er, servere, mobiltelefoner, NAS etc.

Dette er også der Acronis-importerte enheter havner, så flyten blir:
1. Bruker kobler til Acronis → enheter synkroniseres til `assets` med `asset_type = "hardware"`
2. Bruker ser dem under "Enheter"-fanen på `/assets`

### Plan

**Fil: `src/pages/Assets.tsx`**
- Legg til ny fane **"Enheter"** (devices) mellom "Leverandører" og "Krever handling"
- Filtrer `assets` der `asset_type === "hardware"` for denne fanen
- Vis enkel tabell med kolonnene: Navn, Type (server/workstation/storage), OS, Status, Sist sett, Risiko
- Vis antall enheter i fane-badge
- Inkluder en "Synkroniser fra Acronis"-knapp i fanen for kunder med aktiv integrasjon

**Ny komponent: `src/components/devices/DeviceListTab.tsx`**
- Tabellvisning av hardware-eiendeler fra `assets`-tabellen
- Fargekodede statusbadger (protected/warning/critical) basert på `metadata.status`
- Viser hostname, OS, device_type fra `metadata`-feltet
- Klikkbar rad som navigerer til asset trust profile

**Fanetrekkefølge etter endring:**
```text
1. Leverandører (default)
2. Enheter ← NY
3. Krever handling
4. Kart
5. Leverandørkjede
6. Sammenlign
```

