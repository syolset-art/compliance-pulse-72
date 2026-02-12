
# Responsiv Trust Profile - Forbedret for nettbrett og mobil

## Problemer identifisert

1. **Metrikk-kortene** - 5-kolonne grid passer ikke pa nettbrett (3+2 rader med ujevn fordeling) eller mobil (2+2+1 med ett kort alene)
2. **Fane-navigasjon** - Fanene kuttes av pa hoyresiden uten visuell indikasjon pa at man kan scrolle
3. **Header-kortet** - "Request update"-knappen og badges klumper seg pa mobil
4. **Mangler max-width** - Innholdet strekker seg 100% i bredden uten container-begrensning
5. **Tab-innhold** - ValidationTab og andre bruker grid som ikke tilpasser seg nettbrett
6. **Dokumenttabellen** - Trange celler og mye skjult innhold pa sma skjermer

## Endringer

### 1. AssetTrustProfile.tsx - Hovedlayout
- Legge til `container max-w-7xl mx-auto` rundt innholdet (folger plattformstandard)
- Bedre padding og spacing for mobil/nettbrett

### 2. AssetHeader.tsx - Responsivt header-kort
- Mobil: Ikon og tittel pa en linje, badges og knapp stables under
- Nettbrett: Kompakt men lesbart med god plass
- Owner/Manager-raden: Full bredde selects pa mobil i stedet for faste pixelbredder

### 3. AssetMetrics.tsx - Responsivt metrikk-grid
- Mobil: 2 kolonner (siste kort full bredde med `col-span-2`)
- Nettbrett: 3 kolonner (jevn fordeling over 2 rader)
- Desktop: 5 kolonner (som i dag)
- Expired-banner: Stables vertikalt pa mobil

### 4. Fane-navigasjon - Visuell scroll-indikator
- Legge til gradient-fade pa hoyresiden av fane-listen for a signalisere scrollbart innhold
- Kortere fane-tekst pa mobil (f.eks. "Validering" i stedet for full tekst)

### 5. ValidationTab.tsx - Responsivt innhold
- Mobil: Stablet layout (enkelt kolonne)
- Nettbrett: 2 kolonner i stedet for 3
- Compliance-ring og AI-innsikt side om side pa nettbrett

### 6. DocumentDetailDialog.tsx - Mobiltilpasning
- Full bredde pa mobil (fjerne mx-4)
- Bedre spacing i innholdet
- Storre klikkflate pa knappene

## Tekniske detaljer

### AssetTrustProfile.tsx
```
// Legge til container wrapper
<div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
```

Fane-listen far en wrapper med gradient-fade:
```
<div className="relative">
  <TabsList className="...overflow-x-auto scrollbar-none">
    ...
  </TabsList>
  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
</div>
```

### AssetHeader.tsx
- SelectTrigger bredde endres fra fast `w-[160px]`/`w-[180px]` til `w-full max-w-[200px]`
- Mobil-layout: flex-col for vendor-rad + knapp

### AssetMetrics.tsx
- Grid endres til: `grid-cols-2 md:grid-cols-3 lg:grid-cols-5`
- Siste kort (Tasks) far `col-span-2 md:col-span-1` for a unnga ensomt kort pa mobil
- Expired-banner: `flex-col sm:flex-row` for stabling pa mobil

### ValidationTab.tsx
- Grid endres fra `grid-cols-1 lg:grid-cols-3` til `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Total Compliance og AI Insights vises side om side pa nettbrett (md:grid-cols-2 inne i hoyre kolonne)

### DocumentDetailDialog.tsx
- DialogContent: `sm:max-w-lg w-[calc(100vw-2rem)]` for bedre mobilvisning

## Filer som endres
- `src/pages/AssetTrustProfile.tsx` - Container wrapper, fane-scroll-indikator
- `src/components/asset-profile/AssetHeader.tsx` - Responsive selects og layout
- `src/components/asset-profile/AssetMetrics.tsx` - Grid-tilpasning
- `src/components/asset-profile/tabs/ValidationTab.tsx` - Responsivt grid
- `src/components/asset-profile/DocumentDetailDialog.tsx` - Mobilbredde
