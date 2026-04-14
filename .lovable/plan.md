

## Plan: Brukerstyrt fanevisning med «Vis flere» og redigerbar fanestruktur

### Hva endres
Faner som **Revisjon og risikovurdering**, **Relasjoner**, **Forespørsler** og **Hendelser** flyttes til «Vis flere»-menyen som standard, slik at bare de viktigste fanene (Veiledning, Bruk & kontekst, Leveranser, Dokumentasjon) vises direkte. En **pluss-knapp (+)** ved siden av fanene åpner en dialog der brukeren kan velge hvilke faner som skal være synlige i fanelinjen.

### Endringer

#### 1. `src/pages/AssetTrustProfile.tsx`

**Ny state:** `visibleTabIds` — en array med fane-ID-er brukeren har valgt å vise. Standard: `['overview', 'usage', 'deliveries', 'evidence']` (4 faner).

**Ny logikk:**
- `vendorTabDefs` baseres på `visibleTabIds` i stedet for en statisk `slice(0, N)`
- `vendorOverflowTabDefs` = alle faner som **ikke** er i `visibleTabIds`
- Mobil beholder maks 4 synlige, desktop tillater opptil 6-7

**Ny pluss-knapp (+):**
- Vises etter TabsList, ved siden av «Vis flere»-knappen
- Åpner en `DropdownMenu` (eller en liten dialog/popover) med alle tilgjengelige faner som checkboxer
- Brukeren krysser av/fjerner faner fra fanelinjen
- Endringer lagres i `localStorage` (key: `mynder_vendor_tab_prefs`) for persistens

**Standard synlige faner (desktop):**
1. Veiledning fra Mynder
2. Bruk & kontekst
3. Leveranser
4. Dokumentasjon

**Faner som flyttes til «Vis flere» som standard:**
- Relasjoner
- Revisjon og risikovurdering
- Forespørsler
- Hendelser
- Aktivitetslogg
- Tilgang og roller

#### 2. UI-detaljer
- Pluss-knappen: `Settings2` eller `Plus`-ikon, `variant="ghost"`, `size="icon"`, plassert etter «Vis flere»-knappen
- Popover med tittel «Tilpass faner» / «Customize tabs»
- Hver fane vises som en rad med checkbox + fanens fulle navn
- «Veiledning fra Mynder» er alltid synlig (låst, ikke mulig å skjule)
- Maks 7 synlige faner for å unngå at fanelinjen blir for bred

### Tekniske detaljer

**Fil som endres:** `src/pages/AssetTrustProfile.tsx`

- Ny state: `const [visibleTabIds, setVisibleTabIds] = useState<string[]>(() => { ... hent fra localStorage ... })`
- Ny komponent inline: Tab-tilpasnings-popover med `Checkbox` for hver fane
- `vendorTabDefs` = `allVendorTabs.filter(t => visibleTabIds.includes(t.value))`
- `vendorOverflowTabDefs` = `allVendorTabs.filter(t => !visibleTabIds.includes(t.value))`
- Persistens via `localStorage.setItem('mynder_vendor_tab_prefs', JSON.stringify(ids))`

**Ingen databaseendringer.**

