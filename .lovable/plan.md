## Mål
Hver widget på MSP Partner-dashboardet (`/msp-partner`) skal kunne åpnes som en egen landingsside med detaljvisning, slik at partneren kan "lære mer" og bore seg ned i tallene.

## Widgets som får detaljside
Fra `src/pages/MSPPartnerDashboard.tsx`:
1. `ClaimRateWidget` — Claim rate / aktivering
2. `NeedsFollowUpWidget` — Krever oppfølging
3. `AvgTrustScoreWidget` — Gjennomsnittlig trust score
4. `ClaimDevelopmentChart` — Utvikling claim rate
5. `PortfolioSegmentation` — Porteføljesegmentering
6. `TopServicesWidget` — Mest brukte tjenester
7. `CampaignsWidget` — Pågående kampanjer
8. `NewsWidget` — Nyheter fra Mynder

## Løsning

### 1. Felles oppsett
- Ny route-prefiks: `/msp-partner/widget/:widgetId` i `src/App.tsx`.
- Én delt side-komponent `MSPWidgetDetail.tsx` som ruter videre til riktig detalj-innhold basert på `widgetId`.
- Hver widget i `MSPPartnerDashboard.tsx` får et lite "Lær mer"-element i øvre høyre hjørne (ikon + tekstlink, diskret — i tråd med "less is more"-styringen), som navigerer til detaljsiden. Hele widget-kortet blir også klikkbart der det gir mening (klikker man tom flate → samme route).

### 2. Detaljside-struktur (samme layout for alle)
Felles wrapper med `Sidebar`, tilbake-knapp ("Tilbake til dashboard"), og innhold delt i seksjoner:
- **Hero**: widget-tittel, kort beskrivelse, nøkkeltall (samme tall som widget viser).
- **Visualisering**: større versjon av widgetens graf/innhold (gjenbruker eksisterende sub-komponenter der mulig).
- **Hva betyr dette?**: forklarende tekst om hvordan tallet beregnes og hvorfor det er viktig.
- **Detaljer / nedbryting**: liste/tabell med underliggende data (f.eks. per kunde, per segment, per kampanje, per nyhetstype).
- **Anbefalte handlinger**: CTAs til relevante sider (kundeoversikt, lisenser, kampanjeoppsett, osv.) — gjenbruker eksisterende lenker.

### 3. Per-widget detaljinnhold (kort)
- **claim-rate**: Trend siste 12 mnd, brytning per segment, topp 5 kunder med høyest/lavest aktivering.
- **needs-follow-up**: Full liste over de 23 kundene gruppert i 3 kategorier (utdaterte TP, manglende DPA, kritiske avvik) med direkte lenker.
- **avg-trust-score**: Histogram over scorefordeling, kundene som drar snittet ned, månedlig utvikling.
- **claim-development**: Større graf + tabellvisning av månedstall, sammenligning mot mål.
- **portfolio-segmentation**: Detaljert kakediagram, antall kunder per segment, ARR per segment.
- **top-services**: Full rangering med antall kunder/inntekt per tjeneste, vekst siste kvartal.
- **campaigns**: Liste over alle aktive + planlagte + avsluttede kampanjer, resultat per kampanje, opprett ny.
- **news**: Full nyhetsfeed med filter på type (feature/kurs/webinar), arkiv.

### 4. Tekniske detaljer
- Filer som opprettes:
  - `src/pages/MSPWidgetDetail.tsx` (router/switch på `widgetId`).
  - `src/components/msp/widget-details/` med én komponent per widget (`ClaimRateDetail.tsx`, osv.).
- Filer som endres:
  - `src/App.tsx` — ny route.
  - `src/pages/MSPPartnerDashboard.tsx` — legg til "Lær mer"-link/onClick på alle 8 widget-kortene; trekk ut delte data-konstanter (f.eks. `NEWS_ITEMS`, `CAMPAIGNS`) til `src/lib/mspPartnerDashboardData.ts` slik at både dashboard og detaljsidene kan bruke samme demo-data.
- Ingen DB-endringer; alt er demo-data slik som widgetene allerede er i dag.
- Design holder seg til eksisterende tokens (deep purple primary, status-farger for risiko).

## Resultat
Partneren kan klikke seg fra hvilken som helst widget på dashboardet inn på en dedikert side som forklarer tallet, viser større visualisering, lar dem bore seg ned og foreslår neste handling — uten å tilføre støy på selve dashboardet.