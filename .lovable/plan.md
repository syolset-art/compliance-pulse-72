

# Plan: Komprimere arbeidsområde-kortet

## Problem
Det store kortet som vises når et arbeidsområde er valgt (lines 786-881 i `WorkAreas.tsx`) tar mye vertikal plass med risiko-gauge, badge, beskrivelse og karusell-prikker. Sammenlignet med den kompakte oppsummeringslinjen på Regelverk-siden er dette unødvendig tungt.

## Løsning
Redesigne det valgte arbeidsområdet til en kompakt oppsummeringslinje — lignende stilen på Regelverk-siden — i stedet for et stort kort med mye innhold.

## Endringer i `src/pages/WorkAreas.tsx`

### Erstatte det store kortet (linje 786-881) med en kompakt linje:

- **Fjerne**: Den store Card-komponenten med `border-t-[3px]`, bakgrunnsfargen, risiko-gauge, badge og karusell-prikker
- **Erstatte med**: En kompakt rad som inneholder:
  - Arbeidsområdets navn og status (Aktiv/Inaktiv) inline
  - Nøkkeltall på én linje: `3 systemer · 2 prosesser · 3 medlemmer`
  - Risikoindikatorn som en liten farge-dot eller badge (ikke en full progress bar)
  - Ansvarlig person som en liten tekst
  - Redigerings- og sletteknapper som ikoner til høyre
- **Beskrivelse**: Vises som en liten `text-xs` linje under, ikke i et stort kort

### Visuell referanse (fra Regelverk-siden):
```text
┌──────────────────────────────────────────────────────┐
│ 🟣 HR · Aktiv  ·  10 systemer · 2 prosesser · ⚠ Mid │
│   Ansvarlig for personaladministrasjon og HR-systemer │
└──────────────────────────────────────────────────────┘
```

Kortet reduseres fra ~200px høyde til ~60-80px.

## Filer

| Fil | Endring |
|---|---|
| `src/pages/WorkAreas.tsx` | Erstatte det store arbeidsområde-kortet med en kompakt oppsummeringslinje |

