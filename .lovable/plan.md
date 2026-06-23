## Problem

I dag har partner to «Innstillinger»-innganger:

1. **PartnerNav** (sidebar-meny) → `/msp-settings` med fanene *Generelt / Tilbudsmal / Integrasjoner*
2. **Bunnen av sidebar** → `Innstillinger`-submeny (Organisasjon, Tilgang, Varsler)

Det skaper duplikat og forvirring. Innstillinger skal kun ligge i bunnmenyen.

## Endring

### 1. Fjern «Innstillinger» fra PartnerNav
I `src/components/Sidebar.tsx` (`PartnerNav`-items) fjernes raden `{ name: "Innstillinger", href: "/msp-settings", ... }`. Ruten `/msp-settings` består — den nås nå via bunnmenyen.

### 2. Flytt partner-innstillingene ned i bunnmenyen
`settingsMenu` utvides med partner-spesifikke punkter som kun vises når brukeren er i partner-modus:

```text
Innstillinger (bunn)
├── Organisasjon            (eksisterende)
├── Tilgang                 (eksisterende)
├── Varsler                 (eksisterende)
├── ─────────              (skille, kun partner)
├── Partner – Generelt      → /msp-settings?tab=generelt
├── Partner – Tilbudsmal    → /msp-settings?tab=tilbudsmerking
└── Partner – Integrasjoner → /msp-settings?tab=integrasjoner
```

Partner-punktene rendres bare når `isPartnerMode` (samme sjekk som styrer at `PartnerNav` vises).

### 3. Tab styres av URL
`MSPPartnerSettings` leser `?tab=` fra `useSearchParams` og setter `Tabs.value`. Når brukeren bytter fane manuelt, oppdateres URL-en (`setSearchParams`) — slik at bunnmeny-aktiv-tilstand stemmer og deep-links virker.

### 4. Aktiv-markering i bunnmenyen
`settingsMenu`-knappen sammenligner i dag bare `location.pathname === item.href`. Endres til å også matche query-param for partner-punktene, slik at riktig rad er uthevet.

## Filer som endres

- `src/components/Sidebar.tsx` — fjern entry fra `PartnerNav`, utvid `settingsMenu`-rendring med betinget partner-blokk, oppdater aktiv-sammenligning.
- `src/pages/MSPPartnerSettings.tsx` — koble `Tabs value` til `?tab=`-param.

## Ut av scope
- Ingen ruter slettes.
- Innholdet i hver fane endres ikke.
- Ingen DB-endringer.
