# Sammenhengende demo: anbefalt, aktivert og nivåendring per kunde

I dag spriker de tre visningene fordi de leser fra ulike kilder:

- Kolonnene «Anbefalt» og «Aktivert» i kundetabellen leser `active_modules` og `active_frameworks` på kunden i databasen.
- Produktkortene på kundens Produkter-fane leser modulstatus og nivå fra nettleserlagring (`mynder_module_state`) — som er felles for **alle** kunder og ikke ser på kundens `active_modules`.
- Forbrukstallene (systemer/leverandører) telles fra partnerens eget register, ikke fra den valgte kunden — så alle kunder viser samme «21 av 50».

I tillegg setter demodataene aldri `active_modules`, så alle kunder framstår uten produkter og får anbefalt alt.

## Hva som endres

### 1. Én kilde til sannhet per kunde
Modulstatus, nivå, planlagt nedgradering og oppsigelse lagres per kunde-id. Kundens `active_modules` i databasen er fasit for hva som er aktivert; nivå og forbruk lagres lokalt per kunde (demo-nivå, ingen skjemaendring).

Konsekvens: aktiverer man Leverandørmodulen på Bergen Energi, endres kun Bergen Energi — både i produktkortet, i «Aktivert»-kolonnen og i anbefalingene, som umiddelbart slutter å foreslå den.

### 2. Realistiske demokunder
Demokundene får ulik profil slik at partneren kan vise fram flere situasjoner:

```text
Bergen Energi      Core (50 systemer, 42 i bruk) + Leverandør (5, 5 i bruk) → «Grensen er nådd»
Fjordtech          Core (10, 6 i bruk) + Eiendeler                          → anbefalt: Leverandør, Trust Center
Vest Helse         Core (10, 9 i bruk)                                      → nær grensen, anbefalt oppgradering
Kystbygg           ingen produkter                                          → alt anbefalt, ren aktiveringsdemo
NordFinans         Core + Leverandør + Trust Center                         → nesten fullt hus
Stavanger Logistikk Core (20, 18 i bruk)                                    → nivåendring-demo
Larvik Handel      ingen produkter, inaktiv                                 → oppsalgsdemo
Digitale Løsninger Core + Eiendeler + Trust Center
Tromsø Utdanning   Core (10, 3 i bruk)
```

Forbrukstall per kunde seedes lokalt slik at nivåkort, «x av y» og grensesperrer viser noe troverdig for hver kunde.

### 3. Anbefalinger som speiler aktivert
Anbefalingslisten filtreres mot samme kundestatus som «Aktivert»-kolonnen: aktiverte moduler, aktiverte regelverk og leverte tjenester forsvinner fra anbefalt. Trust Center legges inn som modulkandidat (mangler i dag), og Eiendeler/Systemer får samme pris som i produktkortene (i dag 490 ett sted og 690 et annet).

### 4. Flytene fungerer i demo
- **Aktiver**: produkt → vilkårsdialog → kvittering med neste steg → kunden har produktet (kolonne + kort oppdateres uten reload).
- **Endre nivå**: Core og Leverandørmodul bruker kundens eget forbruk, sperrer nedgradering under faktisk bruk og planlegger nedgradering til periodeslutt.
- **Avbestill**: settes til «sies opp <dato>» på den kunden alene, og kan angres.

## Teknisk

- Ny `src/lib/customerModuleState.ts`: samme API som `moduleActivationState.ts`, men nøkkel `mynder_module_state:<customerId>`, pluss `getCustomerUsage(customerId)` med seedede demotall. Egen event `modules:changed:<customerId>` (fallback til global) slik at kort refreshes.
- `CustomerServicesAndProductsTab.tsx`: bytter `getModuleState`/`setModuleTier`/`scheduleModuleTier`/`activateModule` til kundeversjonene, dropper den globale `assets`-tellingen til fordel for `getCustomerUsage`, og initierer status fra `active_modules` når det ikke finnes lokal tilstand.
- `ActivateRecommendationsDialog` / `ActivateTrustCenterDialog`: etter DB-oppdatering av `active_modules` skrives også lokal kundestatus + standardnivå, og kundeeventet sendes.
- `offerSuggestions.ts`: `deriveOfferSuggestions` utvides med Trust Center og Systemer, priser samordnes med `FLAT_PRICE`/`CORE_TIERS`/`VENDOR_TIERS`, og modulfiltrering bruker union av `active_modules` og lokal kundestatus. `deriveActivatedItems` bruker samme union.
- `demoSeedMSP.ts`: `active_modules` per demokunde i innsettingen, og backfill for eksisterende demokunder som har tom liste. Seeding av lokale forbrukstall skjer i `customerModuleState` ved første oppslag.
- `MSPDashboard.tsx`: lytter på modulendringer og refetcher kundelisten, slik at pillene endrer seg med én gang.
