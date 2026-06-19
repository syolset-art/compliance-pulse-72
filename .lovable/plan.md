## Mål
Hjelpe-ikonet (?) øverst åpner i dag ingen panel når brukeren står på MSP-kundedetalj (`/msp-dashboard/:id`). Den dispatcher event `open-page-help`, men siden lytter ikke på det. Vi legger til en `ContextualHelpPanel` på denne siden — i samme stil som Tasks, Systems, Vendors osv. — men med innhold tilpasset MSP-kundekonteksten og den aktive fanen.

## Endringer

**`src/pages/MSPCustomerDetail.tsx`**
- Importer `useState`, `usePageHelpListener`, `ContextualHelpPanel` og relevante lucide-ikoner.
- Hold `helpOpen`-state og koble den til `usePageHelpListener(setHelpOpen)`.
- Render `<ContextualHelpPanel>` nederst i siden. Innhold velges basert på aktiv fane (`guidance` / `assessment` / `messages` / `trust-profile` / `documentation` / `regulations`) via en liten `helpContent`-map.

## Innhold per fane (norsk)
Hver fane får egen `title`, `description`, `items`, `whyDescription`, `steps`, `actions` og `laraSuggestions`:

- **Veiledning (guidance):** Forklar Laras 4-stegs flyt (vurder → foreslå → veilede → effektuere) og hvordan MSP-en kan akseptere/avvise forslag.
- **Vurdering (assessment):** Forklar modenhetsmatrisen, hvordan baseline-svar genereres, og hvordan «Anbefalte tjenester» avledes.
- **Meldinger (messages):** Forklar kundedialog, frister og hvordan Lara kan utarbeide svar.
- **Trust Profile:** Forklar hva som publiseres til kundens TP, hvilke statuser som finnes og hvordan publisering fungerer.
- **Dokumentasjon (documentation):** Forklar hva Lara gjør med opplastet dokumentasjon, samtykket («lese-tilgang») og forventede dokumenter.
- **Regelverk (regulations):** Forklar hvordan rammeverk aktiveres for kunden og hva som er obligatorisk vs. valgfritt.

Hver variant får 2–3 Lara-forslag («Hjelp meg prioritere», «Forklar denne fanen», osv.).

## Teknisk
- Aktiv fane leses fra eksisterende `tab`-state/URL-param som allerede styrer `<Tabs>`. Ingen ny routing.
- Ingen endringer på `TopBar` eller `usePageHelpListener` — eventet finnes allerede.
- Ingen backend-endringer.

## Out of scope
- Endre `CustomerDocumentationTab` eller andre faner.
- Endre selve hjelpe-ikonet i TopBar.
