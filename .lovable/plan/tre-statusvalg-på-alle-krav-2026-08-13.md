# Tre statusvalg på alle krav

I dag viser statusvelgeren i regelverk/krav fem verdier: Ikke besvart, Pågår, Implementert, Verifisert, Ikke relevant. Rapportmodellen (`reportRequirementStatus.ts`) bruker allerede tre verdier. Statusvalgene skal harmoniseres til de tre i skjermbildet — overalt hvor bruker setter status på et krav.

## Nye statusverdier

| Valg | Betydning |
|---|---|
| Ja, dette oppfylles | Kravet er oppfylt (grønn hake) |
| Ikke relevant for oss | Kravet er utenfor scope (nøytral, dempet) |
| Ikke påbegynt | Standard/uavklart status (nøytral sirkel) |

Rekkefølge som i bildet: oppfylt øverst, deretter ikke relevant, deretter ikke påbegynt. Valgt verdi markeres med hake og lett fremhevet bakgrunn.

## Hva endres

- Statusmodellen får tre progress-verdier: `fulfilled`, `not_applicable`, `not_started`, med norske og engelske etiketter og ikoner.
- Bulk-statusvelgeren (popover øverst i kravlisten) og statusvelgeren inne på hvert enkelt krav viser kun disse tre.
- Filterpiller og tellere ("I orden", "Venter på deg") mappes til den nye modellen: oppfylt = i orden, ikke påbegynt = venter på deg, ikke relevant = holdes utenfor tellingen.
- "Verifisert" forsvinner som brukervalg. Verifisering vises fortsatt som bevis-/tillitsnivå på dokumentene (uavhengig part, Lara-analyse) — den blandes ikke lenger inn i statusvalget.
- Samme tre valg brukes i kravkort og kontroll-fanen på leverandør, slik at det ikke er avvik mellom flatene.
- Rapportgenerering og modenhetsberegning peker mot den samme tre-verdimodellen, så nedlastede rapporter viser identiske etiketter.

## Teknisk

- `src/lib/requirementStatusModel.ts`: erstatt `ProgressStatus`-unionen og `PROGRESS_CONFIG` med de tre verdiene; behold `EvidenceState` uendret. Legg til en mapping-hjelper fra gamle verdier for demo-data (`implemented`/`verified` → `fulfilled`, `in_progress`/`not_answered` → `not_started`).
- `src/components/regulations/FrameworkRequirementsList.tsx`: oppdater begge status-listene (linje ~458 og ~1074), `bucketOf`, default-verdier og AI-analyse-flyten som i dag setter `verified`/`implemented`.
- Oppdater øvrige filer som refererer til de gamle strengene (`RequirementCard.tsx`, `VendorControlsTab.tsx`, `requirementFulfillment.ts`, `scoringEngine.ts`, `reportRequirementStatus.ts` m.fl.) via mapping-hjelperen, slik at scoring og rapporter er konsistente.
