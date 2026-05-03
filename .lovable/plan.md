## Mål
Rydde opp i Veiledning fra Mynder-fanen på systemkortet (`ValidationTab`) slik at den følger samme mal som leverandørkortet: Lara-anbefalingsbanner øverst, deretter modenhet per kontrollområde, og til slutt modenhet per regelverk — med tydelig kontekst om at sistnevnte gjelder systemleverandøren.

## Endringer

**Fjernes fra `src/components/system-profile/tabs/ValidationTab.tsx`:**
- Overskriften "Vårt modenhetsarbeid" (`Briefcase`-headeren).
- "Oppgaver"-kortet (expand/collapse).
- "Compliance per standard" + donut "Total Compliance" + "AI Insights"-kort.
- Hele "Leverandørens baseline"-seksjonen (`VendorTrustScoreCard`, `VendorPrivacyAssessment`).

**Legges til (i denne rekkefølgen):**
1. **`LaraRecommendationBanner`** — samme komponent som brukes på dashbordet og leverandørkortet. Mates med `planTasks` generert fra `generateGuidanceForVendor(systemId)`. Klikk på "Be Lara håndtere det" åpner `RegisterActivityDialog` med forhåndsutfylt forslag.
2. **`AssetMaturityByDomainCard assetId={systemId}`** — eksisterende standardblokk (2x2-grid: Governance, Security, Privacy, Third-Party).
3. **Modenhet per regelverk — leverandøren** — seksjon med:
   - Tittel: "Modenhet per regelverk — leverandøren" (NO) / "Maturity per framework — vendor" (EN).
   - Liten infolinje under tittelen som forklarer:
     > "Viser hvordan {vendorName} oppfyller kravene i hvert regelverk. Virksomhetens egen modenhet beregnes per krav i de regelverkene dere har valgt."
   - `FrameworkMaturityGrid frameworks={frameworks}` (eksisterende komponent).

## Teknisk
- Behold `frameworks`-spørringen mot `selected_frameworks`.
- Fjern ubrukte imports (`Card`, `Progress`, `Badge`, `useTrustControlEvaluation`, `TrustControlsPanel`, `VendorTrustScoreCard`, `VendorPrivacyAssessment`, `tasks`-query osv.).
- Behold props-signaturen (`systemId`, `systemAsAsset`, `tasksCount`, `onTrustMetrics`) for å ikke bryte kallere — `onTrustMetrics`/`tasksCount` blir bare ubrukt internt.
- Lokal state: `dismissed: string[]` for forslag, `activePrefill: SuggestedActivity | null` for aktivitetsdialogen.

## Filer som endres
- `src/components/system-profile/tabs/ValidationTab.tsx` (omskrives).
