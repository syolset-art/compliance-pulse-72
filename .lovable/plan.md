# Flytt salgspotensial opp – vis lisens og fakturert nederst

Salgspotensialet hører sammen med anbefalingene, ikke med det som allerede er aktivert. Nederst i kortet skal partneren i stedet se hva kunden faktisk betaler.

## Hva som endres

**1. Salgspotensial flyttes opp**
Beløpet flyttes til toppen av kortet "Anbefalte produkter og tjenester", på linje med overskriften til høyre. Samme tooltip som i dag (førsteårs estimat eks. mva., fordelt på tjenestetimer og abonnement).

**2. Nederst: kundens økonomi**
Der salgspotensialet stod kommer to nøkkeltall ved siden av de aktiverte produktene:
- **Månedlig lisens** – summen av det kunden betaler per måned for aktiverte moduler og regelverk, eks. mva.
- **Fakturert hittil** – akkumulert beløp siden kunden ble aktivert.

Tooltip på begge forklarer hva som inngår: hvilke moduler og regelverk som utgjør månedsbeløpet, og at fakturert hittil er beregnet fra aktiveringstidspunktet.

## Teknisk

- Ny funksjon i `src/lib/offerSuggestions.ts`: `customerLicenseSummary(customer)` som returnerer `{ monthly, lines: {label, price}[], billedToDate, months }`.
  - Månedspris hentes fra eksisterende priser: moduler via `MANUAL_PRODUCTS` / `planConstants` (Core 995, Leverandør 1089, Assets/Systemer 690, Trust Center 490) og regelverk via `monthlyPriceKr` i `planConstants` (fallback 490).
  - `billedToDate` = månedspris × antall hele måneder siden `created_at` på kunden (minimum 1 når noe er aktivert). `msp_invoices` har ingen kobling til kunde, så beløpet presenteres som beregnet, ikke som fakturahistorikk — tooltip sier dette eksplisitt.
- `CustomerRecommendationsCard.tsx`: flytt `salesPotentialFor`-blokken til header-raden, og bygg ny bunnrad med de to nøkkeltallene (tabular-nums, samme typografi som i dag). `Aktivert`-pillene beholder plassen sin til venstre.

## Videre (ikke i denne endringen)

Skal "Fakturert hittil" bli faktiske tall, må `msp_invoices` få en `customer_id`-kolonne og fakturaer må knyttes til kunde ved aktivering. Kan tas som eget steg hvis ønskelig.
