# Ett timetall per aktivitet — ingen fra–til-estimater

## Problem

I tjenestepakken vises timer og pris som spenn («1,5–3 t», «2 300–4 500 kr»), både per aktivitet og i sluttsummen. Salgspotensial og pakkepriser kan ikke bygges på spenn — det skal være ett tall.

## Hva som endres

1. **Per aktivitet:** ett timetall (f.eks. «2 t») og én pris («3 000 kr»). Ingen «fra–til».
2. **Sluttsum:** ett timetall og én totalpris.
3. **Lara-estimat:** når Lara foreslår timer, brukes ett tall (spennet fra modellen slås sammen til ett, avrundet til nærmeste halvtime). Begrunnelsen fra Lara beholdes i tooltip som i dag.
4. **Redigering:** timefeltet i aktivitetseditoren er allerede ett felt — det blir nå den eneste kilden, uten skjult min/max.
5. **Fastpris-overstyring** fungerer som før, men vises som ett beløp.
6. Steder som lagrer pakken (salgspotensial, aktiverte pakker, timer-fanen) får det samme enkelttallet, så tall som vises i partnerens salgsoversikt er identisk med sluttsummen i pakken.

## Teknisk

- `src/lib/frameworkTaskPackage.ts`:
  - `FrameworkTask.hours: number` (var `{min,max}`), `TaskOverride.hours?: number` (erstatter `hoursMin`/`hoursMax`), `ResolvedTask.price: number`, `PackageTotals { tasks, hours, price }` med tall.
  - `resolveTasks` regner `price = round(hours * hourlyRate / 100) * 100` eller `priceOverride`.
  - `packageHours`/`packagePrice` returnerer totalene direkte.
  - Bakoverkompatibel innlasting fra localStorage: gamle overrides med `hoursMin`/`hoursMax` og `hours: {min,max}` i `custom` migreres til ett tall (snitt, avrundet til halvtime) i `loadPackageState`.
- `src/lib/laraPackageHoursEstimate.ts`: mapper svar fra edge-funksjonen til én `hours`-verdi (snitt av min/max, halvtimesavrunding). Edge-funksjonen `estimate-package-hours` endres ikke.
- `src/components/msp/MSPFrameworkTaskPackageSheet.tsx`: viser `fmtH(t.hours)` og `formatCurrency(t.price)`; sluttsum og toast bruker enkelttall; `startEdit`/`saveEdit`/`addCustom` skriver `hours`.
- `src/components/msp/MSPFrameworkHoursTab.tsx`: bruker de nye enkelttallene.
- `formatPriceRange` i `documentDeliverables.ts` beholdes for andre kort (dokumentleveranser), men brukes ikke lenger i pakkeflyten — der brukes en enkel valutaformattering.
