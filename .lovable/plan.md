## Endring av dashboard-layout

Flytte "Rammeverks-status" ned under "Modenhet over tid", og plassere de to side om side i et 2-kolonne grid (på desktop).

### Ny rekkefølge på dashbordet (`src/pages/Index.tsx`)

1. Personlig hilsen
2. `DashboardLaraRecommendation` (Lara-anbefaling)
3. `DashboardOverallMaturity` (Samlet modenhetsscore)
4. **Ny rad – 2 kolonner side om side:**
   - Venstre: `DashboardMaturityOverTime` (Modenhet over tid)
   - Høyre: `DashboardFrameworkStatus` (Rammeverks-status)

### Teknisk

I `Index.tsx` erstattes de tre separate komponentkallene nederst med:

```tsx
<DashboardOverallMaturity />
<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
  <DashboardMaturityOverTime />
  <DashboardFrameworkStatus />
</div>
```

- På mobil/tablet (<lg) stables kortene under hverandre.
- På desktop (≥1024px) vises de side om side med samme `gap-5` som resten av dashboardet.
- Begge komponenter har allerede `rounded-2xl border bg-card` og fyller bredden – ingen interne endringer nødvendig.

### Filer som endres

- `src/pages/Index.tsx` – kun layout-endring i `dashboardContent`.
