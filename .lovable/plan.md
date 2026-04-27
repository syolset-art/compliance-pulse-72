## Mål

Vise samme Lara-anbefalingskomponent på leverandør-dashbordet (Oversikt-fanen på `/vendors`) som vi har på hoved-dashbordet, slik at brukeren ser de viktigste vendor-aktivitetene som krever oppmerksomhet — med "Vis plan"-flyten og de 3 mest kritiske oppgavene Lara har laget plan for.

## Hvor

`src/components/vendor-dashboard/VendorOverviewTab.tsx` — øverst i Oversikt-fanen, før eksisterende widgets (metrics-rad, action cards, kart osv).

## Endring

1. Importer `DashboardLaraRecommendation` fra `@/components/dashboard/DashboardLaraRecommendation`.
2. Render komponenten øverst i tab-innholdet, slik at den er det første brukeren ser når de åpner `/vendors` (Oversikt).

```tsx
import { DashboardLaraRecommendation } from "@/components/dashboard/DashboardLaraRecommendation";

// I render-treet, helt øverst i Oversikt-fanen:
<div className="space-y-6">
  <DashboardLaraRecommendation />
  {/* eksisterende widgets (VendorMetricsRow, VendorActionCards, osv) */}
</div>
```

## Hvorfor dette fungerer rett ut av boksen

- Komponenten er selvstendig (henter selv data, har egen state for "Vis plan"/step/dismiss).
- Demo-oppgavene i komponenten er allerede vendor-fokuserte (Visma, Microsoft Azure, Slack — DPA, SCC, risikovurdering), så de passer naturlig på vendor-dashbordet.
- Den telleren som vises ("X oppgaver totalt") henter fra `assets` med `asset_type = vendor` og krysser mot `vendor_documents` for manglende DPA — relevant kontekst for vendor-siden.
- Samme komponent gir konsistent UX mellom hoved-dashbordet og vendor-dashbordet (én kilde å vedlikeholde).

## Filer som endres

- `src/components/vendor-dashboard/VendorOverviewTab.tsx` — legg til import + plasser `<DashboardLaraRecommendation />` øverst.

Ingen endringer i `DashboardLaraRecommendation.tsx` selv.
