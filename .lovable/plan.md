# Bytt widget: fra aktiveringer til salgspotensial fra gap-analyser

## Mål
Widgetet på MSP-partner dashbordet skal ikke lenger vise aktiverte regelverk over tid, men i stedet vise hvor mye partneren potensielt kan selge i tjenester basert på åpne gap i kunders utvalgte regelverk. Beløp vises i partnerens standardvaluta (ikke låst til NOK).

## Endringer (kun frontend, prototype-data)

### 1. `src/pages/MSPPartnerDashboard.tsx` – `ClaimDevelopmentChart`
Beholder kort-plassering og størrelse, nytt innhold:

- **Tittel:** "Salgspotensial fra gap-analyser"
- **Undertittel:** "Basert på åpne krav i utvalgte regelverk hos 24 kunder"
- **Badge (grønn):** total potensial formatert i partnerens valuta, f.eks. "kr 2,4 M" / "$240k" / "€220k"
- **Graf:** AreaChart over 6 mnd med akkumulert potensial – samme oppsett, ny dataserie.
- **Bunn – 3 KPI-er:**
  1. `24 kunder · 6 regelverk`
  2. `312 åpne gap`
  3. Potensielt salg i partnervaluta (uthevet i primærfarge)

### 2. Valutahåndtering
- Leser partnerens standardvaluta fra eksisterende MSP-billing-innstillinger hvis tilgjengelig (`msp_billing_settings` / `usePartnerInfo` / lignende). Undersøkes ved implementasjon; hvis ikke lett tilgjengelig brukes en enkel prototype-konstant `PARTNER_CURRENCY = "NOK"` som lett kan byttes.
- Formatering via `Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 })` med kompakt notasjon for badge/KPI.
- Ingen konvertering av tall – demo-tallene tolkes i den valgte valutaen.

### 3. Ny data-konstant
Legger til `SERVICE_POTENTIAL_TREND` (6 måneder, stigende) ved siden av `CLAIM_TREND` som beholdes uendret for `/msp-partner/widget/claim-development`.

### 4. Tooltip
"Estimert tjenestesalg partner kan levere for å lukke gap i kundenes aktiverte regelverk. Basert på antall åpne krav × snittpris per tjeneste, i partnerens standardvaluta."

## Ikke i scope
- Ingen ruteendring, ingen backend/DB-endringer, ingen andre widgets.
- Ingen valutakonvertering eller FX-logikk.
