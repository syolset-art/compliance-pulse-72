

## Plan: Flytt prioritet til «Bruk og kontekst» og fjern fra header

### Hva endres
Prioritet-velgeren fjernes fra AssetHeader og legges inn som et fjerde kort i grid-en i VendorUsageTab (ved siden av Kritikalitet, Risikonivå og GDPR-rolle). Ribbon i headeren viser fortsatt prioritet som read-only indikator, men uten mulighet til å endre den der.

### Endringer

#### 1. `src/components/asset-profile/tabs/VendorUsageTab.tsx`
- Endre grid fra `sm:grid-cols-3` til `sm:grid-cols-4` (evt. `sm:grid-cols-2 lg:grid-cols-4`)
- Legge til et nytt Prioritet-kort etter GDPR-rolle-kortet med:
  - Ikon: `Flag` (eller tilsvarende)
  - Select med verdiene: Kritisk, Høy, Medium, Lav, Ikke satt
  - Fargekoding tilsvarende eksisterende prioritetskonfig
  - Forklaringstekst om at prioritet brukes til filtrering og oppfølging
  - Lenke til fremtidig kobling mot risikoscenarier
- Legge til `priorityOptions`-array i filen
- Bruke eksisterende `handleFieldChange("priority", v)` for lagring

#### 2. `src/components/asset-profile/AssetHeader.tsx`
- Fjerne den interaktive `Select`-komponenten for prioritet (linje ~591-620)
- Beholde read-only prioritets-visningen i ribbon (dot + label)

### Filer som endres
1. `src/components/asset-profile/tabs/VendorUsageTab.tsx` — Nytt prioritetskort i grid
2. `src/components/asset-profile/AssetHeader.tsx` — Fjerne prioritets-Select

### Ingen databaseendringer
`priority`-kolonnen finnes allerede i `assets`-tabellen.

