## Mål
På fanen **Veiledning fra Mynder** (`/msp-dashboard/:id?tab=guidance`) skal det ikke lenger ligge en full baseline-utfylling for kunden. Baseline tilhører Trust Profile-fanen — Veiledning skal handle om hva *partneren* kan gjøre for denne kunden.

## Endringer i `src/pages/MSPCustomerDetail.tsx` (Veiledning-fanen)

**Fjernes fra fanen:**
- `BaselineReadinessCard` (hele "Fyll ut / Se over baseline / Lara-foreslå"-kortet)
- `BaselineQuestionsDrawer` + tilhørende state-håndtering brukt kun her (`baselineDrawer`, `isLaraSuggesting`, `setAllBaselineAnswers`, `setBaselineRationales`-flyten kalt fra dette kortet)
- `QuestionnaireDispatchCard` (hører til kunde-dialog, ikke partner-veiledning)

**Beholdes på fanen:**
- `LaraRecommendationBanner` med åpne oppgaver (det partneren kan gjøre nå) — uendret.
- "Ingen åpne oppgaver"-tilstand når lista er tom.

**Legges til på fanen — ett nytt, lite kort "Baseline":**
- Én linje som forklarer hva baseline er (1–2 setninger, nøytral tone).
- Status-pille: "X av Y spørsmål besvart" (henter fra eksisterende `totalAnswered` / `totalQuestions`).
- Knapp "Se baseline i Trust Profile" → `handleTabChange("trust-profile")`.
- Ingen utfyllings-CTA, ingen Lara-foreslå-knapp, ingen drawer.

**Plassholder for fremtidige tjenester (skjult inntil videre):**
- Ingen UI nå. Kommentar i koden som markerer hvor "Nye tjenester fra Mynder"-seksjonen skal inn senere, slik at neste iterasjon har et tydelig anker.

## Endringer i `src/pages/MSPCustomerDetail.tsx` (Trust Profile-fanen)
Ingen funksjonelle endringer. Baseline vises allerede der via `MSPCustomerTrustProfileCard` — vi bekrefter at lenken fra Veiledning lander på riktig sted.

## Filer som *ikke* røres
- `BaselineReadinessCard.tsx`, `BaselineQuestionsDrawer.tsx`, `QuestionnaireDispatchCard.tsx` — komponentene består, brukes fortsatt andre steder (Trust Profile-flyt, onboarding). Vi fjerner bare bruken på Veiledning-fanen.
- Sidebar, ruting, oversettelser — uendret.

## Resultat
Veiledning-fanen blir et rent partner-arbeidsbord: anbefalte tiltak + kort status på baseline med lenke videre. Selve baseline-utfyllingen ligger der den hører hjemme — under Trust Profile.