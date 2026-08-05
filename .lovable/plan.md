# Produkter og tjenester på kundekortet — samme visning som «Produkter»

Fanen bygges om slik at partneren ser kundens produkter i samme kortformat som menypunktet «Produkter», og kan aktivere anbefalinger direkte — uten omvei via tilbud.

## Endringer

### 1. Fjern «Pågående oppdrag»
Seksjonen tas ut av fanen. Tilbud og leveranser finnes allerede under «Leveranser».

### 2. Produktkort i stedet for listerader
Dagens tettpakkede liste («Mynder Core — tier_20») erstattes med samme kortkomponent som brukes i Produkter (`ModuleCard`), i et responsivt rutenett: to kort i bredden på desktop, ett på mobil.

Hvert kort viser:
- Navn + nivåpille (f.eks. «Inntil 20 systemer»)
- Kort beskrivelse
- Bruksindikator med fremdriftslinje der det er relevant (systemer, leverandører, verdier)
- Pris per måned
- Handling: «Endre nivå» / «Aktiver» / «Åpne modulen», og «Avvikle» for aktive

Kort for ikke-aktiverte produkter vises i samme rutenett, men nedtonet med «Aktiver»-knapp — slik at det er ett klikk fra oversikt til aktivering.

### 3. Regelverk — krystallklart hva som er aktivert vs. anbefalt
Eget regelverkskort øverst delt i to tydelige rader:
- **Aktivert** — pille per aktivt regelverk (grønn markering)
- **Anbefalt for denne kunden** — pille per anbefalt regelverk fra Laras kartlegging, med hake/plusstegn. Klikk på pillen markerer den for aktivering.

Når én eller flere anbefalinger er valgt, dukker en enkelt knapp opp: «Aktiver (n)».

### 4. Direkte aktivering med nivåvalg
Aktivering går via samme dialog som brukes fra kundeoversikten (`ActivateRecommendationsDialog`), som allerede har to steg:
1. Velg nivå (Mynder Core: systemgrenser, Leverandørmodul: leverandørgrenser) med radioknapper og pris
2. Bekreft: prisoppsummering + vilkårsavkryssing + «Aktiver for X kr/mnd»

For regelverk uten nivåvalg hoppes steg 1 over, slik at det blir to klikk totalt.

### 5. Anbefalte tjenester
Rene tjenester (f.eks. pentest, modenhetsvurdering) som ikke kan aktiveres, samles i én kompakt rad nederst med knappen «Legg i tilbud» — samme oppførsel som i kundeoversikten.

## Teknisk

- `CustomerServicesAndProductsTab.tsx`: fjerner oppdragsseksjonen, bytter listerader mot `ModuleCard` i `grid sm:grid-cols-2 gap-4`, legger til regelverkskort og valgt-tilstand for anbefalinger.
- Gjenbruker `ActivateRecommendationsDialog` (nivåvalg + vilkår) og `MSPCreateOfferDialog` for tjenester.
- Modulstatus og nivå hentes fra `getModuleState` / `CORE_TIERS` / `VENDOR_TIERS`, slik at pris og nivåetikett samsvarer med Produkter-siden.
- Anbefalte regelverk hentes fra eksisterende `recommended` / `confirmed`-props (`FrameworkRecommendation`).
- «Alle tilgjengelige produkter og tjenester» beholdes som sammenleggbar seksjon nederst.
