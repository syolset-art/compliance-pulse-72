

## Plan: Fjern rollebasert dimming fra sidemenyen

### Hva endres

Sidemenyen dimmer i dag menypunkter basert på brukerens rolle (40% opacity for "ikke-relevante" lenker via `ROLE_SIDEBAR_HIGHLIGHTS`). Dette fjernes slik at alle menypunkter vises likt for alle brukere.

### Tekniske endringer

**Fil: `src/components/Sidebar.tsx`**
- Fjern import av `useUserRole` og `ROLE_SIDEBAR_HIGHLIGHTS`
- Fjern `primaryRole` og `highlights` variablene
- Forenkle alle `className`-logikk: fjern `isHighlighted`-sjekken og bruk kun `isActive` vs standard styling (full opacity for alle)

**Fil: `src/components/dashboard-v2/NextActionCards.tsx`**
- Fiks build-feilen: variabelen `top3` finnes ikke men filen ser korrekt ut — dette kan skyldes at filen ikke ble lagret riktig. Skriver filen på nytt for å sikre ren tilstand.

**Fil: `src/components/dashboard/RoleSwitcher.tsx`**
- Slett filen (den brukes ikke noe sted)

Ingen databaseendringer.

