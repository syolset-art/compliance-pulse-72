

# Plan: Endre menynavn fra "Eiendeler" til "Leverandører"

## Oppsummering

Brukeren ønsker å endre menypunktet fra "Eiendeler" til "Leverandører" (Vendors på engelsk). Dette innebærer endring av:
1. Navigasjonsmenyen
2. Sidetittel og overskrifter
3. Alle relaterte oversettelser

---

## Endringer

### 1. Oppdater lokaliseringsfiler

**src/locales/nb.json:**
| Nøkkel | Fra | Til |
|--------|-----|-----|
| `nav.assets` | "Eiendeler" | "Leverandører" |
| `assets.title` | "Eiendeler" | "Leverandører" |
| `assets.addAsset` | "Legg til eiendel" | "Legg til leverandør" |
| `assets.addAssetDescription` | "...ny eiendel..." | "...ny leverandør..." |
| `assets.filterByAssetType` | "...eiendelstype" | "...leverandørtype" |
| `assets.allAssetTypes` | "Alle eiendelstyper" | "Alle leverandørtyper" |
| `assets.assetType` | "Eiendelstype" | "Leverandørtype" |
| `assets.noAssets` | "Ingen eiendeler funnet" | "Ingen leverandører funnet" |
| `assets.addSuccess` | "Eiendel lagt til" | "Leverandør lagt til" |
| `assets.deleteSuccess` | "Eiendel slettet" | "Leverandør slettet" |
| (og flere relaterte nøkler) | | |

**src/locales/en.json:**
| Nøkkel | Fra | Til |
|--------|-----|-----|
| `nav.assets` | "Assets" | "Vendors" |
| `assets.title` | "Assets" | "Vendors" |
| `assets.addAsset` | "Add Asset" | "Add Vendor" |
| (og tilsvarende endringer) | | |

---

### 2. Filer som endres

| Fil | Handling |
|-----|----------|
| `src/locales/nb.json` | Oppdatere nav.assets og assets.* nøkler |
| `src/locales/en.json` | Oppdatere nav.assets og assets.* nøkler |

---

## Viktig merknad

Menystrukturen i `Sidebar.tsx` bruker allerede oversettelsesnøkkelen `t("nav.assets")`, så selve menyen vil automatisk oppdateres når lokaliseringsfilen endres.

Datamodellen (`assets`-tabellen) forblir uendret - bare brukergrensesnittet endres til å bruke begrepet "Leverandører" i stedet for "Eiendeler".

