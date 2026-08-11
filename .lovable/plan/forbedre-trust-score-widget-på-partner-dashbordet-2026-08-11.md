# Forbedre «Trust score»-widget på partner-dashbordet

Forbedre `AvgTrustScoreWidget` i `src/pages/MSPPartnerDashboard.tsx` slik at den får mindre luft øverst og viser mer interessant, aggregert modenhetsinformasjon.

## Endringer

1. **Flytt innholdet opp**
   - Endre widgetens interne layout fra vertikal sentrering (`items-center`) til toppjustering (`items-start` / `flex-col`).
   - Plasser score-ring, tittel og delta i en kompakt øvre rad slik at det ikke henger i midten av kortet.

2. **Legg til porteføljefordeling med små søyler**
   - Under score-raden vises en «Fordeling»-blokk med tre bånd:
     - **< 50 %** (destructive) – lav modenhet
     - **50–74 %** (warning) – middels modenhet
     - **≥ 75 %** (success) – høy modenhet
   - Hver søyle viser andel (%) og antall kunder.
   - Bruk mockdata i samme stil som resten av filen (f.eks. 300 kunder totalt).

3. **Legg til nedbrytning per kontrollområde**
   - Under fordelingen vises en «Per kontrollområde»-blokk med små søyler for de fem områdene med Mynders vekter:
     - Personvern (30 %)
     - Styring (25 %)
     - Drift og sikkerhet (25 %)
     - Identitet og tilgang (10 %)
     - Tredjepart og verdikjede (10 %)
   - Vis kun områdenavn og prosent, kompakt format.

4. ** behold visuell profil**
   - Ingen hardkodede farger – bruk semantiske tokens: `text-success`, `bg-success`, `text-warning`, `bg-warning`, `text-destructive`, `bg-destructive`, `text-muted-foreground`, `bg-muted`.
   - Hold fontstørrelser og søylehøyder i tråd med nabotjenestene (ca. `[11px]` og `h-1.5`).
   - Sørg for at widgeten fortsatt fungerer i `lg:grid-cols-3` uten å knekke layout.

## Ikke i scope
- Endre beregning av Trust score (fortsatt mockdata).
- Endre andre widgets eller datakilder.
- Backend/database.
