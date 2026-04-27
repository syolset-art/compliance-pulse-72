## Mål

Den øverste delen av dashbordet (`/` – `src/pages/Index.tsx`) skal matche de to referansebildene:

1. **Personlig hilsen** ("God morgen, Synnøve" + dato)
2. **Lara-anbefaling** (lilla banner med "Vis plan" / "Ikke nå")
3. **Samlet modenhetsscore** (stort %, 5 fokusområder med fargekodede tall + progress)
4. **Rammeverks-status** (GDPR, ISO 27001, NIS2, EU AI Act med fargechips Grønn/Gul/Rød)
5. **Modenhet over tid** (linjegraf 7d/30d/90d/12m + "aktiviteter som påvirket score")

Alt over og duplikater i mellom skal bort.

## Hva som fjernes fra `Index.tsx`

Disse blokkene er overflødige og tas ut:

- `<DashboardCompact />` – inneholder gammel KPI-rad (Samsvar/Risikonivå/Kontroller), `ControlAreasChart` (bar chart) og deletion-agent-kort. Erstattes av nye widgets.
- `<DashboardCriticalTasks />` – oransje "viktigste oppgaver"-banner. Erstattes av Lara-anbefaling.
- `<DashboardHeroCards />` – to store donut-kort (Risikooversikt + Samsvarsstatus). Overflødig.
- `<DashboardGrid ... />` – hele widget-griden (security-foundations, business-risk, vulnerability-map, critical-processes, ai-dependencies, ai-activity, vendor-requests, environment).
- Tilhørende imports og `WIDGET_DEFS`/`WIDGET_COMPONENTS`/widget-toggle-state ryddes ut.

Den eksisterende headeren ("Hei, {firma}" + rolle-label + "Her er det som trenger din oppmerksomhet") byttes til en mer personlig hilsen ("God morgen/dag/kveld, {fornavn}" + dato på norsk).

## Hva som bygges

Tre nye komponenter under `src/components/dashboard/`:

### 1. `DashboardLaraRecommendation.tsx`
Lilla banner med:
- Lara-ikon (rund mørk sirkel med diamant)
- Tittel: "Lara har en anbefaling til deg"
- Dynamisk tekst (eks: "Du har 3 leverandører som mangler DPA-dokumentasjon. Vil du starte en gjennomgang?")
- Primær CTA "Vis plan" + sekundær link "Ikke nå"
- Kobles til faktisk data fra `useComplianceRequirements` / vendor docs (med fallback-tekst hvis ingen aktuelle anbefalinger)

### 2. `DashboardOverallMaturity.tsx`
Hvitt kort med:
- Liten header "↗ Samlet modenhetsscore"
- Stort tall (eks. "82%") basert på `stats.overallScore.score`
- 2-kolonne grid med 5 fokusområder fra `stats.byDomainArea`:
  - Styring, Drift og bruk, Identitet og tilgang, Leverandører og økosystem, Personvern og datahåndtering
  - Hver: label + farget % (grønn ≥75, oransje 50-74, rød <50) + tynn lilla progress bar
- "Se detaljer per område →" link nederst (navigerer til `/reports/compliance`)

### 3. `DashboardFrameworkStatus.tsx`
Hvitt kort med:
- Header "Rammeverks-status" + undertittel "Modenhetsscore per regelverk basert på dokumenterte kontroller"
- Liste over aktive rammeverk fra `stats.byFramework` (GDPR, ISO 27001, NIS2, EU AI Act):
  - Navn til venstre, farget % til høyre, tynn lilla progress under, fargechip (Grønn/Gul/Rød) ytterst til høyre
- Terskler: ≥75 Grønn, 50-74 Gul, <50 Rød

### 4. `DashboardMaturityOverTime.tsx`
Hvitt kort med:
- Header "Modenhet over tid" + segmentert kontroll (7d / 30d / 90d / 12m, default 30d)
- Stort tall + endrings-chip (eks. "82%  +4  siste 30 dager")
- Linjegraf (recharts `LineChart`) med datapunkter farget grønne/røde for positive/negative aktiviteter
- Seksjon "AKTIVITETER SOM PÅVIRKET SCORE":
  - Hver rad: avatar (Lara-ikon eller initialer), tittel, kilde-chip ("Lara · godkjent av X" / "Lara · automatisk" eller person), dato + valgfri lenke "Se rapport →", og ±poeng-chip (grønn/rød)
- Mock-data først (siden vi ikke har et faktisk score-historikk-endepunkt), strukturert slik at vi senere kan koble til `audit_logs` eller en egen `score_history`-tabell

## Ny struktur i `Index.tsx`

```tsx
<DashboardLaraRecommendation />
<DashboardOverallMaturity />
<DashboardFrameworkStatus />
<DashboardMaturityOverTime />
```

Resten av siden (dialoger, help-panel, mobile/desktop wrappers) beholdes uendret.

## Tekniske detaljer

- All farge-logikk bruker `bg-success` / `bg-warning` / `bg-destructive` per memory-regelen om risikofarger.
- Progress bars overstyres til primær lilla via `[&>div]:bg-primary` (matcher referansebildene).
- i18n: norsk default med engelsk fallback via `i18n.language === "nb"`-pattern allerede brukt i prosjektet.
- Ingen DB-migrasjoner – alt baserer seg på eksisterende `useComplianceRequirements` + mock for tidsserie/aktivitetsfeed.
- Filer som blir foreldreløse (`DashboardCompact`, `DashboardHeroCards`, `DashboardCriticalTasks`, `DashboardGrid`, gamle widget-imports) **slettes ikke** i denne runden – vi fjerner kun bruken fra `Index.tsx` for å unngå å bryte andre sider som evt. importerer dem. Kan ryddes opp i en senere runde hvis ønskelig.
