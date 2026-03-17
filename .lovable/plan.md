

## Plan: Grafisk Data Geography Widget + Visuell Oppgradering av Dashbordet

### Hva skal lages

En ny **"Data Geography"** dashboard-widget som visuelt viser hvor virksomhetens data befinner seg i verden, med sirkler/bobler og farger — samt en oppgradert visuell stil på "Ditt miljø"-widgeten med donut-diagrammer.

### Nye komponenter

**1. `DataGeographyWidget.tsx`** — Ny full-bredde widget
- Henter leverandører/assets fra Supabase og grupperer etter region (Norge, EU/EEA, USA, Other)
- Visuell "bubble map"-stil layout med:
  - Store sirkler per region, størrelse proporsjonal med antall assets
  - Fargekoding: blå (Norge), grønn (EU), oransje (USA), rød (Andre)
  - GDPR-safe/unsafe indikator per region
  - Klikk på sirkel viser liste over leverandører i den regionen
- Donut-chart i midten som viser total fordeling
- Alt bygget med ren SVG/CSS (ingen ekstra biblioteker)

**2. Oppgradert `EnvironmentOverviewWidget.tsx`**
- Legge til en mini donut-chart (SVG) som viser fordelingen systems/vendors/processes/work-areas
- Gjøre tallene mer visuelt fremtredende med sirkler/ringer rundt

### Integrasjon i Dashboard

- Legge til `data-geography` som ny widget i `WIDGET_DEFS` i `Index.tsx` med `size: "full"`
- Plassere den etter "environment"-widgeten i standard-rekkefølgen
- Støtte norsk/engelsk labels

### Tekniske detaljer

- SVG-baserte sirkler med `stroke-dasharray`/`stroke-dashoffset` for donut-effekter
- Animert inngang med CSS transitions
- Data fra `assets`-tabellen (region/country felter) + `systems`-tabellen
- Responsivt: På mobil stables regionene vertikalt i stedet for horisontalt bubble-layout

### Filer som endres/opprettes
- **Ny:** `src/components/widgets/DataGeographyWidget.tsx`
- **Endres:** `src/components/widgets/EnvironmentOverviewWidget.tsx` (donut-chart)
- **Endres:** `src/pages/Index.tsx` (ny widget registrering)

