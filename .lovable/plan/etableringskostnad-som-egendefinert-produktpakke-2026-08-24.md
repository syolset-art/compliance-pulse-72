# Etableringskostnad som egendefinert produktpakke

I dag settes oppstartskost som **timer × timepris** (localStorage `msp.productSetupHours`), og det vises ikke noe etableringsbeløp ved selve aktiveringen av en modul. Vi endrer dette til en **fast pris med beskrivelse**, som vises som en egen pakke **kun ved førstegangsaktivering** — aldri ved nivåendring (flere systemer/leverandører).

## Hva brukeren får

1. **Klikk på et produkt** (Produkter fra Mynder) åpner redigering med ny seksjon «Etableringskostnad»:
   - Fast pris i kr (engangs) — partneren skriver beløpet direkte, ikke timer
   - Tekstfelt «Hva dekker etableringen?» (f.eks. «Oppsett, dataimport og opplæring»)
   - Sammendrag: «Etablering: X kr (engangs)»
2. **Produktlisten** viser merkelapp «Etablering X kr» ved produkter som har dette.
3. **Første aktivering hos en kunde**: pakken vises i aktiverings-/bekreftelsesdialogen med navn, beskrivelse og pris, inngår i engangssummen, og kan fjernes for den aktiveringen («Fjern» / «Legg til igjen» — samme mønster som rådgivningstimer).
4. **Nivåendring** (Endre nivå / flere systemer eller leverandører): pakken vises **ikke**.

## Teknisk

- **Ny felles kilde `src/lib/productSetupFees.ts`**
  - localStorage-nøkkel `msp.productSetupFees.v1`, per produkt: `{ amountKr: number; description: string }`
  - Les/skriv + event-dispatch for synk på tvers av komponenter + hook `useProductSetupFee(productId)`
  - Engangsmigrering: eksisterende timer-basert oppstart for ikke-regelverk konverteres til kr med gjeldende timepris
- **`src/components/msp/PartnerProductList.tsx`**
  - `ProductEditSheet`: erstatt time-input for ikke-regelverk med fast pris + beskrivelse. Regelverk beholder «Rådgivning ved aktivering» (timer) og får etableringskostnad i tillegg
  - Rad-merkelapp endres fra «Oppstart X kr» til «Etablering X kr»
  - `src/lib/activationHours.ts` beholdes kun for regelverk-rådgivning
- **`src/components/msp/ActivateRecommendationsDialog.tsx`** (førstegangsaktivering fra anbefalinger)
  - For moduler som ikke allerede er aktive hos kunden: vis «Etableringspakke»-linje under nivåvalget (beskrivelse + fast pris + Fjern/Legg til igjen), inkludert i engangstotal og knappetekst
  - Ingen pakke for moduler kunden allerede har
- **`src/components/dialogs/ChangeVendorTierDialog.tsx` + `ConfirmVendorTierChangeDialog.tsx`** (aktivering fra kundesiden)
  - I `mode="activate"`: vis pakken i bekreftelsessteget
  - I `mode="change"`: ingen endring — pakken vises aldri ved nivåendring
- **`src/components/msp/MSPCreateOfferDialog.tsx`**
  - Etableringskostnad tas med som engangslinje når produktet aktiveres for første gang via tilbud

## Berørte filer

- `src/lib/productSetupFees.ts` (ny)
- `src/components/msp/PartnerProductList.tsx`
- `src/components/msp/ActivateRecommendationsDialog.tsx`
- `src/components/dialogs/ChangeVendorTierDialog.tsx`
- `src/components/dialogs/ConfirmVendorTierChangeDialog.tsx`
- `src/components/msp/MSPCreateOfferDialog.tsx`

## Verifisering

- Sett etableringskostnad + beskrivelse på Core → aktiver Core hos ny kunde → pakken vises og inngår i engangssum
- Endre nivå på samme kunde → pakken vises ikke
- Fjern/legg til igjen fungerer per aktivering uten å endre standarden
