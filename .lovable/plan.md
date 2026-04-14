

## Plan: Fix «Modenhet per kontrollområde» — Status-visning

### Problem
1. Et grått felt (summary footer) dekker over innhold
2. Siste kontrollområde (Tredjepartstyring og verdikjede) kuttes av
3. Drill-down (expand) i widgeten er uønsket — brukeren skal sendes til `/reports/compliance` for detaljer

### Endringer i `AggregatedMaturityWidget.tsx`

**1. Fjern drill-down-funksjonalitet fra Status-visningen**
- Fjern `expandedPillar` state og all expand/collapse-logikk
- Fjern `ControlList`-rendering inne i kortene
- Fjern `ChevronDown`/`ChevronRight`-ikoner fra kortene
- Kortene blir rene visningskort uten expand

**2. Klikk navigerer til `/reports/compliance`**
- Legg til `useNavigate` fra react-router-dom
- Hvert pillar-kort klikker → `navigate("/reports/compliance")`
- Legg til visuell indikator (ChevronRight) for å vise at det er klikkbart

**3. Fjern summary footer**
- Fjern det grå «Totalt: X av Y kontroller vurdert»-feltet som ligger over innhold

**4. Sørg for at alle 5 pillarer vises**
- Siste pillar (oddetall) bruker `col-span-2` for full bredde — beholdes
- Ingen fixed height eller overflow-begrensning på grid-containeren

**5. Behold `ControlList`-komponenten**
- Den brukes fortsatt i Historikk/Regelverk-visningene (om nødvendig), men fjernes fra Status-kortene

### Tekniske detaljer
- Kun endringer i `AggregatedMaturityWidget.tsx`
- Fjerner `useState<string | null>(null)` for `expandedPillar`
- Fjerner `requirementsByPillar` useMemo (ikke lenger nødvendig i status-visning)
- Legger til `import { useNavigate } from "react-router-dom"`

