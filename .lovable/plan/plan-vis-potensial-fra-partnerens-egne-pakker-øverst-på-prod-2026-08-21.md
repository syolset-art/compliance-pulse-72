# Plan: Vis potensial fra partnerens egne pakker øverst på «Produkter og tjenester»

## Mål
Toppkortet «Salgspotensial per kunde» viser i dag kun et generelt estimat (minstepris + auto-timer). Det sier ingenting om partnerens egne aktiverte regelverkpakker. Vi legger til en veksle mellom to visninger i samme kort: generelt estimat vs. partnerens faktiske pakker fra databasen.

## Endringer

### 1. `src/components/msp/PartnerSalesPotentialCard.tsx` (hovedendring)
- Legg til en enkel visningsvelger øverst i kortet (to knapper/segmenter): **«Estimert potensial»** (dagens visning, standard) og **«Mine aktiverte pakker»**.
- «Estimert potensial» = nåværende innhold uendret (minstepris moduler, regelverk-velger, timer pr. krav, timepris).
- «Mine aktiverte pakker» henter data fra `useFrameworkPackages()` (tabellen `msp_framework_packages`) og viser kun pakker med `is_active = true`:
  - **Totalt potensial**: sum av lisens (antall aktiverte regelverk × regelverkspris) + lagrede rådgivningspriser (`total_price`) per pakke.
  - **Lisenser**: antall aktiverte regelverk og pris.
  - **Rådgivningstimer**: sum av `total_hours` og `total_price` fra de aktiverte pakkene — altså partnerens egne justerte timer, ikke auto-estimat.
  - Liste over hvilke regelverk som er aktivert (navn + pris/timer), så det er tydelig hva summene bygger på.
  - **Tom tilstand**: hvis ingen pakker er aktivert, vis en kort tekst («Du har ikke aktivert noen regelverkpakker ennå») med knapp som scroller ned til seksjonen «Regelverk og rådgivningspakker».
- Tittel/undertekst i kortet tilpasses valgt visning: «Mine aktiverte pakker» får tekst som forklarer at tallene er basert på partnerens egne lagrede pakker.

### 2. `src/components/msp/MSPFrameworkHoursTab.tsx` (rydding)
- Fjern det dupliserte sammendraget «Potensial fra aktiverte regelverk» fra «Slik fungerer det»-kortet — dette bor nå i toppkortet. Behold kun forklaringsteksten om hvordan pakker settes opp.

### 3. `src/pages/MSPServiceCatalog.tsx` (kun hvis nødvendig)
- Ingen strukturendring planlagt; seksjonen «Regelverk og rådgivningspakker» beholder posisjonen sin og fungerer som redigeringsflate. Tom-tilstandens knapp i toppkortet scroller hit.

## Tekniske detaljer
- Datakilde for «Mine aktiverte pakker»: `useFrameworkPackages()` (React Query, cachen deles allerede med `MSPFrameworkHoursTab` via samme query key — ingen ekstra databasekall).
- Lisenspris per regelverk: `frameworkLicensePrice(fwId)` fra `src/lib/planConstants` (samme som brukes ellers), fallback til `EXTRA_FRAMEWORK_PRICE_KR`.
- Ingen databaseendringer. Ingen nye avhengigheter. Valgt visning kan lagres i localStorage (`msp.salesPotential.view`) slik at valget huskes.
- Bygg verifiseres etter endring.
