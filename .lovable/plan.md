

# To nye dashboard-widgets for sikkerhetsansvarlig og ledelse

## Widget 1: Forretningsrisiko i kroner (FAIR-modell)

Kvantifiserer risikoeksponering i NOK basert på FAIR-metodikken (Factor Analysis of Information Risk). Viser estimert annualisert tap (ALE) per forretningsområde/prosess, koblet til underliggende systemer og leverandorer.

**Innhold:**
- Totaleksponering i NOK (f.eks. "Estimert arlig risikoeksponering: kr 4 250 000")
- Top 5 risikoer rangert etter estimert tap, med kobling til prosess, system og leverandor
- Mini horisontalt bar-chart per risiko som viser sannsynlighet vs konsekvens
- Fargekodede risikokategorier (Datatap, Nedetid, Regelverksbrudd, Leverandorsvikt)
- Trend-indikator: endring fra forrige kvartal
- CTA-knapp: "Se full risikoanalyse" -> navigerer til risk management

**Demodata hardkodet:**
```
Ansettelsesprosess / HireVue    -> kr 1 800 000 (datatap, hoy)
Kundedatasystem / Salesforce    -> kr 1 200 000 (nedetid, hoy)
Okonomi / Visma                 -> kr   650 000 (regelverksbrudd, medium)
E-post / Microsoft 365          -> kr   400 000 (datatap, medium)
Nettside / Cloudflare           -> kr   200 000 (nedetid, lav)
```

**Fil:** `src/components/widgets/BusinessRiskExposureWidget.tsx`
**Storrelse:** `half` (320px)

---

## Widget 2: Kritiske avhengigheter og sarbarhetskart

Visuell oversikt over de mest sarbare forretningsomradene basert pa konsentrasjon av kritiske systemer, leverandorer og prosesser. Hjelper ledelsen a forstå "single points of failure".

**Innhold:**
- 3-4 forretningsomrader (Helse, Okonomi, HR, Drift) med sarbarhetsscore (0-100)
- Per omrade: antall kritiske systemer, leverandorer uten DPA, prosesser uten eier
- Visuell "heatmap-stripe" (rod/gul/gronn) per omrade
- "Storst sarbarhet"-highlight med konkret anbefaling
- CTA: "Utforsk avhengigheter" -> navigerer til work areas

**Demodata hardkodet:**
```
HR & Rekruttering    -> 82/100 (3 systemer, 1 uten DPA, 2 hoyrisiko-AI)
Okonomi & Regnskap   -> 65/100 (4 systemer, 0 uten DPA, 1 review utlopt)
Pasientbehandling    -> 71/100 (5 systemer, 2 uten DPA, sensitiv data)
IT & Drift           -> 45/100 (6 systemer, alle med DPA, god dekning)
```

**Fil:** `src/components/widgets/VulnerabilityMapWidget.tsx`
**Storrelse:** `half` (320px)

---

## Integrasjon i dashbordet

I `src/pages/Index.tsx`:
- Legg til begge i `WIDGET_DEFS` med id `business-risk-exposure` og `vulnerability-map`
- Plasser dem etter `user-actions` og for `critical-processes` i default-rekkefølgen
- Begge som `half`-størrelse slik at de vises side om side

## Tekniske detaljer
- Følger eksisterende widget-mønster med Card/CardContent
- Norsk UI-tekst som standard, i18n-klar med `useTranslation`
- Hardkodede demodata (ingen DB-avhengighet)
- Navigasjonsknapper med `useNavigate`
- Responsive grid med `grid-cols-2` for metrikkene

