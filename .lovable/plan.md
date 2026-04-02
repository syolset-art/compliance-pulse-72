

## Plan: Redigerbar Trust Profile for intern visning

### Hva skal endres
Når brukeren ser sin egen Trust Profile (self-asset), skal headeren vise redigerbare felt for **bransje**, **kategori/klassifisering**, **org.nummer**, **land**, og **nettside** (vist som ren lenke, ikke full URL). Brukeren skal kunne redigere disse feltene inline før profilen publiseres.

### Endringer

**1. Utvid `AssetHeader.tsx` – Metadatarad for self-profiler**

Under firmanavn/beskrivelse-seksjonen, legg til en redigerbar metadatarad (kun for `isSelf`) med:

- **ORG.NR** – Viser `asset.org_number`, redigerbar via inline input
- **LAND** – Viser `asset.country`, redigerbar via Select (Norge, Sverige, etc.)
- **BRANSJE** – Viser bransje fra `companyProfile.industry`, redigerbar via inline input/Select
- **NETTSIDE** – Viser `asset.url` som kort klikkbar lenke (f.eks. "mynder.io") i stedet for full URL, med redigeringsmulighet via inline input
- **KATEGORI** – Ny Select for `asset.vendor_category` eller `asset.category` med klassifiseringsalternativer

Layout: 4-kolonne grid som i referansebildet (ORG.NR | LAND | BRANSJE | NETTSIDE).

**2. URL-visning – kort format**

Erstatt den nåværende `asset.url`-visningen (linje 424-434) slik at den viser bare domenenavnet:
```
new URL(asset.url).hostname  →  "mynder.io"
```
I stedet for hele URL-strengen.

**3. Redigeringsmodus for felter**

- Legg til edit-states for hvert felt (`editingIndustry`, `editingUrl`, etc.)
- Klikk på et felt åpner inline-input
- Lagring oppdaterer `assets`-tabellen via `updateAsset.mutate()`
- For bransje: oppdater også `company_profile`-tabellen

**4. Kategori/klassifisering**

Legg til en Select med typiske kategorier:
- SaaS / Programvare / Konsulenttjenester / Produksjon / Finans / Helse / Offentlig / Annet

Lagres i `asset.category`-feltet.

### Filer som endres
- `src/components/asset-profile/AssetHeader.tsx` – Ny metadatarad med redigerbare felter, kort URL-format, kategori-velger

