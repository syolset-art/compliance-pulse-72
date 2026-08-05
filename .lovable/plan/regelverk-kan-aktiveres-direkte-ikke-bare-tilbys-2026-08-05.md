# Regelverk kan aktiveres direkte — ikke bare tilbys

Regelverk og rammeverk skal kunne aktiveres direkte hos kunden overalt hvor de anbefales, i tillegg til å kunne legges i et tilbud. All direkte aktivering går gjennom samme bekreftelsesdialog som produkter: vilkår + driftspartner-rollen.

## Kundeoversikten (dashboard)

- I kolonnen "Anbefalte produkter og tjenester" får hver anbefaling et lite skille mellom regelverk/produkt (kan aktiveres) og tjeneste (må tilbys), slik at det er tydelig hva som kan aktiveres.
- Knappene "Tilbud" og "Aktiver" er likestilte: begge vises så snart valget inneholder noe som passer, og "Aktiver" teller antall regelverk/produkter i valget.
- Er ingenting valgt, viser cellen en diskret "Aktiver regelverk"-snarvei som forhåndsvelger de anbefalte regelverkene.

## Kundens Regelverk-fane

- Over listen legges en rad med anbefalte regelverk som ikke er aktivert, som pills.
- Velg ett eller flere → "Aktiver (n)" åpner samme bekreftelsesdialog. "Legg i tilbud" er sekundært valg.
- Er alle anbefalte regelverk aktivert, vises raden ikke.

## Veiledning fra Mynder (kundekortet)

- Samme likestilling av "Tilbud" og "Aktiver" som på dashbordet, og regelverk markeres som direkte aktiverbare.

## Behovsanalyse (bulk-kampanje)

- Siste steg får et andre valg ved siden av "Opprett bulk-tilbud": "Aktiver regelverk hos valgte kunder".
- Det åpner en bekreftelse som lister kundene og regelverkene som aktiveres, med månedspris per kunde og totalsum, og krever vilkår + driftspartner-bekreftelse én gang for hele bulk-operasjonen.

## Teknisk

- Aktivering gjenbruker `ActivateRecommendationsDialog` (vilkår, driftspartner via `useTerms`/`TermsAcceptRow`, oppdatering av `active_frameworks` på `msp_customers`) — ingen ny aktiveringslogikk.
- `deriveOfferSuggestions` i `src/lib/offerSuggestions.ts` markerer allerede regelverk som `activatable`; UI-endringene bruker dette feltet til å skille pills og knapper.
- Endringer i `src/pages/MSPDashboard.tsx` (RecommendationCell), `src/components/msp/guidance/CustomerRecommendationsCard.tsx`, `src/components/msp/MSPCustomerRegulationsTab.tsx` og `src/components/msp/NeedsAnalysisWizardDialog.tsx`.
- Bulk-aktivering skriver `active_frameworks` per kunde i én runde, med feilhåndtering per kunde og oppsummering i toast; vilkårsaksept registreres med kontekst `framework_activation`.
