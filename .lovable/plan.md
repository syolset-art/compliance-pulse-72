# Del anbefalingskortet i to: Regelverk og Produkter/tjenester

Kortet «Anbefalte produkter og tjenester» på Veiledning fra Mynder blir for stort. Det deles i to kort side om side (stables på smale skjermer).

## Venstre kort: Anbefalte regelverk

- Overskrift «Anbefalte regelverk», med liten pille «Initiell KI-vurdering» så lenge modenhetsvurderingen ikke er bekreftet.
- Viser regelverkene Lara har foreslått ut fra bransje, land, ansatte og funn fra nettsted (samme kilde som i dag), med aktiverte regelverk markert.
- Hvert regelverk kan fortsatt velges for tilbud eller aktiveres direkte (lyn-ikon, samme dialog som i dag).
- CTA nederst: **Start modenhetsvurdering**. Kort forklaring: «Bekreft hvilke regelverk som faktisk gjelder ved å kartlegge kundens modenhet.»

### Flyt for modenhetsvurdering

```text
1. Partner åpner skjemaet  → svarer på det de kan (eksisterende baseline-skjema)
2. Send til kunden         → kunden fyller ut resten
3. Kunden svarer           → status «Bekreftet»
4. Kortet viser bekreftet forslag til regelverk
```

- Steg 1 gjenbruker dagens baseline-skjema (partner-modus).
- Nytt steg i bunnen av skjemaet: «Send til kunden» med kontaktnavn/e-post, valgfri intro og frist. Dette oppretter en spørreskjema-leveranse på kunden (samme mekanikk som dagens spørreskjema til kunde).
- Statuslinje i kortet viser hvor man er: «Ikke startet» → «Delvis besvart av partner (x/22)» → «Sendt til kunde – venter på svar» → «Bekreftet av kunden».
- Når kunden har svart, byttes pillen til «Bekreftet av kunden» og teksten sier at regelverksforslaget nå er basert på kundens egne svar.

## Høyre kort: Anbefalte produkter og tjenester

- Samme pille-uttrykk som i dag, men uten regelverk (de bor nå i venstre kort).
- Innhold: Mynder-produkter som kan aktiveres (Mynder Core, Leverandørmodul, Systemer, Eiendeler, Trust Center) og partnerens egne tjenester fra tjenestekatalogen.
- Rammeverk/standarder som kan aktiveres (f.eks. ISO 27001-rammeverk levert som produkt) blir liggende her når de ikke er regulatoriske krav.
- «Tilbud (n)» og «Aktiver (n)» fungerer som i dag.
- Seksjonen «Aktivert» beholdes nederst i dette kortet.

## Teknisk

- `src/lib/offerSuggestions.ts`: del `deriveOfferSuggestions` i to selektorer — `deriveFrameworkSuggestions` (kind `framework`) og `deriveProductSuggestions` (kind `module` + `service`, inkludert partnerens tjenestekatalog). Eksisterende funksjon beholdes som sammenslåing for andre kallsteder (dashboard, behovsanalyse).
- Ny `src/components/msp/guidance/CustomerFrameworkRecommendationsCard.tsx` med statuslinje og CTA.
- `CustomerRecommendationsCard.tsx` trimmes til produkter/tjenester.
- `src/pages/MSPCustomerDetail.tsx`: rendre de to kortene i et `grid lg:grid-cols-2 gap-4` over modenhetskortet; koble CTA til eksisterende `BaselineQuestionsDrawer`.
- `BaselineQuestionsDrawer.tsx`: legg til en «Send til kunden»-handling i bunnen som oppretter en leveranse via `useQuestionnaireDeliveries`.
- Status i regelverkskortet leses fra baseline-svar (`useCustomerBaseline`) + leveransestatus (`useQuestionnaireDeliveries`).
- Ingen databaseendringer.
