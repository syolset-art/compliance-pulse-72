# Plan: Kompakt salgspotensial-kort med Lara-estimat for rådgivningstimer

## Mål
1. **Mindre kort** – «Grunnlag for rådgivningstimer» flyttes ut av kortet og inn i en innstillinger-popover (tannhjul), slik at kortet kun viser overskrift, visningsvelger, totalsum og de to kompakte blokkene (lisenser + rådgivningstimer).
2. **To estimeringsmetoder** – brukeren velger i innstillingene:
   - **Fast timeantall** (som i dag, standard 1 t per krav, redigerbart)
   - **Lara-estimat (AI)** – språkmodellen anslår hvor lang tid hvert enkelt krav typisk tar å implementere, og summerer per regelverk

## Endringer

### 1. Ny Edge Function: `estimate-requirement-hours`
- Input: `framework_name`, `language`, `requirements: [{ id, name }]` (maks ~150, zod-validert)
- Modell: `google/gemini-3-flash-preview` med tool calling (samme mønster som eksisterende `estimate-package-hours`)
- Prompt: Lara som compliance-rådgiver anslår realistisk gjennomføringstid per krav for en mellomstor virksomhet (typisk 0,25–4 t), med kort begrunnelse
- Output: `{ estimates: [{ reqId, hours, rationale }] }`, klammret til 0,25–4 t
- Feilhåndtering: 429/402 med tydelig melding, CORS-headere på alle svar

### 2. Klienthelper: `src/lib/laraRequirementHoursEstimate.ts`
- `estimateRequirementHours(frameworkId, name, rows)` – kaller Edge Function, summerer per krav
- Cache i localStorage (`msp.salesPotential.aiHours`) per regelverk: `{ totalHours, perReq, requirementCount, estimatedAt }` – ugyldiggjøres hvis kravtallet endres, slik at AI bare kjøres ved behov («Regenerer»-knapp)

### 3. `PartnerSalesPotentialCard.tsx` – redesign
- **Fjern** den nederste stripen «Grunnlag for rådgivningstimer»
- **Ny innstillinger-popover** (Settings2-ikon ved siden av Estimert/Mine pakker-velgeren):
  - Timepris (kr/t)
  - Radiovalg: «Fast timeantall per krav» (input, standard 1 t) / «Lara-estimat (AI)»
  - Ved Lara-valg: knapp «Generer estimat» / «Regenerer estimat», spinner under kjøring, feilmelding ved 429/402, og merknad om at estimatet er veiledende
- **Rådgivningstimer-blokken** i Lara-modus: «Estimert av Lara»-badge, totalt antall timer, tooltip med fordeling per regelverk. Mangler estimat: liten CTA «Estimer med Lara» i blokken
- Kortere beskrivelsestekst for et strammere kort

## Tekniske detaljer
- Kravnavn hentes fra `baselineRequirementRows(frameworkId)` (`requirement_id` + `name_no`); syntetiske «Krav N»-rader sendes også – modellen estimerer da ut fra regelverk + posisjon
- Valg av metode lagres i localStorage (`msp.salesPotential.hoursMode`), timepris og fast timeantall beholdes som i dag
- Beregningen ellers uendret: årlig potensial = 12 × lisenser + engangs rådgivningstimer
- «Mine aktiverte pakker»-visningen røres ikke

## Verifisering
- Test Edge Function direkte (curl) med f.eks. NIS2-krav og les svaret
- Playwright: åpne Produkter og tjenester, sjekk at kortet er mindre, åpne innstillinger, velg Lara-estimat, generer og se at timer/total oppdateres med badge
