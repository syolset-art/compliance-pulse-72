

# Plan: Forbedre leverandørsiden — tydeligere kort og ingen overlapping

## Problemer identifisert

1. **VendorCard**: Alle badges (Leverandør, DPA, risiko, score, action menu) ligger på én rad — de overlapper og klemmes sammen på smalere skjermer
2. **Kort-grid i "Alle"-fanen**: 3 kolonner med mye innhold per kort gir trangt layout
3. **Redundant "Showing X vendors"-tekst** under toolbar (allerede vist i toolbar)
4. **VendorDashboard header**: `pt-16 pt-11` — dobbel padding-top

## Endringer

### 1. Redesigne `VendorCard.tsx` — to-rads layout
Flytte badges til en **egen rad under** leverandørnavn:
- **Rad 1**: Ikon + navn + kategori/land (venstre) — compliance-score + action menu (høyre)
- **Rad 2**: Badges (prioritet, mangler DPA, utdaterte dok, risiko) med `flex-wrap` slik at de aldri overlapper
- Større klikkflate, bedre spacing (`py-4 px-4`)

### 2. Oppdater grid i `VendorListTab.tsx`
- Endre card-grid fra `grid-cols-3` til `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` — gir pusterom
- Fjerne duplikat "Showing X vendors"-tekst (linje 364-366)

### 3. Fiks dobbel padding i `VendorDashboard.tsx`
- Endre `pt-16 pt-11` til `pt-11`

### 4. Klarere tekster
- VendorCard: "Ikke vurdert" → tydeliggjøres med muted styling og ikon
- Badge-tekster: sikre at de er lesbare og har minimum padding

## Filer

| Fil | Endring |
|---|---|
| `src/components/vendor-dashboard/VendorCard.tsx` | To-rads layout med wrapped badges |
| `src/components/vendor-dashboard/VendorListTab.tsx` | Bedre grid breakpoints, fjern duplikat tekst |
| `src/pages/VendorDashboard.tsx` | Fiks dobbel pt |

