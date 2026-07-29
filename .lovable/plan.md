## Mål
"Veiledning fra Mynder" skal være partnerens én-side-oversikt over kunden: baseline-svar (valgfri kartlegging), regelverk-status (AI-anbefalt vs. bekreftet), og hvilke tjenester partneren typisk kan levere. Trust Profile-lenken fjernes helt.

## Endringer på Veiledning-tab (MSPCustomerDetail.tsx)

### 1. Baseline-kortet — åpne spørreskjema direkte
Kortet "Baseline" beholdes, men knappen bytter fra "Åpne Trust Profile" til **"Start kartlegging"** / **"Fortsett kartlegging"** som åpner `BaselineQuestionsDrawer` (finnes allerede). Ingen navigering til Trust Profile.

- Tittel: "Baseline-kartlegging (valgfritt)"
- Undertekst: "Still 15 enkle spørsmål sammen med kunden for å forbedre modenhetsestimatet per kontrollområde."
- Chip viser `{totalAnswered}/{totalQuestions}` og mini-progressbar

### 2. Ny seksjon: "Modenhet per kontrollområde" (read-only speiling)
Kompakt speiling av widgeten fra Trust Profile (skjermbildet). 5 rader (Styring, Drift, Personvern, Identitet, Tredjepart) med % og Trust Score til høyre. Ingen drill-down — bare status. Hjelpetekst: "Estimert fra offentlig informasjon. Fyll ut baseline for mer presis vurdering."

### 3. Ny seksjon: "Regelverk kunden må følge"
Liste over kundens `recommended_frameworks` + `confirmed_frameworks` (fra `msp_customers`, satt under onboarding). Hver rad:

- Navn + kort begrunnelse ("Norsk virksomhet > 50 ansatte → NIS2")
- Status-badge:
  - `Bekreftet av deg` (solid, primary, Check-ikon) — når `confirmed_frameworks` inneholder id
  - `AI-anbefalt` (outline, Sparkles-ikon) — når kun i `recommended_frameworks`
- Handlinger: `Bekreft` (én-klikk flytter til confirmed) eller `Fjern`

Åpner `RegulationsConfirmSheet` for full liste og bulk-håndtering (gjenbruker eksisterende `MSPCustomerRegulationsTab` som sheet).

### 4. Ny seksjon: "Tjenester du kan tilby denne kunden"
Basert på bekreftede + AI-anbefalte regelverk, kryssreferer `serviceMatcher.ts` mot partnerens tjenestekatalog. Viser topp 4–6 tjenester som chip-kort:

- Tjenestenavn + hvilke krav den dekker (f.eks. "GDPR Art. 32, NIS2 Art. 21")
- Badge: `I katalogen` eller `Foreslått fra Mynder`
- CTA: "Lag tilbud" → åpner `MSPCreateOfferDialog` forhåndsutfylt

Link til full liste: "Se alle matchende tjenester →" (åpner tjenestekatalog filtrert på kunden).

### 5. Fjerning
- Fjern kortet "Skjulte saker – kun synlig for partner" sin knapp `Åpne Trust Profile` (erstatt med "Lukk").
- `ComplianceMappingCard` (15-spørsmåls-panelet fra forrige iterasjon) fjernes — baseline-kortet dekker samme behov.

## Teknisk

**Filer som endres:**
- `src/pages/MSPCustomerDetail.tsx` — refaktorer `guidance`-TabsContent til 4 kort i rekkefølge: Baseline · Modenhet · Regelverk · Tjenester
- Ny `src/components/msp/guidance/MaturityMirrorCard.tsx` — leser eksisterende modenhet-scores (fra `useCustomerBaseline.areaProgress` eller tilsvarende)
- Ny `src/components/msp/guidance/RegulationsStatusCard.tsx` — bruker `msp_customers.recommended_frameworks` / `confirmed_frameworks`
- Ny `src/components/msp/guidance/ServiceMatchCard.tsx` — bruker `serviceMatcher.ts` + `useSavedOffers` for match

**Ingen DB-endringer** — kolonnene `recommended_frameworks` og `confirmed_frameworks` finnes allerede.

**Ingen ny navigering** — alt skjer i sheets/drawers på samme side.

## Layout på Veiledning-tab (etter endring)

```text
┌─ Åpne oppgaver (uendret) ────────────────┐
├─ Baseline-kartlegging (valgfritt)  [Start]
├─ Modenhet per kontrollområde  Trust 0/100
│    5 rader med %-bar
├─ Regelverk kunden må følge
│    GDPR  [Bekreftet]     [Fjern]
│    NIS2  [AI-anbefalt]   [Bekreft]
├─ Tjenester du kan tilby
│    4–6 chip-kort  [Lag tilbud]
└──────────────────────────────────────────┘
```
