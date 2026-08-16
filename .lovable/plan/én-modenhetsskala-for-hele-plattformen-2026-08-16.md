# Én modenhetsskala for hele plattformen

I dag vises samme underliggende tall som «Trust score», «Compliance score» eller «%» med litt ulike fargegrenser rundt om i løsningen. Vi samler dette til én skala: **Modenhet — Lav / Middels / Høy**, med faste farger og en forklaring brukeren alltid kan åpne.

## Skalaen

```text
Høy      grønn    75–100 %
Middels  oransje  50–74 %
Lav      rød       0–49 %
```

Samme grenser og samme farger overalt: leverandører, systemer, enheter, kontrollområder, regelverk, dashbord, rapporter og MSP-flatene.

## Slik vises det

- Etiketten er «Modenhet» (ikke Trust score / Compliance score) der tallet beskriver etterlevelsesnivå.
- Verdien vises som farget prikk + tekst: «Høy», «Middels», «Lav». Prosenttallet vises ikke i grensesnittet.
- Ved siden av står et lite info-ikon. Klikk/hover åpner en kort forklaring:
  - hva som regnes som Lav, Middels og Høy (grensene over)
  - hvordan tallet beregnes (snitt av modenhetsnivå 0–4 per krav i scope)
  - hva som skal til for å komme til neste nivå for akkurat dette objektet
- Progressbarer og fordelingsbarer beholdes, men fargelegges alltid fra samme kilde.

## Teknisk gjennomføring

1. Ny modul `src/lib/maturityLevel.ts` som eneste kilde:
   - `getMaturityLevel(score)` → `"low" | "medium" | "high"`
   - `MATURITY_THRESHOLDS` (50 / 75)
   - `maturityLabel(level, t)` med i18n-nøkler (nb: Lav/Middels/Høy, en: Low/Medium/High)
   - `maturityTextClass` / `maturityBgClass` / `maturityBorderClass` som returnerer semantiske tokens (`text-destructive`, `bg-warning`, `text-success` osv.) — ingen hardkodede farger
   - `maturityExplanation(score)` som gir tekst til forklaringen
2. Ny delt komponent `src/components/shared/MaturityIndicator.tsx` (varianter: `badge`, `inline`, `bar`) med innebygd info-popover som bruker `maturityExplanation`.
3. Erstatt lokale `scoreColor`-funksjoner og ad-hoc terskler med helperen. Berørte områder (ca. 60 filer som leser `compliance_score` / trust score):
   - Leverandør: `ShareVendorPortfolioDialog`, `VendorTableView`, `VendorCompareTab`, `VendorOverviewTab`, `VendorInsightsWidget`
   - Systemer/enheter: `SystemHeader`, `SystemMetrics`, `DeviceHeader`, `DeviceTrustProfile`, `DeviceComplianceTab`
   - Compliance/rapport: `ComplianceOverview`, `FrameworkGapReport`, `DashboardOverallMaturity`, `DashboardFrameworkStatus`
   - MSP: `MSPPartnerDashboard`, `MSPWidgetDetail`, `CustomerMaturityMirrorCard`
4. Beregningen i `src/lib/scoringEngine.ts` endres ikke — kun presentasjon og fargelegging.
5. Nye/oppdaterte oversettelsesnøkler i `src/locales/nb.json` og `en.json` under `maturity.*`.
6. Nedlastede rapporter/PDF-eksport bruker samme etiketter og farger som skjermbildet.
