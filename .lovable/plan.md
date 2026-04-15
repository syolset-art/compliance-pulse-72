

# Plan: Omgruppere tjenester i sidebaren

## Ny struktur

Systemer flyttes fra "Registre" til "Mynder Core". Leverandører og Assets blir egne toppnivå-lenker (ikke gruppert under "Registre") — hver kan aktiveres separat.

```text
Dashboard
Trust Center
─────────
Regelverk
Meldinger
─────────
▾ Mynder Core          ← pakke 1
  Arbeidsområder
  Oppgaver
  Avviksregister
  Rapporter
  Systemer             ← flyttet hit
─────────
Leverandører           ← egen toppnivå (pakke 2)
Assets                 ← egen toppnivå (pakke 3)
```

## Endringer

### `Sidebar.tsx`
1. Flytte `{ name: "nav.systems", href: "/systems", icon: Cloud }` fra `registriesNav` til `managementNav`
2. Fjerne `registriesNav`-arrayet — erstatte med to separate toppnivå-lenker for Leverandører og Assets
3. Oppdatere rendering-logikken:
   - Mynder Core vises som collapsible (som nå, men med Systemer inkludert)
   - Leverandører og Assets rendres som individuelle lenker (ikke collapsible gruppe) med samme styling som Dashboard/Regelverk
   - Beholde soft-gate logikk: vises i "Flere tjenester" hvis ikke aktivert
4. Oppdatere `isRegistriesActive`-sjekken og `showRegistriesNormal`-logikken til å håndtere Leverandører og Assets individuelt

## Fil

| Fil | Endring |
|---|---|
| `src/components/Sidebar.tsx` | Flytte Systems til managementNav, splitte registre til individuelle lenker |

