
## Mynder Core som egen modul med nivåvalg

Mynder Core skal fungere som en selvstendig modul med tre nivåer basert på antall systemer, i stedet for å være koblet til plan-tier (Starter/Vekst/Profesjonell). Nivåene velges og endres direkte fra Moduler-siden, likt referansebildet.

## 1 · Nivåer på Mynder Core

I `src/lib/planConstants.ts` legges det til en ny `CORE_TIERS`-konstant:

| Nivå | Grense | Pris/mnd |
|------|--------|----------|
| Inntil 20 systemer | 20 | 1 499 kr |
| Inntil 50 systemer | 50 | 2 499 kr |
| Inntil 100 systemer | 100 | 4 999 kr |

Standardvalg for demo: **Inntil 50 systemer** (Nåværende). Nivået lagres i lokal state (evt. `useCompanyProfile`-feltet `core_tier` senere).

## 2 · Kortet på Moduler-siden

`ModuleCard` for Mynder Core oppdateres:
- Statusbadge "Aktivert" (grønn) + pill "Inntil {N} systemer" (lilla) ved siden av tittel.
- Beskrivelse: «Grunnmodulen. Oppgaver, avvik, samsvar, behandlingsprotokoll og dokumenter.»
- Bruksrad: «{brukt} av {grense} systemer i bruk».
- Pris fra valgt nivå.
- CTA-knapp: **Endre nivå** (åpner nivådialog).

## 3 · Nivådialog (`ChangeCoreTierDialog`)

Ny komponent `src/components/dialogs/ChangeCoreTierDialog.tsx`:
- Header: modulnavn + nåværende nivå.
- Radiokort per nivå med pris til høyre.
- Nåværende nivå merkes med grå pill «Nåværende».
- Nivåer under faktisk bruk deaktiveres og viser rød hint: *«Dere bruker {n} systemer. Fjern {n − limit} system(er) for å velge dette nivået.»*
- Nedre linje: «Fra {gammel} kr til **{ny} kr per måned** — {differanse} kr {mer|mindre}».
- Knapper: Avbryt / **Endre nivå** (disabled til noe annet enn nåværende er valgt).

## 4 · Bekreftelse — asymmetrisk opp/ned

Etter Endre nivå åpnes `ConfirmCoreTierChangeDialog` med tekst avhengig av retning:
- **Oppgradering:** «Endre til inntil {N} systemer?» — «Prisen går fra {A} til {B} i måneden. Det nye nivået gjelder med én gang, og differansen kommer på neste faktura.» CTA: **Endre for {B} kr/mnd** (umiddelbar).
- **Nedgradering:** samme tittel — «Prisen går fra {A} til {B} i måneden. Nivået endres ved neste fakturaperiode, {dato}. Fram til da beholder dere plass til {gammel grense} systemer.» CTA: **Endre nivå** (planlagt, ikke umiddelbar).

`dato` = første i neste måned.

## 5 · Toast med Angre

Etter bekreftelse: mørk toast nederst «Mynder Core er endret til inntil {N} systemer.» med **Angre**-lenke (~10 sek). Angre ruller tilbake til forrige nivå uten ny bekreftelse.

## 6 · Ryddig av gammel logikk

- `planPrice`, `coreLimit`, `planConfig.displayName` for Mynder Core-kortet erstattes av verdiene fra valgt Core-nivå. Plan-tier styrer ikke lenger systemgrensen.
- `setChangePlanOpen` erstattes for Core-kortet av ny nivådialog. Eksisterende `ChangePlanDialog` beholdes for andre bruksområder (kan fases ut senere, ikke del av denne endringen).
- `totalMonthly` inkluderer valgt Core-pris.

## Tekniske detaljer

Filer som opprettes:
- `src/components/dialogs/ChangeCoreTierDialog.tsx`
- `src/components/dialogs/ConfirmCoreTierChangeDialog.tsx`

Filer som endres:
- `src/lib/planConstants.ts` — legg til `CORE_TIERS` og typer.
- `src/pages/Subscriptions.tsx` — state `coreTierId`/`pendingCoreTierId`, kobling til nye dialoger, oppdatert ModuleCard-props, toast + angre via `useToast`.
- `src/components/subscriptions/ModuleCard.tsx` — ingen strukturell endring nødvendig; bruker eksisterende `action="change"`-varianten.

Ingen backend-endringer i denne omgang — nivået holdes i lokal state til `company_profiles.core_tier` innføres senere.
