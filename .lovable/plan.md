
## Plan: Flytt Trust Score-sirkelen til høyre i header

Brukeren ser ikke Trust Score-sirkelen øverst til høyre på leverandørens Trust Profile. Den skal plasseres på linje med "Kontaktperson" / "Leverandøransvarlig"-blokkene — altså mer midt på, til høyre i headeren.

### Endring

**Fil:** `src/components/asset-profile/AssetMetrics.tsx` (leverandør-headeren — `/assets/:id`)

1. Identifiser raden som inneholder kontaktperson + leverandøransvarlig (de to blokkene som vises på samme linje midt i headeren).
2. Legg til en tredje kolonne på samme rad, høyrejustert: en kompakt sirkel-gauge (samme stil som den som allerede finnes i `SystemHeader.tsx`):
   - 80×80 SVG, fargekodet (grønn ≥75, gul ≥50, rød <50)
   - Score-tall i midten + "/100" under
   - Liten label "Trust Score" under sirkelen
3. Sirkelen rendres kun når `trustMetrics` finnes (samme prop-flyt som i system-headeren).
4. På små skjermer faller sirkelen ned under (responsive: `flex-col sm:flex-row`, sirkel `shrink-0`).

### Filer som endres
- `src/components/asset-profile/AssetMetrics.tsx`

### Ut av scope
- Endring i `SystemHeader.tsx` (sirkelen er allerede plassert riktig der)
- Ny logikk for beregning av trust score
