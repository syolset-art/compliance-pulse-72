## Mål
Fjerne Lara-gap-analysene fra MSP-kunde Veiledning-fanen — de gir ikke mening ennå. Behold baseline og spørreskjema-utsendelse.

## Endringer

### `src/pages/MSPCustomerDetail.tsx`
- Fjern `RegulationGapAnalysisCard` (steg 2) inkl. import og `startGapRef`.
- Fjern `QuestionnaireGapList` (steg 4 — "Lara-gap fra siste fullførte skjema") inkl. import og `gap-list-anchor`-wrapper.
- Fjern `verifyContext`-state, verifiseringsbanneret over spørreskjemaet og `onVerifyWithQuestionnaire`-prop-flyten.
- Behold `QuestionnaireDispatchCard` (sende spørreskjema til kunden — uavhengig av gap-analyse).
- Numrer kommentarene: 1) Baseline, 2) Spørreskjema.

### `src/components/msp/BaselineReadinessCard.tsx`
- Fjern "Kjør gap-analyse"-knappen og `onStartGapAnalysis`-prop. Behold "Fyll ut baseline" / "Fortsett baseline" / "Se over baseline", og fallback "Gå til Regelverk" når ingen regelverk er aktive.
- Juster hjelpeteksten så den ikke nevner gap-analyse.

### `src/pages/MSPCustomerDetail.tsx` (forts.)
- Fjern `onStartGapAnalysis`-prop som sendes til `BaselineReadinessCard`.

## Out of scope
- Komponentfilene `RegulationGapAnalysisCard.tsx` og `QuestionnaireGapList.tsx` slettes ikke (kan brukes igjen senere) — de bare avregistreres fra denne siden.
