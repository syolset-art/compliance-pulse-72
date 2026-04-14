

## Plan: Opprydding av prioritetsvisning

### Hva endres

1. **AssetHeader.tsx** — Fjern den read-only priority-badgen som vises ved siden av virksomhetsnavnet (linje 591-597). Prioriteten vises allerede i ribbon-taggen øverst til høyre, og det er nok.

2. **VendorCard.tsx** — Endre prioritet-badgen på leverandørkortene i dashbordet slik at den inkluderer «Leverandør»-tekst sammen med prioritet i én blå tag. F.eks. «Leverandør · Kritisk» i blått, i stedet for en separat fargekodert prioritet-badge.

### Tekniske detaljer

**`src/components/asset-profile/AssetHeader.tsx`:**
- Slett linjene 591-597 (read-only priority Badge ved navnet)

**`src/components/vendor-dashboard/VendorCard.tsx`:**
- Erstatt den separate prioritet-badgen (linje 110-123) med en kombinert blå badge som viser «Leverandør» + evt. prioritet (f.eks. «Leverandør · Høy»)
- Bruk blå farge (tilsvarende vendor-ribbonen: `bg-blue-600/10 text-blue-700 border-blue-600/20`) for å matche leverandør-identiteten
- Hvis ingen prioritet er satt, vis bare «Leverandør»

**Ingen databaseendringer.**

