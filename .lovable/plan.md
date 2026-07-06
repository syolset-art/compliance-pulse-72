## Mål
Erstatte den nåværende steg-baserte drilldown-visningen («Steg 1/2/3») i `MSPWidgetDetail.tsx` (widget = `top-services`) med en ren, flat tabell-oversikt over 4 regelverk kundene trenger hjelp med.

## Hva som fjernes
- Hele `TopServicesDrilldown()`-komponenten (Steg 1 / Steg (Step 2 / Step 3 layout med explanations, interactive service list, and customer drilldown).

## Hva som bygges
En ny `RegulatoryOverview()`-komponent som viser:

1. **Tabell med regelverk** — 4 rader:
   | Regelverk | Kunder med behov | Vekst (30 d) | Status |
   |-----------|------------------|--------------|--------|
   | GDPR | 142 | +12% | Høy |
   | ISO 27001 | 118 | +24% | Høy |
   | DORA | 81 | +4% | Middels |
   | AI Act | 47 | +31% | Høy |

2. **Statustagger** — fargekodede tags (f.eks. rød/oransje/grønn) som viser «Høy», «Middels» eller «Lav» etterspørsel.

3. **Sekundært tallkort** — total antall kunder (400) og andelen som har minst ett regelverksbehov.

4. **Hjelpe-ikon** — beholdes fra dashboard-widget; tooltip forklarer at tallene er basert på åpne aktiviteter, gap i Trust Profile og innkommende forespørsler, oppdatert daglig av Lara.

5. **Ingen klikk ned** — brukeren ønsket *kun oversikt*. Ingen utvidelser, ingen kundelister per regelverk.

## Data
Regulatorisk mock-data erstatter `TOP_SERVICES`:
```ts
const REGULATIONS = [
  { name: "GDPR", customers: 142, growth: "+12%", status: "high" },
  { name:  "ISO 27001", customers: 118, growth: "+24%", status: "high" },
  { name: "DORA", customers: 81, growth: "+4%", status: "medium" },
  { name: "AI Act", customers: 47, growth: "+31%", status: "high" },
];
```

## Layout
- Card med tabell-stil (ikke `<table>`, men grid-/flex-rader for mobilvennlighet).
- Faste kolonnebredder: Regelverk (venstrejustert), Kunder (høyrejustert), Vekst (sentrert), Status (høyre).
- Hover-effekt på rader for å markere at dette er lesbar data.

## Filer som endres
- `src/pages/MSPWidgetDetail.tsx` — fjerne `TopServicesDrilldown`, legge til `RegulatoryOverview`, oppdatere `WIDGETS["top-services"]` metadata (hero-value = 388 = total, subtitle = «Regelverk porteføljekundene trenger hjelp med»).
- `src/pages/MSPPartnerDashboard.tsx` — oppdatere widget-subtitle til «Etterspørsel per regelverk — siste 30 dager» (kun tekstendring).

## Ikke i scope
- Ingen nye ruter, filer, eller backend.
- Ingen kundeliste/drilldown.
- Ingen interaktive diagrammer.