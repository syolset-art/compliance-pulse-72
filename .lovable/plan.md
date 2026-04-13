

## Plan: Legg til «Tilgang og roller»-fane i leverandørprofilen

### Hva bygges
En ny fane i leverandørens Trust Profile som viser **hvem som har tilgang** til leverandøren, med tydelig skille mellom **lesetilgang** (kan se) og **utføringstilgang** (kan gjøre endringer/oppgaver).

### Endringer

#### 1. Ny komponent: `VendorAccessTab.tsx`
Opprette `src/components/asset-profile/tabs/VendorAccessTab.tsx` med:

- **To seksjoner** med tydelig visuelt skille:
  - **Kan se** (lesetilgang): Liste over roller/personer som har innsyn i leverandørprofilen
  - **Kan utføre** (skrivetilgang): Liste over roller/personer som kan redigere, opprette oppgaver, laste opp dokumenter, endre status
- Hver person/rolle vises med navn, rolle-badge (fra `ROLE_LABELS`), og fargekode (fra `ROLE_COLORS`)
- Demo-data med realistiske roller (Compliance-ansvarlig, Leverandøransvarlig, IT-ansvarlig, Daglig leder, etc.)
- Informasjonsboks som forklarer forskjellen mellom tilgangsnivåene
- Knapp for «Legg til tilgang» (placeholder CTA)

#### 2. Registrere fanen i `AssetTrustProfile.tsx`
- Legge til `{ value: 'vendor-access', label: 'Tilgang', labelFull: 'Tilgang og roller' }` i `allVendorTabs`
- Legge til `TabsContent` med den nye komponenten
- Plasseres i «Vis flere»-menyen (etter aktivitetslogg)

### Filer som endres
1. **`src/components/asset-profile/tabs/VendorAccessTab.tsx`** — Ny fil
2. **`src/pages/AssetTrustProfile.tsx`** — Registrere fanen og importere komponenten

### Ingen databaseendringer
Bruker demo-data med roller fra eksisterende `useUserRole`-hook.

