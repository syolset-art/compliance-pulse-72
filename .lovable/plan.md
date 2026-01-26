
# Plan: Endre terminologi fra "domene" til "fagområde"

## Oversikt
Mynder opererer innenfor 4 fagområder:
1. **Personvern** - GDPR, Personopplysningsloven
2. **Informasjonssikkerhet** - ISO 27001, NIS2, SOC 2
3. **AI Governance** - EU AI Act, ISO 42001
4. **Øvrige regelverk** - Åpenhetsloven, HMS, Bokføringsloven

Innenfor hvert fagområde finnes det flere spesifikke regelverk (lover, standarder, retningslinjer).

## Endringer som gjøres

### 1. useSubscription.ts
Toast-meldinger ved aktivering av fagområde:
- "Domene aktivert!" → "Fagområde aktivert!"
- "Kunne ikke aktivere domenet" → "Kunne ikke aktivere fagområdet"

### 2. DomainActivationWizard.tsx
Wizard-tekster gjennom hele aktiveringsprosessen:
- "Dette domenet inkluderer:" → "Dette fagområdet inkluderer:"
- "deaktivere dette domenet" → "deaktivere dette fagområdet"
- "Domenet er nå en del av..." → "Fagområdet er nå en del av..."
- "mot kravene i dette domenet" → "mot kravene i dette fagområdet"

### 3. DomainActionDialog.tsx
Dialog-tekster for handlinger:
- "i dette domenet" → "innenfor dette fagområdet"

### 4. DomainComplianceWidget.tsx
Widget-beskrivelser og labels:
- "hvert domene og tilhørende regelverk" → "hvert fagområde og tilhørende regelverk"
- "Ingen regelverk aktivert i dette domenet" → "Ingen regelverk aktivert i dette fagområdet"
- "på tvers av domener" → "på tvers av fagområder"

### 5. Tasks.tsx
Filter-labels:
- "Filtrer etter domene" → "Filtrer etter fagområde"
- "Alle domener" → "Alle fagområder"

### 6. Subscriptions.tsx
Seksjonstitler og plan-beskrivelser:
- "Aktive domener" → "Aktive fagområder"
- "Personvern-domenet inkludert" → "Personvern inkludert"
- "Alle tre hoveddomener inkludert" → "Alle tre hovedfagområder inkludert"

## Tekniske detaljer

Alle variabelnavn, komponentnavn og database-referanser (som `domain_id`, `DomainComplianceWidget`, `domain_addons`, etc.) beholdes uendret. Kun brukervendt tekst endres for å unngå komplekse refaktoreringer.

### Eksempler på konkrete endringer:

**useSubscription.ts (linje 178, 182):**
```typescript
// Før
toast.success(`Domene aktivert! Vil bli fakturert på neste periode.`);
toast.error('Kunne ikke aktivere domenet. Prøv igjen.');

// Etter
toast.success(`Fagområde aktivert! Vil bli fakturert på neste periode.`);
toast.error('Kunne ikke aktivere fagområdet. Prøv igjen.');
```

**Tasks.tsx (linje 524, 544):**
```typescript
// Før
<span className="text-sm font-medium text-foreground">Filtrer etter domene</span>
<Button>Alle domener</Button>

// Etter
<span className="text-sm font-medium text-foreground">Filtrer etter fagområde</span>
<Button>Alle fagområder</Button>
```

**DomainActivationWizard.tsx (linje 159, 211, 341):**
```typescript
// Før
"Dette domenet inkluderer:"
"Du kan når som helst deaktivere dette domenet."
"Domenet er nå en del av din compliance-portefølje."

// Etter
"Dette fagområdet inkluderer:"
"Du kan når som helst deaktivere dette fagområdet."
"Fagområdet er nå en del av din compliance-portefølje."
```

## Filer som endres

| Fil | Antall endringer |
|-----|------------------|
| `src/hooks/useSubscription.ts` | 2 |
| `src/components/regulations/DomainActivationWizard.tsx` | 4 |
| `src/components/regulations/DomainActionDialog.tsx` | 1 |
| `src/components/widgets/DomainComplianceWidget.tsx` | 3 |
| `src/pages/Tasks.tsx` | 2 |
| `src/pages/Subscriptions.tsx` | 2 |

**Totalt: 14 tekstendringer fordelt på 6 filer**
