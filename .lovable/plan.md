

# Bransjebasert anbefaling av kvalitetspakke

## Problemstilling

Når brukeren åpner kvalitetssystem-wizarden, må systemet automatisk foreslå riktig kvalitetspakke basert på:
1. **Bransje** (fra `company_profile.industry` eller `brreg_industry`)
2. **Virksomhetens størrelse** (fra `employees` eller `brreg_employees`)
3. Brukeren må fortsatt kunne velge en annen pakke om ønskelig

## Løsningsdesign

### Anbefalingslogikk

| Bransje | Ansatte | Anbefalt pakke | Begrunnelse |
|---------|---------|----------------|-------------|
| Bygg/Anlegg | Alle | HMS-utvidet | Krav til SJA, stoffkartotek, utstyr |
| Industri/Produksjon | Alle | HMS-utvidet | Krav til stoffkartotek, vedlikehold |
| Helse/Omsorg | < 50 | HMS-utvidet | Pasientsikkerhet, legemiddelhåndtering |
| Helse/Omsorg | 50+ | Kvalitetsledelse | Sertifiseringskrav, revisjoner |
| Tech/SaaS | < 50 | HMS-basis | Lavrisiko, grunnleggende krav |
| Tech/SaaS | 50+ | Kvalitetsledelse | ISO-sertifisering ofte påkrevd |
| Energi | Alle | Integrert ledelsessystem | Miljø + HMS + Kvalitet påkrevd |
| Finans | Alle | Kvalitetsledelse | Regulatoriske krav, revisjoner |
| Offentlig | Alle | Kvalitetsledelse | Anskaffelseskrav, dokumentasjon |
| Generell | < 50 | HMS-basis | Minimumskrav |
| Generell | 50+ | HMS-utvidet | Økt kompleksitet |

### UI-endringer i Steg 1

1. **Anbefalingsbanner**: Vises øverst med anbefalt pakke
2. **"Anbefalt for deg"-badge**: Vises på den anbefalte modulen
3. **Begrunnelsestekst**: Kort forklaring på hvorfor denne pakken anbefales
4. **Pre-seleksjon**: Anbefalt pakke er valgt som standard, men brukeren kan endre

### Visuelt eksempel

```text
┌──────────────────────────────────────────────────────────────┐
│  💡 Basert på din bransje (Bygg og anlegg) og størrelse     │
│     (11-50 ansatte) anbefaler vi HMS-utvidet                │
│                                                              │
│     [Les mer om anbefalingen]                               │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [HMS-basis] ○                                     Inkludert │
│  Grunnleggende internkontroll                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [HMS-utvidet] ●  ⭐ ANBEFALT FOR DEG             +490 kr   │
│  HMS med bransjetilpassede krav og moduler                  │
│                                                             │
│  Inkluderer: SJA-register, Stoffkartotek, Utstyrsregister  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Kvalitetsledelse] ○                              +790 kr  │
│  ISO 9001-basert kvalitetsstyring                          │
└─────────────────────────────────────────────────────────────┘
```

## Implementeringsplan

### Endringer i `qualityModuleDefinitions.ts`

Ny funksjon for å beregne anbefalt pakke:

```typescript
interface RecommendationResult {
  recommendedModule: QualityModuleType;
  reason: string;
  reasonEn: string;
}

export const getRecommendedQualityModule = (
  industryType: IndustryType,
  employeeCount: string | null,
  brreg_employees: number | null
): RecommendationResult => {
  // Beregn antall ansatte
  const empCount = brreg_employees || parseEmployeeRange(employeeCount);
  const isLarge = empCount >= 50;
  
  // Bransjebasert logikk
  switch (industryType) {
    case 'construction':
    case 'industry':
      return {
        recommendedModule: 'hms-extended',
        reason: 'Din bransje har krav til SJA, stoffkartotek og utstyrsregister',
        reasonEn: 'Your industry requires SJA, chemical registry and equipment register'
      };
    case 'health':
      return isLarge 
        ? { recommendedModule: 'quality-management', reason: '...', reasonEn: '...' }
        : { recommendedModule: 'hms-extended', reason: '...', reasonEn: '...' };
    // ... flere bransjer
  }
};
```

### Endringer i `QualityModuleActivationWizard.tsx`

1. Hente `employees` og `brreg_employees` fra `company_profile`
2. Kalle `getRecommendedQualityModule()` ved lasting
3. Sette `selectedModuleType` til anbefalt verdi som default
4. Vise anbefalingsbanner i Steg 1
5. Legge til "Anbefalt"-badge på den anbefalte modulen

### Steg 1: Utvide useEffect for å hente flere felter

```typescript
const { data } = await supabase
  .from('company_profile')
  .select('industry, employees, brreg_employees')
  .limit(1)
  .maybeSingle();
```

### Steg 2: Beregne anbefaling

```typescript
const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);

// I useEffect etter henting av company_profile:
const recommendation = getRecommendedQualityModule(
  mappedIndustry,
  data.employees,
  data.brreg_employees
);
setRecommendation(recommendation);
setSelectedModuleType(recommendation.recommendedModule); // Pre-velg anbefalt
```

### Steg 3: Oppdatere renderStep1()

Legge til:
- Anbefalingsbanner øverst
- "Anbefalt for deg"-badge på riktig modul
- Mulighet for brukeren å velge annen pakke

## Tekniske detaljer

### Ny hjelpefunksjon for å parse ansattintervall

```typescript
const parseEmployeeRange = (range: string | null): number => {
  if (!range) return 0;
  const match = range.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};
```

### Komplett anbefalingsmatrise

```typescript
const industryRecommendations: Record<IndustryType, {
  small: QualityModuleType;  // < 50 ansatte
  large: QualityModuleType;  // >= 50 ansatte
}> = {
  'construction': { small: 'hms-extended', large: 'hms-extended' },
  'industry':     { small: 'hms-extended', large: 'integrated-management' },
  'health':       { small: 'hms-extended', large: 'quality-management' },
  'tech':         { small: 'hms-basis', large: 'quality-management' },
  'general':      { small: 'hms-basis', large: 'hms-extended' }
};
```

## Brukeropplevelse

1. **Wizard åpnes**: System henter bransjeinformasjon og beregner anbefaling
2. **Anbefalingsbanner**: Brukeren ser umiddelbart hvilken pakke som anbefales og hvorfor
3. **Pre-valgt pakke**: Anbefalt pakke er allerede valgt, men med tydelig mulighet for å endre
4. **Valgfrihet**: Alle pakker er synlige og kan velges - anbefalingen er kun et forslag
5. **Videre i wizard**: Bransjetilpasning (Steg 2) justeres basert på valgt pakke

## Filer som endres

| Fil | Endring |
|-----|---------|
| `src/lib/qualityModuleDefinitions.ts` | Ny `getRecommendedQualityModule()` funksjon |
| `src/components/quality/QualityModuleActivationWizard.tsx` | Hente flere felter, beregne anbefaling, oppdatere UI |
| `src/locales/nb.json` | Nye oversettelser for anbefalingstekster |
| `src/locales/en.json` | Engelske oversettelser |

