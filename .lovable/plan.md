## Mål

Forenkle `/msp-services` slik at partneren får en ren, fokusert side:
- **Tre Mynder-defaults** alltid synlig øverst (Mynder Core, Leverandørmodulen, Agentstyring) — med pakkevelger (Basic/Premium/Enterprise).
- **Egne tjenester** velges fra en visuell mal-rute, à la bildet (fliser med ikon, navn, regelverk), eller "start fra scratch".
- Skjul den tunge tabellbaserte biblioteksbrowseren og den avanserte regelverks-kalkulatoren bak en "Avansert"-toggle (eller fjern fra default view).

## Endringer

### 1. `MSPServiceCatalogTab.tsx`
- Legg til tredje default i `extras` initial state:
  - `default-mynder-agents` — "Agentstyring (Mynder)" — beskrivelse om styring av AI-agenter, MACF-nivå, agentregister og kontroll.
  - 8 timer, `isMynder: true`, `tier: "basic"`, aktiviteter: "Aktivering av agentregister", "MACF-klassifisering", "Risiko- og kontrolloppfølging".
- Rendre Mynder-defaults i egen seksjon øverst: "Mynder-tjenester" med 3 kort/rader og pakkevelger — separert visuelt fra "Mine egne tjenester".
- Erstatt `ServiceLibraryBrowser`-default-rendering med en kompakt **mal-rute** (grid 3 kolonner) med 6 forhåndsvalgte maler (DPO, SOC, Gap-analyse, Pen testing, AI Act readiness, ISO 27001 cert prep), pluss `Egen tjeneste`-knapp og fritekst "Beskriv tjenesten din".
- Flytt eksisterende `ServiceLibraryBrowser` + framework-kalkulator bak én felles "Avansert: utforsk hele biblioteket"-toggle (default skjult).
- Behold topp-linjen (timepris + samlet potensial + Lag kampanje).

### 2. Ingen ny dialog
- Mal-flisene gjenbruker `adoptTemplate` for de 6 utvalgte malene fra `SERVICE_LIBRARY` (matches på templateCode).
- "Egen tjeneste" og fritekst-feltet åpner eksisterende `CustomServiceDialog`-wizard (samme som bildet).

### 3. Visuell stil
- Mynder-defaults: kort med Mynder-logo/ikon, badge "Inkludert", tier-select til høyre.
- Mal-fliser: følger bildet — kvadratisk ikon i pastellfarge, navn, små regelverks-tags. Hover → border-primary.

## Filer

- `src/components/msp/MSPServiceCatalogTab.tsx` (oppdatert: ny default, ny layout, mal-grid, toggle)
- Ingen DB-endringer, ingen nye komponenter strengt nødvendig — men jeg kan vurdere å splitte mal-grid ut til `ServiceTemplatePicker.tsx` for ryddighet.

## Ute av scope
- Tekst/innhold i `CustomServiceDialog` (allerede laget — bildet er den).
- Endring av `serviceLibrary.ts` eller framework-katalog.