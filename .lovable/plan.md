## Endring

I delingsdialogen `ShareVendorPortfolioDialog` (preview-kortet "Etterlevelsesrapport") erstatt KPI-en **"Mangler DPA"** med **"Prioritet"** — antall leverandører som er satt opp som prioritert (`priority` = `critical` eller `high`).

## Filendring

`src/components/vendor-dashboard/ShareVendorPortfolioDialog.tsx`

1. I `stats`-useMemo (linje 37-46):
   - Bytt ut `missingDpa`-utregningen med
     ```ts
     const prioritized = vendors.filter(v => v.priority === "critical" || v.priority === "high").length;
     ```
   - Returner `prioritized` i stedet for `missingDpa`.

2. I KPI-kortet (linje 171-174):
   - Label: `"Mangler DPA"` → `"Prioritet"`
   - Verdi: `{stats.missingDpa}` → `{stats.prioritized}`
   - Fargelegg tallet med `text-destructive` når `prioritized > 0`, ellers `text-foreground` (samme mønster som "Høy risiko"-kortet — prioriterte leverandører krever oppmerksomhet).

## Ut av scope

- Ingen endringer i hvordan rapporten faktisk sendes/genereres.
- Ingen endringer i de andre tre KPI-ene, risikofordeling-baren eller leverandørtabellen.
- Ingen DB-endringer (`priority`-feltet finnes allerede på `assets`).
