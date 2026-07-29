## Mål
Splitte kolonnen «Produkter og tjenester» i MSP-dashboardet i to, slik at partneren tydelig ser hva som er aktiverte regelverk og hva som er aktiverte produkter/tjenester (Mynder Core, Leverandørmodul, Assets, Trust Profile + leverte tjenester fra tilbud).

## Endringer i `src/pages/MSPDashboard.tsx`

1. **Kolonneoppsett**
   - Erstatt kolonnen `activated` («Produkter og tjenester») med to nye kolonner:
     - `frameworks` — overskrift «Regelverk», bredde ~180px.
     - `products` — overskrift «Produkter og tjenester», bredde ~240px.
   - Oppdater `columnVisibility`-nøklene, standard synlighet, og relaterte i18n-labels (`activated` → to nye nøkler).

2. **Regelverk-cellen**
   - Viser aktiverte rammeverk fra `c.active_frameworks` som suksess-fargede chips (maks 3 + «+N»).
   - «—» når tom.

3. **Produkter og tjenester-cellen**
   - Bygg en liste med aktive produkter per kunde (samme demo-logikk som `CustomerModulesTab`):
     - Mynder Core (alltid aktiv i demo).
     - Leverandørmodul (aktiv i demo).
     - Assets (aktiv i demo).
     - Trust Profile utelates hvis ikke aktivert.
   - Legg til leverte tjenester: telle unike `templateIds + serviceKeys` fra `getOffersForCustomer(c.id)` med `status === "delivered"`.
   - Rendring: produkt-chips i primærfarge (uten «Regelverk»), + én chip «N tjenester» når `serviceCount > 0`.
   - «—» når ingen produkter/tjenester.
   - Klikk på cellen navigerer ikke automatisk (behold `stopPropagation`); chips kan senere lenkes til Produkter-fanen.

4. **Ingen endring i filtrering/sortering** — begge kolonnene forblir uten sort/filter, som i dag.

## Ikke berørt
Ingen endring i `CustomerModulesTab`, offers-logikk eller andre views.
