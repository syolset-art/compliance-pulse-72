

# Plan: Forbedret Forretningsrisiko – Prioriterte tiltak

## Problem
Siden viser risikoer som en flat liste. Ledere trenger visuell hjelp til å forstå *hvorfor* noe er prioritert og *hva som gir mest igjen* for pengene.

## Endringer

### 1. Risikomatrise (sannsynlighet × konsekvens)
Legger til en visuell 2D-matrise øverst der hver risiko plottes som en sirkel. X-akse = sannsynlighet (%), Y-akse = konsekvens (%). Størrelse = eksponering. Fargekodet etter kategori. Gir umiddelbar visuell forståelse av hvilke risikoer som er i «rød sone».

```text
Konsekvens
  90│      ● HireVue    ● Salesforce
  60│         ● M365
  55│  ● Visma
  40│              ○ Cloudflare
    └──────────────────────────
     10   20   35   40   Sannsynlighet %
```

### 2. ROI-rangering av tiltak
Under matrisen: en sortert tabell/liste som viser tiltak rangert etter **avkastning** (besparelse ÷ tiltakskostnad). Gjør det tydelig for ledere hva som gir best verdi:
- Tiltak, System, Kostnad, Besparelse, ROI-faktor (f.eks. «11.8×»)
- Grønn/gul/rød fargekoding på ROI

### 3. Forbedrede oppsummeringskort
Legger til et fjerde kort: **Gjennomsnittlig ROI** — viser at investering i tiltak lønner seg samlet.

### 4. Beholde eksisterende detaljkort
Collapsible-kortene beholdes under, men listen sorteres etter ROI (beste avkastning først) i stedet for eksponering.

## Filer

| Fil | Endring |
|---|---|
| `src/pages/BusinessRiskDetail.tsx` | Legger til risikomatrise (CSS grid), ROI-tabell, ekstra MetricCard, og omsorterer listen etter ROI |

## Teknisk
- Risikomatrisen bygges med CSS `position: relative` og plottede sirkler (ingen eksternt bibliotek)
- ROI beregnes som `(exposure - residual_exposure - mitigation_cost) / mitigation_cost`
- Gjenbruker eksisterende `RISK_DATA`, `CATEGORY_STYLES`, `formatNOK` fra widget
- EN/NB lokalisert

