

## Plan: Mynder Core med Leverandør som tilleggsmodul

### Nåværende struktur
Begge moduler (Systemer og Leverandører) vises side om side som likestilte valgbare moduler under «Styringsverktøy». Ingen indikasjon på at Systemer er inkludert som standard.

### Ny struktur

**Mynder Core = Systemmodulen (standard inkludert)**
- Seksjon 3 heter «Mynder Core»
- Systemmodulen vises som kjernen i Mynder Core — alltid inkludert ved oppgradering
- Bruker velger kun tier (Basis/Premium) for Mynder Core

**Leverandørmodulen = separat tillegg**
- Vises som en egen seksjon (Steg 4) eller som et tydelig tillegg under Mynder Core
- Markert som «Tilleggsmodul» med egen pris
- Kan aktiveres uavhengig av Mynder Core-tier

### Filer som endres

**1. `src/lib/planConstants.ts`**
- `systems.displayName` → `"Mynder Core"`
- `systems.description` → oppdatert til å reflektere at dette er kjerneplatformen
- `vendors.displayName` → `"Leverandør (tillegg)"`

**2. `src/pages/Subscriptions.tsx`**
- Seksjon 3: Rename til «Mynder Core» — vis kun system-modulen med Basis/Premium-valg
- Seksjon 4 (ny): «Tilleggsmoduler» — vis Leverandørmodulen separat med tydelig «Valgfritt tillegg»-badge
- Oppdater intro-tekst til å forklare at Mynder Core inkluderer systemer, arbeidsområder og compliance

**3. `src/components/vendor-dashboard/VendorActivateDialog.tsx`**
- Oppdater tittel/beskrivelse til å reflektere at dette er en tilleggsmodul, ikke del av Mynder Core

