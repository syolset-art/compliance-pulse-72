

## Plan: Hent org.nr og nettside fra BrReg ved opprettelse av Trust Profile

### Hva skal endres
Når Trust Profile (self-asset) opprettes under onboarding, skal `org_number`, `url` (hjemmeside) og `country` hentes fra BrReg-oppslaget og lagres direkte på assetet. I tillegg skal SelfProfileMetadataRow vise demo-data som fallback.

### Endringer

**1. Utvid `useBrregLookup.ts` – returner `hjemmeside` fra API**
- BrReg API returnerer `hjemmeside` på enheter. Legg til dette feltet i `BrregData`-interfacet og returner det via `rawData`.

**2. Oppdater `CompanyOnboarding.tsx` – lagre BrReg-data på self-asset**
- Ved opprettelse av self-assetet (linje 214-222), inkluder `org_number`, `country: "Norge"`, og `url` (fra BrReg-oppslaget eller domain-feltet) i insert-kallet.
- Bruk `formData.org_number` direkte og konstruer URL fra `formData.domain` hvis tilgjengelig (f.eks. `https://formData.domain`).

**3. Oppdater `SelfProfileMetadataRow.tsx` – vis demo-data som fallback**
- Når felter som org_number, country, url mangler, vis plausible demo-verdier som placeholder (f.eks. "983 052 968", "Norge", "https://mynder.io") slik at profilen ser utfylt ut i demo-modus.

### Filer som endres
- `src/hooks/useBrregLookup.ts` – legg til `hjemmeside` i BrregData
- `src/components/onboarding/CompanyOnboarding.tsx` – send org_number/url/country til self-asset insert
- `src/components/asset-profile/SelfProfileMetadataRow.tsx` – demo-fallback for tomme felter

