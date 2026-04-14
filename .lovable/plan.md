

# Plan: Slumre-funksjon og sletterapport for Slette-agenten

## 1. Slumre-knapp på hver oppgave

Legger til en «Slumre»-knapp (BellOff-ikon) på oppgaver med status `scheduled` eller `overdue`. Klikk åpner en liten popover med valg: 7 dager, 14 dager, 30 dager. Når slumret, bytter oppgaven til status `snoozed` med visning av «Slumret til [dato]». Lagres i komponent-state (demo).

## 2. Slettelogg/rapport (dialog)

«Se slettelogg»-knappen i bunnen åpner en Dialog med tabs: Siste uke / Siste måned / Siste år. Viser en liste med demo-data over slettede poster (dato, aktivitet, system, antall poster). Oppsummering øverst: totalt antall slettinger og poster.

## Filer

| Fil | Endring |
|---|---|
| `src/components/dashboard/DeletionAgentCard.tsx` | Legg til `snoozed` status, slumre-knapp med popover, og slettelogg-dialog med tidsperiode-tabs |

## Teknisk
- Ny status `snoozed` i `DeletionStatus` type
- Slumre-state lagres i `useState` (demo — ingen persistering)
- Slettelogg-dialog bruker eksisterende `Dialog` + `Tabs` komponenter
- Demo-data for logg: 8-10 hardkodede slettinger fordelt over uke/måned/år
- EN/NB lokalisert

