

# ROI-kalkulator: Koble til lisensmodellen

## Problemet

ROI-kalkulatoren viser i dag full ARR-pris som om MSP beholder hele belopet. I virkeligheten far MSP kun en andel:

- **20% provisjon** hvis de selger uten a kjope lisenser pa forhand
- **50% provisjon** (= 50% rabatt pa innkjop) hvis de kjoper bulk (5+ lisenser)

Kalkulatoren ma vise MSPs faktiske fortjeneste basert pa lisensmodellen.

## Ny beregningslogikk

### Lisensniva og priser (fra mspLicenseUtils.ts)

| Tier | Pris/ar | Maks systemer |
|------|---------|---------------|
| Basis | 42 000 kr | 20 |
| Premium | 76 000 kr | 50 |

### Provisjonsmodell

| Modell | MSP far | Beskrivelse |
|--------|---------|-------------|
| Standard (selg uten forhandskjop) | 20% av lisenpris | Lavere margin, ingen risiko |
| Bulk (kjop pa forhand) | 50% rabatt = beholder 50% | Hoyere margin, betaler upfront |

### Beregning

```text
// Velg tier og modell
if bulk:
  mspCostPerLicense = tierPrice * 0.50   // MSP betaler halv pris
  mspRevenuePerLicense = tierPrice       // Kunden betaler full pris
  mspMarginPerLicense = tierPrice * 0.50 // MSP beholder 50%
else:
  mspCostPerLicense = 0                  // MSP betaler ingenting
  mspRevenuePerLicense = tierPrice * 0.20 // MSP far 20% provisjon
  mspMarginPerLicense = tierPrice * 0.20

// Oppstart (MSP beholder alt, minus egen tid)
onboardingProfit = onboardingRevenue - (hours * hourlyRate)

// Totalt
profitYear1 = (mspMarginPerLicense * customers) + (onboardingProfit * customers)
profitYear2 = mspMarginPerLicense * customers  // kun lisensmargin
```

## Endringer i MSPROICalculator.tsx

### Input-felter (oppdatert)

1. **Lisensniva** -- dropdown: Basis / Premium (erstatter "Produkt per kunde")
2. **Salgsmodell** -- dropdown: "Standard (20% provisjon)" / "Bulk (50% margin, forhandskjop)"
3. **Antall kunder** -- slider (beholdes)
4. **Gjennomsnittlig kundestorrelse** -- dropdown S/M/L (beholdes, for oppstartspris)
5. **Din timepris** -- input (beholdes)

Fjerner: "Readiness-standarder" (forenkler, kan legges til senere)

### Resultat-kort (oppdatert)

**Topprad:**
- Din arlige lisensinntekt (provisjon/margin, ikke full ARR)
- Oppstartsinntekt (ar 1)
- Netto fortjeneste ar 1

**Per kunde-kort:**
- Kundens lisenpris (full pris)
- Din andel (20% eller 50%)
- Din kostnad (kun ved bulk: forhandskjop)
- Oppstartsinntekt
- Din oppstartskostnad (timer)
- Margin per kunde ar 1
- Margin per kunde ar 2+

**Portefolje-kort:**
- Total lisensinntekt (din andel)
- Total oppstartsinntekt
- Total forhandskjop (kun bulk)
- Total egen tid-kostnad
- Netto fortjeneste ar 1
- Netto fortjeneste ar 2+

**Vekstscenario:** Beholdes med oppdatert logikk

### Info-boks

En liten forklaringsboks som viser forskjellen mellom de to modellene:
- "Standard: Du far 20% provisjon uten risiko"
- "Bulk: Kjop lisenser pa forhand med 50% rabatt -- hoyere margin per kunde"
- Lenke til Lisenser-siden for a kjope

### Importerer fra mspLicenseUtils.ts

Bruker `LICENSE_TIERS` og `getDiscountPercent` fra eksisterende kode for a holde prisene synkronisert.

## Filer som endres

Kun `src/pages/MSPROICalculator.tsx` -- fullstendig omskriving av beregningslogikk og input-felter. Prisdata hentes fra `src/lib/mspLicenseUtils.ts` (ingen endringer der).

