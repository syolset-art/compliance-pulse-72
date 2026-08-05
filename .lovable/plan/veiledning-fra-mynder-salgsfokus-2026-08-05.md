# Veiledning fra Mynder: salgsfokus

## Mål
Fanen «Veiledning fra Mynder» skal handle om to ting: hva partneren bør prioritere hos denne kunden, og hva som kan selges inn. Visningen av anbefalte produkter og tjenester skal være nesten lik den i kundeoversikten.

## Endringer

1. **Behold øverst**: Lara-banneret med prioriterte oppgaver for kunden (inkl. baseline-kartlegging).

2. **Nytt kort «Anbefalte produkter og tjenester»**
   - Samme pille-visning som i kundeoversikten: oker-fargede pills for anbefalte regelverk, Mynder-moduler og egne tjenester, klikkbare for å velge.
   - Valgte gir knappene «Tilbud (n)» (lilla) og «Aktiver (n)» (oransje) — samme handlinger/dialoger som fra kundeoversikten.
   - Egen rad «Aktivert» under, med grønne pills for regelverk, moduler og tjenester kunden allerede har.
   - Kort hjelpetekst: forslagene er utarbeidet av en KI-agent.

3. **Fjernes fra denne fanen**
   - Kortet med regelverksstatus (`RegulationsStatusCard`) — regelverk dekkes av Regelverk-fanen og av pillene.
   - Tjenestesøket (`CustomerServiceCoverageSearch`) — hører hjemme i tjenestekatalogen/Tjenester og produkter.

## Teknisk
- Flytt `OfferSuggestion`, `deriveOfferSuggestions`, `deriveActivatedItems` (og hjelperne `deriveActiveServices`, `deriveNeededServices`, `normalizeServiceKey`) fra `src/pages/MSPDashboard.tsx` til `src/lib/offerSuggestions.ts`; importer dem begge steder så logikken er én kilde.
- Ny komponent `src/components/msp/guidance/CustomerRecommendationsCard.tsx` som gjenbruker pille-stilen fra `RecommendationCell` og «Aktivert»-badgene.
- `src/pages/MSPCustomerDetail.tsx`: rendre det nye kortet i `guidance`-fanen, koble «Tilbud» til `MSPCreateOfferDialog` og «Aktiver» til `ActivateRecommendationsDialog` (samme som dashboardet), og fjerne `RegulationsStatusCard` + `CustomerServiceCoverageSearch` derfra.
