## Mål
Legg til arkfaner på siden **Tjenester** (`/msp-services`) med to faner:
1. **Tjenestekatalog** (nåværende innhold)
2. **Innstillinger** (ny) — overordnet timepris + tilbudsmal (logo, slagord)

## Endringer

### 1. `src/pages/MSPServiceCatalog.tsx`
- Pakk innholdet i `<Tabs defaultValue="catalog">` med `TabsList` + to `TabsTrigger`:
  - "Tjenestekatalog" (`value="catalog"`) — viser `<MSPServiceCatalogTab />`
  - "Innstillinger" (`value="settings"`) — viser ny `<MSPServiceSettingsTab />`
- Behold sidetittel "Tjenester" og ingress.

### 2. Ny hook `src/hooks/useServiceDefaults.ts`
- Persister overordnet standard timepris i `localStorage` (`msp-service-defaults-v1`), default `1500`.
- Samme mønster som `usePartnerBranding` (custom event for sync mellom hook-instanser).
- Eksporterer `{ defaultHourlyRate, setDefaultHourlyRate }`.

### 3. `src/components/msp/MSPServiceCatalogTab.tsx`
- Bytt lokal `useState<number>(1500)` for `hourlyRate` til initialverdi fra `useServiceDefaults()`.
- Beholder lokal state slik at brukeren fortsatt kan justere pr økt/visning, men den initialiseres fra standarden. Per-tjeneste-overstyring eksisterer allerede i `ServiceForm` (timepris-felt).

### 4. Ny komponent `src/components/msp/MSPServiceSettingsTab.tsx`
To kort:
- **Standard timepris**: number-input bundet til `useServiceDefaults`, hjelpetekst: "Brukes som utgangspunkt for alle tjenester. Du kan overstyre pr tjeneste i tjenestekortet."
- **Tilbudsmal**: gjenbruker `<PartnerBrandingCard />` (logo + navn/org) og legger til nytt felt **Slagord** (tagline) lagret via utvidet `usePartnerBranding`.

### 5. Utvid `usePartnerBranding`
- Legg til `tagline?: string` i `PartnerBrandingOverrides` og `PartnerBranding` (auto-fallback tom streng).
- `PartnerBrandingCard.tsx`: nytt input-felt "Slagord (valgfritt)" som vises i forhåndsvisningen under partnernavn.

## Teknisk
- Bruker shadcn `Tabs`, `Card`, `Input`, `Label` — alt allerede i prosjektet.
- Ingen DB-endringer; alle innstillinger lever i `localStorage` (samme mønster som eksisterende branding).
- Semantiske tokens kun (ingen rå farger).
