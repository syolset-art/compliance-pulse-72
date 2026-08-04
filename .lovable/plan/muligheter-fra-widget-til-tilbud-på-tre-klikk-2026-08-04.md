# Muligheter: fra widget til tilbud på tre klikk

Erstatter widgeten «Salgspotensial fra gap-analyser» på partner-dashbordet med en
mulighetsvisning uten kronebeløp, og legger til en landingsside «Muligheter».

## Mockdatagrunnlag

Ny fil med mockdata per kunde: navn, bransje, foreslått regelverk (merket som
forslag, kilde: offentlig register), aktiverte produkter, om Trust-profilen er
overtatt av kunden, og en liste «mulige oppgaver» (arbeidspakker) med navn,
hvilke regelverk/krav oppgaven løfter, grovt omfang (liten/middels/stor),
dekkende tjeneste fra tjenestekatalogen, anbefalt rekkefølge, og et flagg for om
forslaget er laget av KI. Ingen priser, ingen timepris, ingen beløp.

## Widget på dashbordet

- Hovedtall: «34 mulige oppgaver hos 11 kunder».
- Fordeling som vannrette stolper, med en bytteknapp mellom «Per bransje» og
  «Per regelverk». Hver stolpe har alltid tekstetikett og tall ved siden av seg.
- Under grafen: kort tekstlig oppsummering av samme tall (tekstalternativ til grafen).
- Topp 5 kunder, én linje hver:
  «Bygg AS · bygg og anlegg · GDPR og NIS2 foreslått, ingen aktivert · 6 mulige oppgaver».
- Knapp: «Se alle muligheter» → `/msp-partner/muligheter`.
- Tomtilstand: forklarer at muligheter krever kunder med gjennomført
  modenhetsvurdering, med lenke «Legg til kunde». Aldri tom boks eller naken null.

## Landingsside «Muligheter»

Ny rute `/msp-partner/muligheter`.

- Tabell: kunde, bransje, foreslått regelverk, aktiverte produkter, antall mulige
  oppgaver, tjenester som dekker dem, handling.
- Filtre: bransje, regelverk, og om profilen er overtatt av kunden.
- Rad kan utvides: oppgavene i anbefalt rekkefølge, hver med hvilke krav den
  løfter, omfang som tekst, og hvilken tjeneste som dekker den. Avkryssing per
  oppgave for hva som skal med i tilbudet.
- Knapp per rad: «Opprett tilbud» → åpner eksisterende tilbudsdialog
  forhåndsutfylt med de valgte oppgavene som tilbudslinjer.

## Språkregler

- «Dette kan gjøres», aldri «dette mangler» eller «gap».
- Foreslått regelverk får alltid ordet «foreslått» og en forklaring på at det
  bygger på offentlig registerinformasjon.
- KI-forslag merkes med en tekstetikett på selve forslaget («Forslag fra Lara»),
  ikke som fotnote nederst.

## Universell utforming

- Kun semantiske fargetokens, kontrast verifisert mot AA.
- Ingen kursiv brødtekst.
- Ingen mening kun i farge eller stolpelengde — alltid tall og tekstetikett.
- Grafen får tekstlig alternativ og korrekt tabell-/listesemantikk.
- Dekorative ikoner får `aria-hidden`, handlingsikoner får tilgjengelig navn.
- Ekspanderbare rader bruker knapp med `aria-expanded`. Norsk grensesnitt.

## Teknisk

- Ny `src/lib/partnerOpportunities.ts` (mockdata + aggregering per bransje/regelverk + topp 5).
- Ny `src/components/msp/OpportunityWidget.tsx` som erstatter `ClaimDevelopmentChart`
  i `src/pages/MSPPartnerDashboard.tsx`.
- Ny `src/pages/MSPOpportunities.tsx` + rute i `src/App.tsx`.
- Gjenbruker `MSPCreateOfferDialog` for tilbudsutkastet; oppgavelinjer mates inn
  som forhåndsvalgte tilbudslinjer uten beløp.
