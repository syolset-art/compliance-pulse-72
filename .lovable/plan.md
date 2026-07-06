## Mål

Widgeten "Tjenester kundene trenger mest hjelp med" på MSP Partner-dashbordet er uklar. Brukeren vet ikke hva tallene betyr, hvor de kommer fra, eller hva som skjer når man klikker. Vi gjør widgeten selvforklarende og bygger en tydelig drilldown-prosess.

## Omfang

- `src/pages/MSPPartnerDashboard.tsx` — `TopServicesWidget` (linje 917–948)
- `src/pages/MSPWidgetDetail.tsx` — `top-services`-visning (linje 178–189, 342–360)

Ingen endringer i data, ruter, andre widgets eller backend. Kun norsk (widgeten er norsk-only i dag).

## 1. Widget på dashboard — mer intuitiv

Endre kortet slik:

- **Hjelpeikon (`HelpCircle`) ved siden av tittelen**, i en `Tooltip` (eller `Popover` for lengre tekst). Innhold:
  > "Antall kunder i porteføljen din som har åpne aktiviteter, forespørsler eller gap innenfor hvert tjenesteområde. Kilde: kundenes Trust Profile og Lara-signaler. Bruk listen til å pakketere og selge rådgivning."
- **Underoverskrift** under tittelen (erstatter "på tvers av portefølje" oppe til høyre): `"Etterspørsel per tjeneste — siste 30 dager"` i `text-xs text-muted-foreground`.
- **Kolonneoverskrift** over listen: `Tjeneste` … `Kunder med behov`, `text-[11px] uppercase tracking-wide text-muted-foreground`, slik at tallet får en tydelig etikett.
- **Footer-rad** nederst i kortet: liten `ChevronRight`-knapp «Se detaljer og handlinger →» i stedet for at hele kortet er en usynlig knapp. Kortet forblir klikkbart, men CTA-en synliggjør drilldownen.

Ingen fargeendringer på progress-barene.

## 2. Drilldown — 3-stegs prosess

Utvid `case "top-services"` i `MSPWidgetDetail.tsx` fra en flat rangeringsliste til en veiledet prosess. Beholder eksisterende hero + explainer + CTAs. Erstatter dagens `<Section title="Rangering">` med tre seksjoner:

**Steg 1 — Forstå tallene**
`<Section title="Steg 1 · Forstå tallene">` med et kort som forklarer:
- Hva én "kunde med behov" er (åpen aktivitet, gap i Trust Profile, eller innkommende forespørsel).
- Hvordan Lara oppdaterer tallene daglig.
- Kort legende for veksttrend (`+%` = flere kunder trenger dette denne måneden vs. forrige).

**Steg 2 — Velg tjeneste å drille ned i**
Rangeringslisten (den som finnes i dag) blir interaktiv:
- Hver rad blir en knapp/rad med hover-state.
- Klikk setter valgt tjeneste i lokal `useState<string>`; default = første tjeneste (GDPR).
- Valgt rad får `bg-primary/5 border-l-2 border-primary`.

**Steg 3 — Kunder som trenger denne tjenesten**
Under listen, i samme `<Section title="Steg 3 · Kunder som trenger «{valgtTjeneste}»">`:
- Kort med liste av 4–6 demokunder for den valgte tjenesten (bruk `FOLLOW_UP_CUSTOMERS`-mønsteret, filtrert/mappet per tjeneste — hardkodet demo-map i filen).
- Hver rad: kundenavn, kort grunn (f.eks. «Mangler DPA for 2 SaaS»), og to knapper: `Åpne kundeprofil` (→ `/msp-partner/customer/{id}` mønster hvis eksisterer, ellers `/msp-partner`) og `Start kampanje` (→ `/msp-messages`).
- Nederst en oppsummeringslinje: «X kunder totalt — [Se alle i servicekatalog →]».

## 3. Metadata-oppdatering

I `WIDGETS["top-services"]`:
- `subtitle`: «Slik finner du hvilke kunder du bør kontakte — og hva du bør tilby dem.»
- `explainer`: utvid til å forklare 3-stegsflyten kort (2–3 setninger).
- CTA beholdes (`Se servicekatalog`), legger til sekundær CTA `Opprett kampanje` → `/msp-messages`.

## Teknisk

- Bruk eksisterende `Tooltip`/`Popover` og `HelpCircle` fra `lucide-react`.
- Ingen nye ruter, ingen nye filer.
- Demo-mapping (tjeneste → kundeliste) legges som en `const` øverst i `MSPWidgetDetail.tsx`.
- Behold typing og eksisterende demo-arrays.

## Ikke i omfang

- Ekte data / Supabase-integrasjon (widgeten er demo).
- Engelsk oversettelse.
- Andre widgets på dashbordet.
- Endringer i sidefelt eller topbar.
