## Endring
Fjern den innebygde "Hva betyr fargene på leverandørkortene?"-boksen fra leverandøroversikten. Fargeforklaringen finnes allerede i hjelpepanelet (Forstå-fanen via `ContextualHelpPanel` `colorLegend` i `VendorDashboard.tsx`), så brukeren kan åpne den derfra ved behov.

## Filer
- `src/components/vendor-dashboard/VendorListTab.tsx`: fjern `<VendorStatusLegend />` (linje 274) og det ubrukte importet (linje 11).
- `src/components/vendor-dashboard/VendorStatusLegend.tsx`: slett filen (ingen andre bruker den).

Ingen andre endringer — fargeforklaringen i hjelpepanelet beholdes uendret.