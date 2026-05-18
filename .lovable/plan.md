## Mål
Få "4 sjekkpunkter" og "GDPR · 1 kontroller" til å bli umiddelbart forståelig for en partner, og fjerne inkonsistent språk mellom Lara-forslag og katalog.

## Endringer

### 1. Ensartet språk: "leveransepunkter" overalt
`src/components/msp/MSPLaraServiceSuggestions.tsx` (linje ~84):
- Endre `{s.defaultChecklist.length} sjekkpunkter` → `{s.defaultChecklist.length} leveransepunkter`
- Legg på samme `title`-tooltip som katalogkortet bruker: *"Antall leveransepunkter i tjenesten (det du faktisk gjør for kunden)"*

### 2. Rammeverk-badgen blir meningsfull
`src/components/msp/MSPServiceCatalogTab.tsx` (linje ~215–224) og samme sted i `MSPLaraServiceSuggestions.tsx`:

I stedet for `GDPR · 1 kontroller`, vis hvilke artikler det faktisk er:
- `GDPR · Art.35`
- `ISO 27001 · A.5.1, A.5.4, A.6.1`
- Hvis listen er for lang (>3), vis `ISO 27001 · A.5.1, A.5.4 +1`

Legg på en `title`-tooltip som forklarer hva det betyr: *"Tjenesten dokumenterer disse kontrollpunktene i regelverket — kunden får automatisk evidens på dem når dere leverer."*

### 3. Fjerne entall/flertall-feilen
Ingen "1 kontroller" lenger siden vi viser artiklene direkte. Hvis ingen mapping: vis "Ingen regelverk-kobling" (allerede på plass).

## Hva endres ikke
- Datamodellen (`PartnerService`, `defaultChecklist`, `frameworkMappings.controlIds`) er uendret.
- Antallet og innholdet i seedet katalog er uendret.
- Synlighet-bryteren og pris-visning er uendret.

## Filer som berøres
- `src/components/msp/MSPServiceCatalogTab.tsx`
- `src/components/msp/MSPLaraServiceSuggestions.tsx`
