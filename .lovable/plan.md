Legg til et nytt "Vekst"-nivå mellom Starter og Profesjonell i abonnementsplanen.

## Nytt nivå: Vekst

- **Pris:** 1 990 kr/mnd (19 900 kr/år)
- **Grenser:** inntil 20 leverandører, 20 systemer, 2 arbeidsområder, 2 regelverk inkludert
- **Posisjonering:** For virksomheter som har vokst forbi Starter (5+) men ikke trenger ubegrenset

## Endringer

1. **`src/lib/planConstants.ts`**
   - Utvid `PlanId` med `"growth"`
   - Legg til `PLANS.growth` med priser, grenser og features
   - Oppdater `ORDERED_PLANS` til `["starter", "growth", "professional", "enterprise"]`
   - Flytt `popular: true` fra Profesjonell til Vekst (den nye anbefalte)
   - Oppdater `planNameToTier` til å mappe `"growth"` → passende legacy tier

2. **UI som rendrer plankort**
   - Sjekke `src/pages/Subscriptions.tsx` og dialogen "Endre nivå" – de itererer over `ORDERED_PLANS` og skal automatisk plukke opp det nye kortet
   - Verifisere at grid-layouten håndterer 4 kort pent (evt. `lg:grid-cols-4`)

## Ikke inkludert
Ingen endringer i backend/DB – plan-id lagres som streng og støtter nytt navn direkte.
