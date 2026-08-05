# Behovsanalyse: finn kunder som matcher regelverk og send bulk-tilbud

Dagens "Kjør GAP-analyse" på kundeoversikten blir til **Behovsanalyse**. Formålet endres fra ren gap-rapport til: finn hvilke kunder som matcher et sett regelverk, og opprett tilbud til alle i én operasjon (kampanje).

## Ny flyt (4 steg)

1. **Regelverk** — velg ett eller flere regelverk (som i dag). I tillegg et matchekriterium: kunden må matche *minst N* av de valgte regelverkene (standard: minst 1).
2. **Match** — erstatter dagens manuelle kundeliste. Lista fylles automatisk med kundene som matcher kriteriet, sortert på antall treff. Hver rad viser kundenavn, bransje, hvilke av de valgte regelverkene som treffer (aktivert vs. anbefalt), og hvor mange som mangler. Alle matchende kunder er forhåndsvalgt; brukeren kan hake av/på og søke.
3. **Analyse** — samme Lara-kjøring som i dag (gap → tjenester → salgspotensial), med tekst tilpasset behovsanalyse.
4. **Kampanje** — resultatet per kunde med foreslåtte tjenester og potensial, pluss et kampanjenavn-felt. Knappen "Opprett bulk-tilbud (n)" lager ett tilbudsutkast per valgte kunde med samme tjenestesammensetning, taggen/kampanjenavnet i tilbudsnavnet, og status `draft`.

Etter opprettelse: bekreftelsestoast med antall tilbud og totalt potensial, og lenke videre til tilbudsoversikten.

## Match-logikk

Per kunde og per valgt regelverk:
- **Aktivert** — regelverket ligger allerede i kundens aktiverte liste → teller som treff, men markeres som "allerede dekket".
- **Anbefalt** — regelverket kommer opp som relevant via eksisterende anbefalingslogikk (bransje, land, virksomhetsbeskrivelse) → teller som treff og er hovedmålgruppen for kampanjen.
- Ingen av delene → ikke treff.

Kunden vises når antall treff ≥ valgt N. Standard sortering: flest anbefalte (ikke-aktiverte) treff først, siden det er der salgspotensialet ligger.

## Teknisk

- `src/pages/MSPDashboard.tsx`: knappetekst og tooltip endres til "Behovsanalyse" / forklaring om kundematch og bulk-tilbud. Ikon beholdes.
- `src/components/msp/GapAnalysisWizardDialog.tsx` → gis nytt navn `NeedsAnalysisWizardDialog.tsx` med `NeedsAnalysisWizardDialog`-eksport. Steg-labels: Regelverk · Match · Analyse · Kampanje. Steg 2 bygges om fra fri kundeliste til automatisk matchliste med treff-pills.
- Ny hjelpefunksjon `src/lib/needsMatcher.ts`: `matchCustomersToFrameworks(customers, frameworkIds, minMatches)` som returnerer `{ customer, activatedIds, recommendedIds, matchCount }[]`, basert på eksisterende `regulationRecommender.ts` og kundens aktiverte regelverk.
- Steg 3/4 gjenbruker `matchAll` fra `gapServiceMatcher.ts` uendret.
- Bulk-tilbud: loop over valgte kunder og kall `saveOffer` fra `src/lib/customerOffers.ts` per kunde med `templateIds`/`serviceKeys` fra matchede tjenester, `frameworkIds` = valgte regelverk, `name` = kampanjenavn, `status: "draft"`.
- Ingen databaseendringer; tilbud lagres i eksisterende localStorage-store som i dag.
