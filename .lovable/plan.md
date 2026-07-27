## Mål
Endre navnet på sidebarens "Flere tjenester"-seksjon til **Moduler** og fjern den lilla "Utforsk"-pillen på linje 776-778 i `src/components/Sidebar.tsx`.

## Endringer

### 1. Oversettelser
- `src/locales/nb.json`: endre `nav.moreServices` fra `"Flere tjenester"` til `"Moduler"`.
- `src/locales/en.json`: endre `nav.moreServices` fra `"More services"` til `"Modules"`.
- `src/locales/nb.json` + `en.json`: fjern eller tøm nøkkelen `nav.exploreBadge` (brukes bare til Utforsk-pillen).

### 2. Modul-definisjon
- `src/lib/partnerModules.ts`: oppdater `labelNb` for `more`-modulen fra `"Flere tjenester"` til `"Moduler"` og `labelEn` til `"Modules"`. Description kan stå som er.

### 3. UI
- `src/components/Sidebar.tsx` (linje 775-780): fjern `<Badge>` med "Utforsk" og beholde chevron. Knappen viser da kun "Moduler" + ChevronDown.
- Kommentarer i `Sidebar.tsx` som sier "Flere tjenester" oppdateres til "Moduler" for konsistens.

### Validering
- Rask `bun run build` eller `tsgo` for å sikre at fjerning av `t("nav.exploreBadge")` ikke feiler andre steder.
- Sjekk at pillen er borte og teksten "Moduler" vises i sidebaren.