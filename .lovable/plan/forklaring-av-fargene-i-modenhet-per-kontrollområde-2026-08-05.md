# Forklaring av fargene i "Modenhet per kontrollområde"

Widgeten på dashboardet bruker farger (rød/gul/grønn) uten å si hva de betyr. Partnersiden har allerede løst dette på kundekortet med et hjelpeikon og en linje som viser hvilken scoringsmodell som ligger bak. Vi gjenbruker samme mønster.

## Hva som gjøres

1. **Hjelpeikon i kortoverskriften** – samme diskrete spørsmålstegn som på partnerkortet. Ved hover forklares kort: modenhet måles per kontrollområde, prosenten er andel oppfylte krav innenfor aktiverte regelverk, og den øker etter hvert som krav dokumenteres.

2. **Fargeforklaring (legend)** – en tynn linje nederst i kortet med tre prikker og tekst:
   - Rød prikk: Lav modenhet (under terskel) – få krav oppfylt
   - Gul prikk: Middels modenhet – på vei, men vesentlige hull
   - Grønn prikk: Høy modenhet – de fleste krav oppfylt og dokumentert
   
   Hver prikk viser prosentintervallet sitt, og linjen avsluttes med "Basert på Mynders scoringsmodell (v1)" – identisk med partnerkortet.

3. **Samme forklaring per kontrollområde** – når man hover på et enkelt kontrollområde vises nivået i klartekst (f.eks. "Middels modenhet – 56 av 68 krav oppfylt") slik at fargen på stolpen alltid har en tekstforklaring ved siden av (viktig for tilgjengelighet, farge alene skal ikke bære betydning).

## Terskler

Dashboardet bruker i dag 0–33 lav / 34–66 middels / 67+ høy, mens partnerkortet bruker scoringsmodellens 0 / 1–49 / 50–74 / 75+. Forslaget er å la dashboardet følge scoringsmodellen slik at samme farge betyr det samme overalt, og at teksten i legend matcher det som står i Mynder Score Model (v1).

## Teknisk

- `src/components/dashboard-v2/AggregatedMaturityWidget.tsx`: legg til hjelpeikon (HoverCard, allerede importert) og legend-rad; la `maturityLevel` hente terskler/etiketter fra `getMaturityBand`/`MATURITY_BANDS` i `src/lib/scoringEngine.ts` i stedet for egne grenser.
- Kun semantiske tokens (`success`, `warning`, `destructive`) – ingen hardkodede farger.
- Tekster legges inn med i18n-nøkler (NB/EN) på linje med resten av widgeten.
