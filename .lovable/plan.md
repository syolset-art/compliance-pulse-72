## Mål
Frigjøre vertikal plass på `/work-areas` ved å erstatte den brede chip-raden (og "vis mer"-knappen) med én kompakt velger.

## Ny UI
En enkelt knapp øverst i hovedflaten, ca. 280px bred:

```text
┌──────────────────────────────────────────────┐
│ ● Produktutvikling  · 10 sys · Moderat   ▾ │
└──────────────────────────────────────────────┘
```

Klikk åpner en `Popover` med shadcn `Command`:
- Søkefelt øverst (autofocus)
- Liste over alle arbeidsområder med fargeprikk, navn, systemtelling og risiko-pill
- Filter-chips (Mine / Medlem / Høy risiko / Lav risiko) som togglbare knapper i toppen av popoveren — erstatter dagens to filter-rader
- "+ Nytt arbeidsområde" som siste rad
- Tastaturnavigasjon (↑↓, Enter, Esc) følger med fra Command-komponenten

## Endringer i `src/pages/WorkAreas.tsx`
1. Fjern blokken som rendrer chip-rad (linjene ~747–774) og "vis mer"-knappen (~776–784).
2. Fjern den nåværende filter-raden (~691–744) — flyttes inn i popoveren.
3. Legg til ny komponent `WorkAreaSwitcher` rett under headeren som:
   - Tar `workAreas`, `selectedWorkArea`, `workAreaRiskMap`, `filters`, `onSelect`, `onAddNew` som props
   - Bruker `Popover` + `Command`, `CommandInput`, `CommandList`, `CommandItem` fra `@/components/ui/command`
   - Viser valgt område som trigger-knapp (ikon-prikk + navn + kompakt meta + chevron)
4. Behold state for `ownershipFilter` og `riskFilter` — flytt UI-kontrollene inn i popoveren.
5. Behold `selectedWorkArea`-logikken uendret.

## Filer
- `src/pages/WorkAreas.tsx` — fjerne chip-rad, filter-rad, "vis mer", legge til switcher-trigger
- `src/components/work-areas/WorkAreaSwitcher.tsx` (ny) — popover + command palette

## Ikke i scope
- Endre tab-innholdet under (Eiendeler, Behandlingsaktiviteter osv.)
- Endre underliggende data eller filter-logikk
- Organization Switcher øverst på siden
