# Lara-begrunnelse + Dokumentasjon-arkfane

## Mål
1. Når Lara fyller ut baseline-svar, skal hvert svar ha en kort begrunnelse synlig under spørsmålet (én linje, muted) — slik at partneren forstår hvorfor.
2. Ny **Dokumentasjon**-arkfane på kundesiden som forklarer at kunden kan gi Lara tilgang til relevante dokumenter (DPA, policy, hendelsesplan osv.) — i prototypen er det en placeholder-flate uten reell opplasting.

## Endring 1 — Lara-begrunnelse per spørsmål

**Kjeden i dag:**
- `supabase/functions/suggest-baseline-answers` returnerer allerede `{ question_id, answer, rationale }` per spørsmål.
- `MSPCustomerDetail.tsx` (linje 333–339) plukker kun `answer` og kaster `rationale`.
- `BaselineQuestionsDrawer` viser kun `deriveLaraSources(laraScan)` — som er basert på den eldre web-skanningen, ikke på rationale-feltet fra LLM.

**Endringer:**
- Ny localStorage-bøtte i `useCustomerBaseline.ts`: `laraRationales: Record<string, string>` med egen setter `setLaraRationales(next)` og getter. Persistert under `msp.customer.laraRationales.<customerId>`.
- `MSPCustomerDetail.tsx`: ved `setAllBaselineAnswers(next)` etter Lara-forslag, lagre også `rationale`-feltene via den nye setteren.
- `BaselineQuestionsDrawer.tsx`:
  - Ny valgfri prop `laraRationales?: Record<string, string>`.
  - Under hvert spørsmål: hvis det finnes en `rationale` for `q.id`, vis én muted linje med Sparkles-ikon: `Lara: {rationale}`. Den eksisterende `deriveLaraSources`-linjen fjernes som duplikat — `laraRationales` har forrang når den finnes, ellers vis `laraSources[q.id]` som fallback.
  - Når partneren overstyrer svaret manuelt, fjern `laraRationales[qid]` så begrunnelsen ikke står og lyver. (Skjer i `setDraftAnswer` + commit.)

## Endring 2 — Ny "Dokumentasjon"-arkfane på kundesiden

**Plassering:** Som ny `TabsTrigger value="documentation"` i `MSPCustomerDetail.tsx` mellom `trust-profile` og `regulations`.

**Innhold (statisk i prototypen):**
- Kort forklaringskort øverst: "Gi Lara tilgang til kundens dokumentasjon — DPA-er, policyer, hendelsesplaner og andre filer. Lara leser dokumentene og bruker dem som grunnlag for baseline-svar, gap-analyse og forslag til tiltak."
- Tydelig samtykke-/tilgangsboks med ikon (`ShieldCheck`/`Sparkles`): "Lara kan få lese-tilgang til opplastede dokumenter" + en toggle-switch (lokal state, persisteres i localStorage `msp.customer.laraDocAccess.<customerId>`).
- Liste over de samme `DOCUMENT_SLOTS` som finnes i `trustMaturityQuestions.ts` (Personvernerklæring, DPA, Sikkerhetspolicy, Hendelsesplan), hver som en tom plassholder-rad med en "Last opp"-knapp som åpner en toast "Kommer snart — prototype". Status (mangler/lastet opp) vises som et lite ikon til venstre.
- Liten infoboks nederst: "Når dokumentasjon mangler, baserer Lara svarene på antakelser om typiske norske SMB-er. Last opp dokumenter for høyere presisjon."

Ingen ekte filopplasting / Supabase storage i denne iterasjonen — det er rent UI for prototypen.

## Filer som endres
- `src/hooks/useCustomerBaseline.ts` — legg til `laraRationales` + persistens
- `src/pages/MSPCustomerDetail.tsx` — fang `rationale`, send prop til drawer, legg til ny tab
- `src/components/msp/BaselineQuestionsDrawer.tsx` — vis rationale per spørsmål, ryd opp ved overstyring
- `src/components/msp/CustomerDocumentationTab.tsx` — ny komponent for selve fanen

## Ikke i scope
- Ingen ekte filopplasting eller storage-bucket-oppsett.
- Ingen endring i edge function — den returnerer allerede `rationale`.
- Ingen endring i `ActivateTrustProfileWizard` (annen flyt).
