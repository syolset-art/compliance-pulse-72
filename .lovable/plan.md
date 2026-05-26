## Mål

Gjør gap-analyse på regelverk til det første steget i partnerens veiledningsflyt. Spørreskjema-tjenester blir et oppfølgingssteg som **bygger videre på** gap-analysen for å verifisere Laras funn hos kunden.

## Ny flyt på fanen "Veiledning fra Mynder"

```text
1. Baseline-status (klar/ikke klar for gap-analyse)
       │
       ▼
2. Gap-analyse pr aktivert regelverk  ← Lara
       │   (resultat lagres pr regelverk)
       ▼
3. Verifiser med kunden via spørreskjema  ← bygger på funnene i steg 2
       │
       ▼
4. Foreslå tjenester ut fra gap + svar
```

Rekkefølgen på dagens kort byttes slik at "Lara gap-analyse" kommer **før** "Spørreskjema-tjenester".

## Steg 1 — Baseline-gate

Nytt lite kort øverst i `guidance`-fanen:

- Sjekker om kunden har en baseline i Trust Profile (aktiverte regelverk + minimum kartlegging fra Regelverk-fanen).
- To tilstander:
  - **Klar:** kort viser grønn status og CTA "Kjør gap-analyse".
  - **Ikke klar:** kort forklarer hva som mangler (f.eks. "Aktiver minst ett regelverk i Regelverk-fanen") og lenker dit. Resten av flyten dempes/disables.

Bruker eksisterende kundedata (`customer.active_frameworks`, evt. `compliance_score`) og localStorage-records fra `MSPCustomerRegulationsTab` for å avgjøre status — ingen DB-endringer.

## Steg 2 — Gap-analyse pr regelverk

Nytt kort `RegulationGapAnalysisCard`:

- Lister hvert aktivert regelverk (ISO 27001, GDPR, NIS2, …) som en rad.
- Hver rad viser: ikon, navn, sist kjørt (eller "Ikke kjørt"), score når fullført, og knapp "Kjør gap-analyse" / "Kjør på nytt".
- Klikk åpner eksisterende `MSPGapAnalysisDialog` (gjenbruker `FrameworkGap`-strukturen). Når dialogen lukkes lagres resultatet pr regelverk i localStorage (`msp.customer.gapAnalysis.<customerId>`).
- Når et regelverk har et lagret resultat dukker det opp en sekundær lenke "Verifiser med spørreskjema" som hopper til steg 3 og forhåndsvelger riktig skjema (gjenbruker mapping i `questionnaireRegistry`).

Ingen ny AI-kall i denne iterasjonen — vi bruker dialogens demo-funn slik den allerede er bygget, men strukturert som et lagret resultat pr regelverk.

## Steg 3 — Spørreskjema som verifisering

`QuestionnaireDispatchCard` flyttes ned og får et tynt heading-banner:

- Når brukeren kommer hit fra et gap-resultat: banner viser "Verifiserer gap-analyse for {regelverk}" og forhåndsvelger relevant skjema.
- Når brukeren åpner det direkte: kortet oppfører seg som i dag.
- `QuestionnaireGapList` (eksisterende) får en liten ekstra etikett "Verifisert mot {regelverk}" dersom skjemaet ble sendt fra et gap-resultat.

Kobling mellom gap-resultat og skjema lagres i samme localStorage-record (felt `linkedQuestionnaireId`).

## Steg 4 — Tjenesteforslag

`MSPCustomerOpportunityCard` blir stående nederst som i dag — uendret.

## Filer som endres

- `src/pages/MSPCustomerDetail.tsx` — ny rekkefølge i `TabsContent value="guidance"` + montere nye kort.
- `src/components/msp/` — nye komponenter:
  - `BaselineReadinessCard.tsx`
  - `RegulationGapAnalysisCard.tsx`
- `src/components/msp/MSPGapAnalysisDialog.tsx` — eksponere "onComplete(result)" så resultatet kan lagres pr regelverk.
- `src/components/msp/QuestionnaireDispatchCard.tsx` — støtte for forhåndsvalgt skjema + verifiseringsbanner (lett prop-utvidelse).
- `src/components/msp/QuestionnaireGapList.tsx` — vis "Verifisert mot {regelverk}" når koblingen finnes.

## Designprinsipper (følger eksisterende standard)

- Less is more: rolige kort, ingen ny farge eller ikonstil utenfor det vi allerede bruker.
- Universell utforming: ingen tekst mindre enn `text-sm`, knapper minst `h-9`.
- Ingen ny tekst som gjentar kundens navn — fanen handler om denne kunden.
- All state i localStorage; ingen DB-migrasjon i denne iterasjonen.

## Ikke med i denne iterasjonen

- Ekte AI-kjørt gap-analyse mot opplastede dokumenter (kan kobles på senere via `analyze-doc-gap`-funksjonen).
- Persistens i Supabase — gjøres når flyten er bekreftet.
