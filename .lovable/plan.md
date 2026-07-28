# Skille Mynder-produkter fra partnerens tjenester

## Mål
Tydeliggjør at siden har to formål:
1. Partneren bygger sin **egen tjenestekatalog** (koblet mot regelverk).
2. Partneren videreselger **Mynder-produkter** med provisjon (20–50% av lisens) og valgfritt etableringsgebyr. Mynder-produktene er **default og kan ikke fjernes** — partneren kan kun justere provisjon og etableringsgebyr.

## Endringer

### 1. Ny seksjon: «Mynder-produkter (videresalg)»
Erstatter dagens «Produkter fra Mynder»-blokk.

Vises som rad-liste med Mynder Core, Leverandørmodulen og Assets:
- Produktnavn + kort beskrivelse (fra `moduleInfo.ts`).
- **Lisenspris fra Mynder** (fra `planConstants.ts`, dynamisk valuta via `useServiceDefaults`).
- **Din provisjon**: redigerbart felt, default 30%, min 20 / max 50.
- **Etableringsgebyr** (valgfritt): tall-input, default 0. Toggle «Ta etableringsgebyr».
- **Estimert inntekt pr kunde/mnd**: `lisens × provisjon% + etableringsgebyr / 12` (indikativ, subtilt).
- Subtil tekst «Alltid inkludert» — ingen aktiver/fjern-knapp.

Ingen timer/timepris på Mynder-produkter — de er lisensbaserte.

### 2. Beholde «Mine tjenester»
Ingen funksjonell endring — kun tydeligere overskrift/undertekst som forklarer at dette er partnerens egne, timebaserte tjenester koblet mot regelverk.

### 3. Fjerne Mynder-produkter fra `extras`-listen
De tre `isMynder: true`-oppføringene fjernes fra initial `extras` state. De hører hjemme i den nye videresalg-seksjonen, ikke som «timer inkludert i alle leveranser».

### 4. Header-tekst
Kort forklaring i to linjer:
- «Bygg din tjenestekatalog og se hvilke regelverk hver tjeneste dekker.»
- «Videreselg Mynder-produkter til dine kunder og tjen provisjon på lisenser.»

## Teknisk

**Filer som endres:**
- `src/components/msp/MSPServiceCatalogTab.tsx` — fjern `isMynder`-oppføringer fra initial `extras`; erstatt «Produkter fra Mynder»-seksjonen med ny videresalg-seksjon; oppdater header.
- **Ny** `src/components/msp/MynderResellCard.tsx` — én produktrad (navn, lisenspris, provisjon-input, etableringsgebyr, estimert inntekt). Ingen fjern/deaktiver.
- **Ny** `src/hooks/useMynderResellSettings.ts` — localStorage-hook (`msp-mynder-resell-v1`) som lagrer `{ productId: { commissionPct, setupFee, setupFeeEnabled } }`. Ingen `active`-felt siden produktene alltid er på.
- `src/lib/planConstants.ts` og `src/lib/moduleInfo.ts` — kun lesing.

**Valuta:** all prising bruker `useServiceDefaults().currencyOption`.

**Ingen backend-endringer** — alt i localStorage, i tråd med prototypen.

## Ute av scope
- Faktisk fakturering / provisjonsutbetaling.
- Publisering av videresalg mot kunde.
- Endring av `planConstants` eller abonnement-side.
