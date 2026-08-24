# Anbefalte løsninger — regelverk, retningslinjer og partnerpakker med prosessflyt

## Mål
Kolonnen «Anbefalt løsning» i partnerens kundeoversikt skal vise hele bildet: regelverk **og** retningslinjer som gjelder kunden, partnerens egne navngitte pakker (lisens + rådgivningstimer fra «Produkter og tjenester»), og en tydelig prosessflyt fra anbefaling til aktivering.

## Endringer

### 1. Prosessflyt i «Anbefalt løsning»-cellen (`RecommendationCell` i `src/pages/MSPDashboard.tsx`)
Hvert forslag får en status som viser hvor det er i flyten:
- **Anbefalt** (lilla pill, som i dag) — foreslått av Lara, ikke i tilbud
- **I tilbud** (amber pill med «I tilbud»-merke) — regelverket/tjenesten ligger i et tilbud som er utkast eller sendt (avledet fra `getOffersForCustomer`)
- **Aktivert** — forsvinner fra anbefalinger og dukker opp i «Aktiv»-kolonnen (som i dag)

Tooltip på hver pill viser flyten: `Anbefalt → I tilbud → Aktivert`, med markering av hvor kunden står.

### 2. Retningslinjer tas med i anbefalingene (`src/lib/offerSuggestions.ts`)
- `deriveOfferSuggestions` utvides slik at retningslinjer/rammeverk (f.eks. NSM grunnprinsipper, CIS Controls, Normen) også kan anbefales — både når Lara har dem i `recommended_frameworks` og via manuelt valg.
- Retningslinjer merkes diskret (uten lyn-ikon, ikke direkte aktiverbare — de selges som rådgivningstjeneste/pakke).

### 3. Partnerens egne pakker vises med egendefinert navn
- `MSPDashboard` henter partnerens lagrede pakker én gang via `useFrameworkPackages()` og sender mappen videre til cellen.
- Finnes en aktiv pakke for et regelverk (f.eks. «ISO 27001-start»), vises pillen med **pakkens navn** i stedet for rått regelverksnavn. Tooltip: «Pakke fra Produkter og tjenester — lisens X kr/mnd + Y t rådgivning».
- Samme pakkenavn brukes i tilbud og ved aktivering, så kunden ser partnerens produktnavn konsekvent.

### 4. «+ Legg til»-velger i cellen
Liten knapp nederst i cellen åpner en popover gruppert etter:
1. **Mine pakker** — partnerens lagrede pakker med egne navn (øverst)
2. **Regelverk (lovpålagt)**
3. **Standarder**
4. **Retningslinjer og rammeverk**

Valgt element legges til som et manuelt forslag i cellen og kan tas med i tilbud eller aktiveres direkte. Regelverk med pakke arver pakkens navn, lisens og timer.

### 5. Aktivering bruker pakkens timer (`ActivateRecommendationsDialog.tsx`)
- Når et regelverk med lagret pakke aktiveres, forhåndsutfylles pakkens rådgivningstimer (total_hours) og navn i stedet for standard aktiveringstimer.
- Bekreftelsesteksten viser pakkens navn slik partneren har definert det.

## Tekniske detaljer
- `OfferSuggestion` utvides med valgfritt `packageInfo?: { name: string; totalHours: number; totalPrice: number }` og `offerStatus?: "none" | "draft" | "sent"`.
- Pakkeoppslag skjer i `MSPDashboard` (én `useFrameworkPackages()`-spørring), ikke per rad.
- «I tilbud»-status avledes fra eksisterende tilbudsdata (`customerOffers`) — ingen nye tabeller.
- Ingen databaseendringer; `msp_framework_packages.customName` finnes allerede.
- Berørte filer: `src/pages/MSPDashboard.tsx`, `src/lib/offerSuggestions.ts`, `src/components/msp/ActivateRecommendationsDialog.tsx`, evt. liten justering i `CustomerRecommendationsCard.tsx` for samme pakkenavn på kundedetaljsiden.
