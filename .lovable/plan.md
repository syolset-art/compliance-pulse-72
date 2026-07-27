## Mål
Regelverk-modulkortet i Plan-oversikten skal speile at hvert aktiverte regelverk har sin egen pris — ikke en flat "836 kr/mnd" per regelverk.

## Bakgrunn
- `FRAMEWORK_ADDONS` i `src/lib/planConstants.ts` har allerede `yearlyPriceKr` per regelverk (i dag 50 000 kr/år for alle betalte), men prisen brukes ikke i månedskortet.
- `Subscriptions.tsx` regner i dag `frameworkMonthlyPrice = paidFrameworkCount * 836`, som verken matcher `yearlyPriceKr/12` eller varierer per regelverk.
- Kortet viser bare "836 kr/mnd" og "1 betalte regelverk" uten hvilke regelverk som koster hva.

## Endringer

### 1. `src/lib/planConstants.ts`
- Legg til `monthlyPriceKr` per addon i `FrameworkAddon` og `FRAMEWORK_ADDONS` slik at prisen kan variere per regelverk. Foreslåtte nivåer for prototype:
  - Standard (NIS2, Åpenhetsloven, CRA): 490 kr/mnd
  - Premium (DORA, EU AI Act): 890 kr/mnd
- Legg til hjelper `getFrameworkMonthlyPrice(frameworkId)` som returnerer `monthlyPriceKr` (0 for gratis regelverk).

### 2. `src/pages/Subscriptions.tsx`
- Erstatt `paidFrameworkCount * 836` med sum av `getFrameworkMonthlyPrice(fw.id)` for alle aktiverte regelverk (kun betalte teller).
- Bygg en `paidFrameworkBreakdown`-liste `{ id, name, monthlyPriceKr }` for aktive, betalte regelverk.
- Send breakdown-listen som en ny valgfri prop til `ModuleCard` (se punkt 3), eller vis den som `priceLabel`/undertekst i eksisterende felt.
- Oppdater `totalMonthly`-avhengigheter uendret (fortsetter å bruke `frameworkMonthlyPrice`-summen).

### 3. `src/components/subscriptions/ModuleCard.tsx`
- Legg til valgfri prop `breakdown?: Array<{ label: string; priceKr: number }>`.
- Når `breakdown` er satt, render en kompakt liste under `priceLabel` med hvert element som `NIS2 · 490 kr/mnd` (liten grå tekst, én linje per regelverk, maks 4 synlige + "+N flere" hvis lengre).
- Rør ikke øvrige kort — kun Regelverk-kortet vil sende breakdown.

## Akseptansekriterier
- Regelverk-kort viser samlet månedspris = sum av aktive, betalte regelverks månedspriser.
- Under prisen listes hvert betalte regelverk med navn og egen månedspris.
- Gratis regelverk (GDPR, ISO 27001) telles i "aktive"-tall, men bidrar ikke til pris eller breakdown.
- Totalsum nederst på siden bruker samme sum og oppdateres når regelverk aktiveres/deaktiveres.
- Ingen endringer i andre modulkort eller i regelverksaktiveringsdialogen.
