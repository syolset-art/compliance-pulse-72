# Detaljert underside for salgspotensial-widgeten

Widgeten lenker allerede til `/msp-partner/widget/claim-development` (via `MSPWidgetDetail`), men innholdet der viser fortsatt "Aktivering over tid". Bytter derfor ut denne underside-varianten så den matcher det nye widget-formålet.

## Endringer i `src/pages/MSPWidgetDetail.tsx`

### 1. Rebrand `claim-development`-metadata
- Tittel: "Salgspotensial fra gap-analyser"
- Undertittel: "Estimert tjenestesalg partner kan levere for å lukke gap i kundenes regelverk"
- Ikon: `TrendingUp`
- Hero: totalt potensial i partnervaluta + støttetekst ("312 åpne gap · 24 kunder · 6 regelverk")
- Explainer: forklarer at estimatet = åpne gap × snittpris per tjeneste, i partnerens standardvaluta
- CTAs: "Åpne servicekatalog" (`/msp-service-catalog`), "Kjør kampanje mot kunder med gap" (`/msp-messages`)

### 2. Ny body-seksjon for `claim-development`
Erstatter dagens aktiveringsgraf-body med:

1. **Potensial siste 6 mnd** — AreaChart basert på `SERVICE_POTENTIAL_TREND_DETAIL` (samme kurve som dashboard-widgeten, verdier i partnervaluta). Tooltip og hero-tall formateres via `Intl.NumberFormat` med partnervalutaen (samme `PARTNER_CURRENCY = "NOK"`-prototype-konstant, definert lokalt i filen).
2. **Potensial per regelverk** — BarChart / tabell med kolonner: Regelverk · Åpne gap · Snittpris/gap · Potensial. Demo-data for GDPR, ISO 27001, NIS2, DORA, AI Act, Åpenhetsloven.
3. **Kunder med størst potensial** — enkel liste (5–7 rader): kundenavn · antall gap · estimert potensial · «Åpne kunde»-knapp.

### 3. Partnervaluta
- Legger til `PARTNER_CURRENCY`/`PARTNER_LOCALE` + `formatPartnerCurrency` lokalt i `MSPWidgetDetail.tsx` (samme mønster som dashboard). Ingen backend/DB-endring.

## Ikke i scope
- Ingen ny rute, ingen navigasjonsendring på dashboardet (kortet er allerede klikkbart).
- Ingen andre widgets på detaljsiden røres.
- Ingen ekte data / edge functions – ren prototype.
