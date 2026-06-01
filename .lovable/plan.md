## Mål

På framework detail-siden (f.eks. GDPR) får brukeren et nytt alternativ ved siden av "Krav og evaluatorer": et brukervennlig spørreskjema de kan klikke seg igjennom for å gjøre en **gap-analyse**. Resultatet vises som gap-rapport per regelverk, i tillegg til eksisterende modenhetsberegning. GDPR-skjemaet er malen for hvordan vi senere autogenererer skjema for øvrige regelverk.

## Endringer på `/regulations/:frameworkId` (FrameworkDetail.tsx)

Legg til en top-level visningsbryter med tre faner:

```text
[ Krav og evaluatorer ]  [ Spørreskjema (gap-analyse) ]  [ Gap-rapport ]
```

- **Krav og evaluatorer** — dagens visning, uendret.
- **Spørreskjema** — ny guided wizard (se under).
- **Gap-rapport** — vises etter at skjemaet er fullført (eller delvis besvart).

## Spørreskjema-wizard (ny komponent `FrameworkQuestionnaire.tsx`)

Gjenbruker eksisterende `MATURITY_AREAS` fra `src/lib/trustMaturityQuestions.ts` for GDPR (4 områder, 19 spørsmål med Art.-referanse). Dette er den "auto-genererbare" strukturen: hvert regelverk leverer sections → questions → article reference.

Brukervennlig flyt:
- Ett spørsmål om gangen, stort kort midt på skjermen.
- Stor fremdriftslinje øverst: "Spørsmål 4 av 19 · Styring".
- Svaralternativer som store knapper: **Ja / Nei / Delvis / Vet ikke / Ikke aktuelt** (gjenbruker `MaturityAnswer`-typen).
- Valgfri kommentar-felt under hvert spørsmål (collapsable).
- "i"-tooltip viser GDPR-artikkel + Lara-kilde hvis tilgjengelig (`deriveLaraSources`).
- Lara forhåndsutfyller svar fra `deriveDefaultAnswers` (scan) — brukeren bekrefter eller endrer.
- Navigasjon: Tilbake / Hopp over / Neste. "Lagre og fortsett senere" lagrer til localStorage.
- Etter siste spørsmål: "Se gap-rapport" knapp.

Lagres i localStorage med nøkkel `mynder-framework-questionnaire-{frameworkId}`.

## Gap-rapport (ny komponent `FrameworkGapReport.tsx`)

Vises i "Gap-rapport"-fanen. Per regelverk:

- **Sammendrag øverst**: gap-score (% nei + delvis vektet), modenhetsnivå (0–4), antall gap funnet, sist oppdatert.
- **Per kontrollområde** (Styring / Drift / Personvern / Tredjepart): mini score-bar + antall ja/nei/delvis.
- **Gap-liste**: alle "nei"- og "delvis"-svar listet som actionable items med:
  - Spørsmålstekst + Art-referanse
  - Anbefalt tiltak (mappes fra `KEY_TO_SUGGESTED_SERVICE` i `questionnaireRegistry.ts` der mulig, ellers generisk tekst)
  - "Opprett aktivitet"-knapp (gjenbruker `RegisterActivityDialog`-mønsteret)
- **Eksportknapp**: "Last ned gap-rapport (PDF)" — stub for nå, viser toast.

Modenhetsberegning forblir uendret; gap-analysen er et **tillegg** som vises sammen med modenhet.

## Autogenerering for øvrige regelverk

Introduserer en lett `FrameworkQuestionnaireDefinition`-type i `src/lib/frameworkQuestionnaires.ts`:

```ts
{ frameworkId, title, sections: [{ id, title, questions: [{ id, text, reference, suggestedAction? }] }] }
```

- GDPR-definisjonen bygges fra eksisterende `MATURITY_AREAS` (ingen duplisering av innhold).
- Andre regelverk uten egen definisjon faller tilbake til auto-generert skjema basert på `getRequirementsByFramework(frameworkId)` — én ja/nei/delvis per krav, gruppert på `req.category` eller `req.agent_capability`. Dette gir gap-analyse "gratis" for alle regelverk.

## Filer som opprettes / endres

**Nye:**
- `src/lib/frameworkQuestionnaires.ts` — registry + auto-generator.
- `src/components/regulations/FrameworkQuestionnaire.tsx` — wizard.
- `src/components/regulations/FrameworkGapReport.tsx` — gap-rapport.
- `src/hooks/useFrameworkQuestionnaire.ts` — localStorage-state + score-utregning.

**Endret:**
- `src/pages/FrameworkDetail.tsx` — wrapper med 3 faner (Krav / Spørreskjema / Gap-rapport).

Ingen DB-endringer i denne iterasjonen — alt lagres lokalt (samme mønster som `useQuestionnaireDeliveries`). Backend-persistering kan legges på senere.

## Out of scope

- PDF-eksport av gap-rapport (kun stub-knapp).
- Deling av gap-rapport eksternt.
- Auto-mapping av gap-svar tilbake til "Krav og evaluatorer"-status (kan vurderes i neste iterasjon).
