

# ROI-kalkulator: Fra "besparelse" til "fortjeneste"

## Problemet

Kalkulatoren er i dag vinklet mot tidsbesparelse og kostnadskutt. MSP-partnere tenker ikke slik -- de tenker inntekt, margin og skalerbarhet. Hele siden ma skrives om med ny vinkling og riktige priser.

## Ny vinkling

Overskrift endres fra "Beregn besparelsen" til **"Se hva du kan tjene ved a selge Mynder"**.

Fokuset flyttes til:
1. **Ny arlig inntekt (ARR)** -- hva tjener MSP-en pa lisenser
2. **Oppstartsinntekt** -- engangsinntekt fra onboarding
3. **Total fortjeneste** -- ARR + oppstart - MSPs egen tid
4. **Margin per kunde** -- hvor lonnsomt er hver kunde

## Prismodell som brukes

| Produkt | Pris |
|---------|------|
| Trust Engine | 490 kr/mnd (5 880 kr/ar) |
| Core (20 systemer) | 3 490 kr/mnd (41 880 kr/ar) |
| Readiness add-on | 457,50 kr/mnd (5 490 kr/ar) per standard |
| Oppstart S (0-20 systemer) | 9 900 kr (engangs) |
| Oppstart M (21-50 systemer) | 19 900 kr (engangs) |
| Oppstart L (51+ systemer) | 39 900 kr (engangs) |

## Ny side-layout

### Input-kort (venstre kolonne)
- **Antall kunder** (slider eller tall, default 5)
- **Gjennomsnittlig kundestorrelse** (dropdown: S / M / L -- bestemmer oppstartspris)
- **Produkt per kunde** (dropdown: Trust Engine / Core / Core + Readiness)
- **Antall Readiness-standarder** (vises kun hvis Readiness valgt, default 1)
- **Din timepris** (for a beregne MSPs egen kostnad pa oppstart)

### Resultat-kort (hoyre kolonne)

**Topprad -- 3 store tall:**
| Arlig inntekt (ARR) | Oppstartsinntekt (ar 1) | Total fortjeneste ar 1 |

**Detaljkort:**

1. **Inntektsberegning per kunde**
   - Lisensinntekt per kunde per ar
   - Oppstartsinntekt per kunde (engangs)
   - Din kostnad for oppstart (timer * timepris)
   - Margin per kunde ar 1
   - Margin per kunde ar 2+ (ingen oppstartskostnad)

2. **Portefolje-oppsummering**
   - Total ARR (alle kunder)
   - Total oppstartsinntekt (alle kunder)
   - Total egen kostnad ar 1
   - Netto fortjeneste ar 1
   - Netto fortjeneste ar 2+ (ren ARR minus minimal drift)

3. **Vekstscenario** (inspirerende kort)
   - "Med 10 kunder: X kr/ar"
   - "Med 25 kunder: X kr/ar"
   - Viser skaleringseffekten

### PDF-eksport
Oppdateres med ny vinkling: "Mynder Partnerkalkyl" med inntekts- og margintall.

## Teknisk implementasjon

### Endres: `src/pages/MSPROICalculator.tsx`
- Fullstendig omskriving av innhold og beregningslogikk
- Nye state-variabler: `customerSize` (S/M/L), `product` (trust-engine/core/core-readiness), `readinessStandards`
- Beregningslogikk basert pa de faktiske prisene
- Ny PDF med fortjeneste-fokus
- Beholder Sidebar-layout og eksport-knapp

### Beregningslogikk (pseudokode)

```text
// ARR per kunde
if product == "trust-engine": arrPerCustomer = 5880
if product == "core": arrPerCustomer = 41880
if product == "core-readiness": arrPerCustomer = 41880 + (5490 * readinessStandards)

// Oppstart per kunde
if size == "S": onboardingRevenue = 9900, onboardingHours = 4
if size == "M": onboardingRevenue = 19900, onboardingHours = 8
if size == "L": onboardingRevenue = 39900, onboardingHours = 18

// MSPs egen kostnad
onboardingCost = onboardingHours * hourlyRate

// Margin
marginPerCustomerYear1 = arrPerCustomer + onboardingRevenue - onboardingCost
marginPerCustomerYear2 = arrPerCustomer  // ingen oppstartskost

// Portefolje
totalARR = arrPerCustomer * customers
totalOnboarding = onboardingRevenue * customers
totalCostYear1 = onboardingCost * customers
profitYear1 = totalARR + totalOnboarding - totalCostYear1
profitYear2 = totalARR  // ren recurring
```

Ingen andre filer endres -- dette er kun en omskriving av MSPROICalculator.tsx.
