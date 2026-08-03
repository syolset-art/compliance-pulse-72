# Samle produkter og tjenester i én arkfane

Kundekortet har i dag to separate faner: **Tjenester** (tjenestematrise, tilbud, leveranser) og **Produkter** (Mynder-moduler og aktiverte regelverk). Disse slås sammen til én fane.

## Ny fane: «Tjenester og produkter»

Fanen «Produkter» fjernes. Fanen «Tjenester» får nytt navn og inneholder tre seksjoner i denne rekkefølgen:

1. **Aktivert hos kunden** — øverst, en samlet, kompakt oversikt:
   - Mynder-produkter (moduler) som er aktivert, med nivå/bruk og pris
   - Aktive regelverk
   - Partnertjenester som er levert/aktive
   Hver rad har status-pille: Aktiv / Sagt opp / Ikke aktivert.

2. **Tilbud** — tjenester og produkter det er laget eller sendt tilbud på, med status (Utkast, Sendt, Akseptert, Avslått) og dato. Bygger på tilbudsdataene som allerede finnes.

3. **Tilgjengelig å tilby** — resten av dagens tjenestematrise og produktkort (aktivering, endre nivå, avbestill, lag tilbud) — uendret funksjonalitet.

Alle handlinger som finnes i dag (aktivere modul, endre nivå, avbestille, aktivere regelverk, lage tilbud, dele tilbud, registrere leveranse) beholdes.

## Teknisk

- `src/pages/MSPCustomerDetail.tsx`: fjern `modules`-triggeren og dens `TabsContent`; døp om `assessment`-fanen til «Tjenester og produkter». Behold `?tab=modules` som alias som ruter til den samlede fanen (lenker som `onGoToProducts` fra `RegulationsStatusCard` fortsetter å virke).
- Ny komponent `src/components/msp/CustomerServicesAndProductsTab.tsx` som setter sammen:
  - ny statusoversikt (seksjon 1) bygget av modul-status fra `moduleActivationState` + `activeFrameworkIds` + leverte tjenester
  - tilbudsseksjon (seksjon 2) fra `useCustomerOffers` i `src/lib/customerOffers.ts`
  - `<CustomerModulesTab />` og `<MSPMaturityServiceMatrix />` som seksjon 3
- Ingen datamodell- eller backend-endringer; kun sammenstilling av eksisterende kilder.
