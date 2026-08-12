# Gratisnivå på Mynder Core og oppgraderingsflyt fra system 6

Systemlisten tømmes, og når kunden går fra 5 (gratis) til system nummer 6 møter de samme nivåvelger og vilkårsflyt som ligger under Innstillinger > Produkter.

## Nytt gratisnivå

Nivålisten mangler i dag et gratisnivå. Vi legger til øverst:

```text
Inntil 5 systemer     Gratis   (nytt, standardnivå)
Inntil 10 systemer      995 kr /mnd
Inntil 20 systemer    1 499 kr /mnd
Inntil 50 systemer    2 499 kr /mnd
Inntil 100 systemer   4 999 kr /mnd
```

Gratis blir standardnivå for nye kunder.

## Flyten på Systemer

1. Listen starter tom (alle demo-systemer fjernes).
2. Kunden legger til systemer opptil 5 — teller viser "3 av 5 systemer brukt".
3. Ved forsøk på system nummer 6 stoppes handlingen, og nivåvelgeren "Endre nivå på Mynder Core" åpnes — samme komponent som i Innstillinger > Produkter. Gjeldende nivå er markert, og nivåer som ikke rommer dagens bruk er deaktivert.
4. Velger kunden nytt nivå, kommer bekreftelsesdialogen med pris, tidspunkt og avkryssing for vilkår og betingelser. Bekreft er sperret til vilkårene er godtatt.
5. Etter bekreftelse settes nytt nivå, kvitteringen vises, og kunden kan legge til systemet med en gang.

Banneret over listen viser hvor kunden står (brukt/grense) og har knappen som åpner nivåvelgeren.

## Teknisk

- `src/lib/planConstants.ts`: nytt `tier_free` (`systemLimit: 5`, `monthlyPriceKr: 0`, `isFree: true`) først i `CORE_TIERS`; `DEFAULT_CORE_TIER_ID` settes til `tier_free`.
- `src/pages/Systems.tsx`: erstatt hardkodet `MAX_FREE_SYSTEMS` med gjeldende Core-nivå fra `getModuleTier("core")` + `getCoreTier`. "Legg til / Oppdag systemer" sjekker `used >= tier.systemLimit` og åpner `ChangeCoreTierDialog` i stedet for `SystemActivateDialog`. Koble på `ConfirmCoreTierChangeDialog` (som allerede har `TermsAcceptRow` + `useTerms`) og `ModuleChangeReceiptSheet`, samme mønster som `Subscriptions.tsx` (linjer 962–1000). Nivå lagres med `setModuleTier("core", ...)`.
- `src/components/systems/SystemPremiumBanner.tsx`: bruk nivåets grense i stedet for `maxFreeSystems`-konstanten, og la CTA åpne nivåvelgeren.
- Tømming av listen: kjør eksisterende `deleteDemoSystems`-logikk / slett radene i `systems` for organisasjonen, slik at prototypen starter på 0.
- `ChangeCoreTierDialog` og `ConfirmCoreTierChangeDialog` gjenbrukes uendret bortsett fra at gratisnivået nå vises som "Gratis alltid" (allerede støttet via `isFree`).
