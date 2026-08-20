# Søk som forstår tjeneste, regelverk og Mynder-produkt

Søkefeltet på /msp-services skal tolke hva partneren skriver og svare med riktig type resultat: en tjeneste/oppgave, et regelverk med salgspotensial, eller et Mynder-produkt med årspris.

## Hva brukeren ser

Over søkefeltet kommer tre valg: **Tjeneste/oppgave**, **Regelverk**, **Mynder-produkt**. Standard er automatisk gjenkjenning — skriver partneren «GDPR» eller «Mynder Core» bytter visningen selv, og valget kan overstyres manuelt.

**1. Tjeneste eller oppgave (som i dag)**
Uendret: tabell med foreslåtte regelverk, krav og kontrollområder, og knappen «Åpne og rediger».

**2. Regelverk**
Treffkort for regelverket med:
- Antall krav
- Foreslåtte timer: 1 time per krav (samme regel som totalen øverst i Regelverk-fanen)
- Salgspotensial i kroner = antall krav × timepris fra tjenesteinnstillinger, eks. mva
- Merknad: timene er et utgangspunkt og kan justeres per oppgave når tilbudet opprettes
- Knapper: **Åpne oppgavepakke** (åpner regelverket i Regelverk-fanen) og **Bruk i tilbud**

**3. Mynder-produkt (Core, Leverandørmodulen, Eiendeler, Trust Center)**
Treffkort med:
- Månedspris fra og **årspris** (månedspris × 12), eks. mva
- Nivåene produktet har (f.eks. Core inntil 10 / inntil 20 systemer)
- Provisjonssats partneren tjener
- Forklaring: partneren kan enten lage et tilbud der produktet kombineres med rådgivningstimer, eller aktivere produktet direkte på utvalgte kunder — aktivering gjøres per kunde inne på kundekortet
- Knapper: **Legg i tilbud** og **Aktiver på kunde** (går til kundelisten, med teksten om at aktivering skjer på hvert kundekort)

## Teknisk

- Ny ren modul `src/lib/serviceSearchMatch.ts`:
  - `detectSearchKind(query)` → `"framework" | "product" | "service"` via navn/alias-treff mot `frameworks` i `frameworkDefinitions.ts` og produktlisten.
  - `matchFramework(query)` og `matchProduct(query)` returnerer treffet.
  - `frameworkPotential(requirementCount, hourlyRate)` → `{ hours, amount }` med 1 time per krav.
- `MYNDER_PRODUCTS` flyttes fra `MSPServiceCatalogTab.tsx` til `src/lib/mynderProducts.ts` og importeres begge steder (uendret innhold: id, moduleKey, navn, provisjon, `fromPrice`, tiers fra `CORE_TIERS` / `VENDOR_TIERS` / `TRUST_CENTER_PRICE_KR`).
- Kravantall per regelverk hentes med samme spørring som `MSPFrameworkHoursTab` bruker (`compliance_requirements`, gruppert på `framework_id`), lagt i en delt `useQuery` med nøkkel `all-compliance-requirements` slik at den gjenbrukes fra cache.
- Timepris og valuta fra eksisterende `useServiceDefaults()`.
- `ServiceCoverageSearch.tsx` får modus-state + to nye presentasjonskomponenter i samme fil: `FrameworkMatchCard` og `ProductMatchCard`. Eksisterende `onCreate`-flyt for tjenester røres ikke.
- Nye props fra `MSPServiceCatalogTab.tsx`: `onOpenFramework(frameworkId)` (setter aktiv fane til «Regelverk» og åpner pakken) og `onAddProductToOffer(productId)` som gjenbruker eksisterende tilbudsflyt.

## Utenfor scope

- Endring av priser, provisjonsmodell eller selve aktiveringsflyten på kundekortet.
- Endring av oppgavepakkens timeforslag per oppgave (`documentDeliverables.ts`) — 1 time per krav gjelder kun salgspotensial-estimatet i søket.
