## Mål

Gi MSP-partneren mulighet til å definere egne kostnader (f.eks. etableringsgebyr, månedlig drift, prosjektledelse) koblet til hvert tjenesteområde/regelverk i Tjenestekatalogen. Hver kostnad kan være **fast beløp** eller **pr time**, og kunden kan velge om den skal tas med i hvert tilbud.

## Endringer

### 1. Datamodell (`FrameworkCoverageCard.tsx`)
Utvid `FrameworkSelection` med en liste over egendefinerte kostnader:

```ts
export type CustomCostKind = "fixed" | "hourly";

export interface CustomCost {
  id: string;
  label: string;        // f.eks. "Etableringsgebyr"
  kind: CustomCostKind; // "fixed" eller "hourly"
  amount: number;       // kr (fixed) eller kr/t (hourly)
  hours?: number;       // kun for "hourly"
  includeInOffer: boolean; // kunden/partner velger om den blir med
}

export interface FrameworkSelection {
  controls: Record<string, ControlSelection>;
  customCosts: CustomCost[];
}
```

Migrer eksisterende bruk (catalog-tab + opportunity-kort) til ny struktur — bakoverkompatibel hjelper `getControls(sel)` der det trengs.

### 2. UI i `FrameworkCoverageCard`
I den utvidede visningen, under kontrollpunkt-listen og før sum-linjen, legg til ny seksjon **"Egendefinerte kostnader"**:

- Liste med eksisterende kostnader — hver rad har:
  - Checkbox (`includeInOffer`) — "Ta med i tilbud"
  - Inputfelt: navn (tekst)
  - Toggle/segment: **Fast** | **Pr time**
  - Beløp-input (kr) + ved "Pr time" også timer-input
  - Beregnet sum til høyre (`amount` eller `amount × hours`)
  - Sletteknapp (X)
- Knapp nederst: **+ Legg til kostnad** (legger til en tom rad)

Stilen følger eksisterende rad-design (grid, bg-background, border, h-7 inputs).

### 3. Sum-beregning
Oppdater `totalPrice` i kortet og `grandPrice` i `MSPServiceCatalogTab`:

```
controlPrice = Σ enabled controls (hours × hourlyRate)
customPrice  = Σ customCosts where includeInOffer is true
                 (kind=fixed → amount; kind=hourly → amount × hours)
totalPrice   = controlPrice + customPrice
```

Sum-linjen i kortet får en ekstra delsum-linje når det finnes inkluderte custom-kostnader:
- "Kontrollpunkter: X t · Y kr"
- "Tillegg: Z kr"
- "Totalt: W kr"

Topp-kortet ("Samlet potensial") viser kombinert total.

### 4. Header-tall
KPI-tellerne i kort-headeren (KP valgt / Timer / Inntekt) inkluderer custom-kostnader i Inntekt, men ikke i Timer (timer vises kun for kontrollpunkter for å bevare semantikk). Tooltip/hjelpetekst forklarer.

### 5. Persistens i denne iterasjonen
Lagres i samme `useState` som resten av seleksjonene — ingen DB-endringer nå. (Kan kobles til backend senere når tilbudsmodulen får sin egen tabell.)

## Tekniske detaljer

- Fil som endres: `src/components/msp/FrameworkCoverageCard.tsx`, `src/components/msp/MSPServiceCatalogTab.tsx` (oppdatert state-form), og evt. `MSPCustomerOpportunityCard.tsx` hvis den leser samme struktur.
- Ingen nye dependencies.
- `nanoid`/`crypto.randomUUID()` for `CustomCost.id`.
- Semantiske tokens (`text-foreground`, `border-border`, `bg-muted/30`) — ingen hardkodede farger.

## Spørsmål før implementasjon

Ingen — flyt og UI er entydig nok. Sier ifra hvis du vil ha kostnadene synlige også når kortet er kollapset (f.eks. liten "+ N tillegg" chip i headeren).
