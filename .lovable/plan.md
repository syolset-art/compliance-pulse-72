## Mål

Gjør Baseline-modulen konsistent med de 5 kanoniske kontrollområdene (samme som Trust Profile-kortet "Kontrollområder per regelverk"), og kommuniser tydelig at **GDPR er inkludert gratis som baseline** så snart en kunde er invitert inn — uten å kreve at partneren først aktiverer et regelverk.

## Endring 1 — Baseline-spørsmål speiler de 5 kontrollområdene

I dag har `src/lib/trustMaturityQuestions.ts` fire områder: `governance`, `operations`, `privacy`, `third_party`. Det mangler **Identitet og tilgang**, og `third_party` matcher ikke den kanoniske nøkkelen `vendor`.

Oppdater `MATURITY_AREAS` til å bruke samme nøkler, titler, ikoner og rekkefølge som `CONTROL_AREAS` i `src/lib/controlAreas.ts`:

| Nøkkel | Tittel | Endring |
|---|---|---|
| `governance` | Styring og ansvar | Beholdes (5 spørsmål) |
| `operations` | Drift og sikkerhet | MFA-spørsmål flyttes ut |
| `identityAccess` | Identitet og tilgang | **Nytt område** – flytter `ops.mfa` hit + 3 nye spørsmål (rollebasert tilgang, minste privilegium, joiner/mover/leaver) |
| `privacy` | Personvern og datahåndtering | Beholdes (5 spørsmål) |
| `vendor` | Tredjepart og verdikjede | Rename fra `third_party`, samme spørsmål |

Spørsmålene knyttes fremdeles til GDPR-artikler (Art. 32 for tilgang/MFA) slik at GDPR-baselinen er meningsfull selv uten andre regelverk aktivert.

## Endring 2 — GDPR alltid med som "gratis baseline"

Når kunden er invitert inn vises ikke lenger "0 aktiverte regelverk" som et hinder. I `BaselineReadinessCard`:

- Legg til en liten "Inkludert gratis"-pill ved siden av tittelen som forklarer at **GDPR-baseline er gratis og tilgjengelig fra kunden er invitert**
- Endre underteksten når `activeFrameworkCount === 0` til: *"GDPR-baseline er inkludert gratis. Fyll ut spørsmålene for å aktivere kundens Trust Profile — flere regelverk kan legges til etterpå."*
- Fjern "Gå til Regelverk"-CTAen som primær handling når ingen regelverk er aktivert; "Fyll ut baseline" forblir primær, "Legg til flere regelverk" blir sekundær lenke
- `isReady`-betingelsen endres fra `completeness >= 0.8 && hasFramework` til `completeness >= 0.8` (GDPR teller alltid)

I `MSPCustomerDetail.tsx` justeres `activeFrameworkIds` slik at `gdpr` alltid er inkludert som implisitt baseline når kunden eksisterer (uten å skrive til `customer.active_frameworks` i DB) — kun for visningslogikk i Baseline-kortet og Trust Profile-summen.

## Endring 3 — Følgeoppdateringer

- `BaselineQuestionsDrawer.tsx` bruker `MATURITY_AREAS` direkte og får derfor automatisk den nye 5-fane-strukturen — verifiseres at tab-rekkefølge stemmer med kanonisk rekkefølge
- `deriveDefaultAnswers` og `deriveLaraSources` oppdateres slik at `ops.mfa` → `ia.mfa` (ny id), og eventuelle eksisterende localStorage-svar migreres mykt (les begge nøkler ved oppstart)
- Tooltip på "Inkludert gratis"-pillen forklarer at GDPR alltid er med, og at det er Bekks/Mynders policy at GDPR-baselinen er gratis for alle inviterte kunder

## Teknisk

**Filer som endres:**
- `src/lib/trustMaturityQuestions.ts` — restrukturer `MATURITY_AREAS` til 5 områder med kanoniske nøkler, flytt MFA, legg til 3 nye identityAccess-spørsmål, oppdater `deriveDefaultAnswers`/`deriveLaraSources`, behold migrering av `ops.mfa`→`ia.mfa`
- `src/components/msp/BaselineReadinessCard.tsx` — ny "Inkludert gratis"-pill, oppdatert kopi når ingen regelverk er aktivert, justert `isReady`, sekundær lenke til Regelverk
- `src/pages/MSPCustomerDetail.tsx` — sørg for at GDPR alltid telles i `activeFrameworkIds` for Baseline-visning (uten DB-skriving)
- `src/components/msp/BaselineQuestionsDrawer.tsx` — kun verifisering, ingen logikk-endringer

**Ikke i scope:** DB-migrering av `customer.active_frameworks`, endringer i fakturering/credits, endringer i andre Trust Profile-visninger enn Baseline-kortet.
