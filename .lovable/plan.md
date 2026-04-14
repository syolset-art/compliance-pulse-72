

## Plan: Redesign MSP-kundekort med Trust Level

### Endringer

**Fil: `src/components/msp/MSPCustomerCard.tsx`**

1. **Erstatt «Samsvar»-label og prosenttall** med et Trust Level-system:
   - Score ≥ 75 → **«High Trust»** (grønn)
   - Score 50–74 → **«Medium Trust»** (oransje/gul)
   - Score < 50 → **«Low Trust»** (rød)

2. **Redesign score-seksjonen** til å ligne Trust Profile-headeren:
   - Sirkulær SVG-gauge (mini-versjon av den i AssetHeader) i stedet for det firkantede bokselementet
   - Score-tall i midten, «Trust Score» under, og fargekodet Trust Level-badge under gaugen

3. **Rydd opp kortlayout**:
   - Fjern separate «Claimet/Ikke claimet»-badge (behold kun ikonet med tooltip)
   - Fjern «Samsvar»-teksten
   - Flytt frameworks-badges til en mer kompakt visning
   - Behold claimed-ikon (UserCheck/UserX) ved navn

### Visuelt resultat

Hvert kort får en mini Trust Score-gauge til høyre (samme stil som Trust Profile-headeren) med fargekodet «High Trust» / «Medium Trust» / «Low Trust»-badge under.

