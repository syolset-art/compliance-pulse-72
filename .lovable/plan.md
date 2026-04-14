

## Plan: Historisk visning for kontrollområder

### Problem
I dag bytter «Historikk»-knappen direkte til regelverksvisningen. Det finnes ingen måte å se historisk utvikling per kontrollområde (Styring, Drift, Personvern osv.).

### Løsning
Erstatter den enkle toggle-knappen med en tre-valgs segmentert kontroll:

```text
[ Status ]  [ Kontrollområder historikk ]  [ Regelverk ]
```

### Hva bygges

**Ny visning: «Kontrollområder historikk»**
- Viser et linjediagram (LineChart) med én linje per kontrollområde/pillar (5 linjer, ulik farge)
- Under grafen: en kompakt legend med ikon + navn + nåværende score for hvert område
- Genererer mock-historikkdata per pillar (samme `generateFrameworkHistory`-logikk, men per domene-score)

**Header-endring:**
- Erstatter den enkle Button-toggle med tre små knapper eller en segmentert kontroll:
  - **Status** — nåværende kontrollområde-kort (default)
  - **Historikk** — ny visning med trendlinjer per kontrollområde
  - **Regelverk** — eksisterende regelverkskort + aggregert trendlinje

### Tekniske detaljer
- Ny state: `viewMode: "status" | "history" | "frameworks"` (erstatter `showHistory: boolean`)
- Historikkdata genereres med `useMemo` basert på `byDomain[pillar.key].score` for hver pillar
- Fargekoding per pillar-linje (blå, grønn, lilla, amber, rosa)
- Kun endringer i `AggregatedMaturityWidget.tsx`

