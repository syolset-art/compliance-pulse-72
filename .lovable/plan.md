

## Plan: Rydd opp og mobiloptimer Rapportsiden

### Problem
1. **5 store oppsummeringskort** tar opp for mye plass — spesielt på mobil der de stables vertikalt
2. **Fremdriftslinjen** i egen Card tar ekstra plass uten å tilføre mye verdi
3. **Tab-listen** med 5 faner i `grid-cols-5` brytes dårlig på mobil
4. **Rapportkortene** har mye padding og kan strammes inn

### Løsning

**1. Erstatt 5 store kort med en kompakt inline-oppsummering**
Fjern de 5 separate Card-komponentene og fremdriftslinjen. Erstatt med en enkelt rad med kompakte tall:

```
Totalt 18 · Klare 11 · Utkast 3 · Venter 3 · Forfalt 1   [72% komplett ████░░]
```

En liten horisontal stripe med fargedots og tall, ingen store bokser. På mobil wrapper den naturlig.

**2. Gjør tab-listen scrollbar på mobil**
- Fjern `grid w-full grid-cols-5` og bruk `flex overflow-x-auto` med `whitespace-nowrap` på mobil
- Skjul badge-tallene på små skjermer for å spare plass

**3. Stram inn ReportCard på mobil**
- Reduser padding i CardHeader/CardContent
- Skjul standard-badges på mobil (`hidden sm:flex`)

### Filer som endres
- `src/pages/Reports.tsx` — erstatt oppsummeringskort, fiks tabs, stram inn layout

