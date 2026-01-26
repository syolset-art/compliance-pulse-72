
# Plan: Endre terminologi fra "domene" til "kontrollområde"

## Oversikt
Mynder opererer innenfor 4 kontrollområder:
1. **Personvern** - GDPR, Personopplysningsloven
2. **Informasjonssikkerhet** - ISO 27001, NIS2, SOC 2
3. **AI Governance** - EU AI Act, ISO 42001
4. **Øvrige regelverk** - Åpenhetsloven, HMS, Bokføringsloven

Innenfor hvert kontrollområde finnes det flere spesifikke regelverk (lover, standarder, retningslinjer).

## Endringer som er gjort

### 1. useSubscription.ts
Toast-meldinger ved aktivering av kontrollområde:
- "Fagområde aktivert!" → "Kontrollområde aktivert!"
- "Kunne ikke aktivere fagområdet" → "Kunne ikke aktivere kontrollområdet"

### 2. DomainActivationWizard.tsx
Wizard-tekster gjennom hele aktiveringsprosessen:
- "Dette fagområdet inkluderer:" → "Dette kontrollområdet inkluderer:"
- "deaktivere dette fagområdet" → "deaktivere dette kontrollområdet"
- "Fagområdet er nå en del av..." → "Kontrollområdet er nå en del av..."
- "mot kravene i dette fagområdet" → "mot kravene i dette kontrollområdet"

### 3. DomainUpgradeDialog.tsx
Dialog-tekster for oppgradering:
- "Dette domenet inkluderer:" → "Dette kontrollområdet inkluderer:"
- "deaktivere dette domenet" → "deaktivere dette kontrollområdet"

### 4. DomainActionDialog.tsx
Dialog-tekster for handlinger:
- "innenfor dette fagområdet" → "innenfor dette kontrollområdet"

### 5. DomainComplianceWidget.tsx
Widget-beskrivelser og labels:
- "hvert fagområde og tilhørende regelverk" → "hvert kontrollområde og tilhørende regelverk"
- "Ingen regelverk aktivert i dette fagområdet" → "Ingen regelverk aktivert i dette kontrollområdet"
- "på tvers av fagområder" → "på tvers av kontrollområder"

### 6. Tasks.tsx
Filter-labels:
- "Filtrer etter fagområde" → "Filtrer etter kontrollområde"
- "Alle fagområder" → "Alle kontrollområder"

### 7. Subscriptions.tsx
Seksjonstitler og plan-beskrivelser:
- "Aktive fagområder" → "Aktive kontrollområder"
- "Alle tre hovedfagområder inkludert" → "Alle tre hovedkontrollområder inkludert"

## Tekniske detaljer

Alle variabelnavn, komponentnavn og database-referanser (som `domain_id`, `DomainComplianceWidget`, `domain_addons`, etc.) beholdes uendret. Kun brukervendt tekst endres for å unngå komplekse refaktoreringer.

## Filer som er endret

| Fil | Antall endringer |
|-----|------------------|
| `src/hooks/useSubscription.ts` | 2 |
| `src/components/regulations/DomainActivationWizard.tsx` | 4 |
| `src/components/regulations/DomainUpgradeDialog.tsx` | 2 |
| `src/components/regulations/DomainActionDialog.tsx` | 1 |
| `src/components/widgets/DomainComplianceWidget.tsx` | 3 |
| `src/pages/Tasks.tsx` | 2 |
| `src/pages/Subscriptions.tsx` | 2 |

**Totalt: 16 tekstendringer fordelt på 7 filer**
