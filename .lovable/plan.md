# Aktiver anbefalinger direkte — ikke bare via tilbud

I kundetabellen kan partneren i dag kun samle anbefalte produkter og tjenester i et tilbud ("Tilbud (n)"). Noen anbefalinger er ting partneren kan slå på med én gang for kunden (regelverk, Mynder Core, Leverandørmodul). Disse skal kunne aktiveres direkte.

## Slik blir flyten

1. Partneren huker av ett eller flere forslag i kolonnen "Anbefalte produkter og tjenester" (som i dag).
2. Ved siden av "Tilbud (n)" kommer en ny knapp "Aktiver (n)" — den vises kun når minst ett av de valgte forslagene faktisk kan aktiveres.
3. "Aktiver (n)" åpner en kompakt bekreftelsesdialog:
   - Liste over hva som slås på nå (regelverk / moduler), med månedspris per linje og sum eks. mva.
   - Valgte forslag som ikke kan aktiveres (Modenhetsvurdering, Penetrasjonstest, Gap-analyse) vises som en egen, dempet linje: "Leveres som oppdrag — legges i tilbud i stedet", med knapp for å ta dem videre til tilbudsdialogen.
   - Avkryssing for vilkår (samme `TermsAcceptRow`-mønster som ved andre aktiveringer/oppgraderinger).
4. Bekreft → regelverk og moduler aktiveres på kunden, toast bekrefter, tabellen oppdateres, og valget nullstilles.

Tilbudsknappen fungerer nøyaktig som før — dette er et tillegg, ikke en erstatning.

## Teknisk

- `src/pages/MSPDashboard.tsx`
  - Utvid `OfferSuggestion` med `activatable: boolean` og (for regelverk) `frameworkId`, (for moduler) `moduleKey`. `deriveOfferSuggestions` setter feltene: `kind: "framework" | "module"` = aktiverbar, `kind: "service"` = ikke aktiverbar.
  - Legg til "Aktiver (n)"-knapp i recommendations-cellen ved siden av "Tilbud (n)".
  - Ny state `activateFor` som åpner dialogen; ved suksess `refetch()` og tøm `offerSelection[c.id]`.
- Ny `src/components/msp/ActivateRecommendationsDialog.tsx`
  - Props: `customerId`, `customerName`, `items: OfferSuggestion[]`, `activeFrameworkIds`, `onActivated`, `onMoveToOffer`.
  - Regelverk: `supabase.from("msp_customers").update({ active_frameworks: [...] })` — samme mønster som `CustomerModulesTab.handleToggleFramework`.
  - Moduler: skrives til kundens modulstatus via samme kall (feltet som `CustomerModulesTab` leser), slik at Produkter-fanen viser dem som aktivert.
  - Vilkår via `useTerms` + `TermsAcceptRow`, kontekst `module_activation`.
- Priser hentes fra samme demo-prising som `CustomerModulesTab` (Core/Leverandørmodul/regelverk per stk.), eks. mva.

## Åpent punkt

Modulaktivering på MSP-kunde er i dag markert "kommer" i Produkter-fanen. Planen skriver modulvalget til kundens rad slik at det vises som aktivert; full lisens-/faktureringskobling er ikke en del av dette.
