## Mål

Gjøre det tydelig på MSP-kundedetalj (Veiledning-fanen) at en baseline består av kundens egenerklæringer i de fire kontrollområdene fra Trust Profile, og at **partneren kan fylle ut eller gå gjennom disse på vegne av kunden** før de starter gap-analysen.

## Hva er "baseline" i dag vs. det vi vil ha

I dag: `BaselineReadinessCard` regner baseline som "klar" så snart minst ett regelverk er aktivert (`activeCount > 0`). Det er for tynt — det sier ingenting om at kunden faktisk har svart ut grunnlaget for Trust Profile.

Vi knytter baseline til de samme fire kontrollområdene som brukes når en Trust Profile opprettes/claim-es (`src/lib/trustMaturityQuestions.ts` → `MATURITY_AREAS`):

1. **Styring** (Governance) — 5 spørsmål
2. **Drift og sikkerhet** (Operations) — 5 spørsmål
3. **Personvern og datahåndtering** (Privacy) — 5 spørsmål
4. **Tredjepartsstyring** (Third-party) — 4 spørsmål

Når partneren fyller ut svar her, bekrefter de implisitt at de har innsikt til å gjøre det på vegne av kunden. Svarene lagres som `customer_asserted` (vendor-/partner-asserted) og danner grunnlaget for gap-analysen.

## UX-flyt på Veiledning-fanen

```text
┌─ 1) Baseline ──────────────────────────────────────────────┐
│  Status: 12 / 19 spørsmål besvart   • 2 regelverk aktive  │
│  ──────────────────────────────────────────────────────── │
│  Styring              ●●●●○   4/5                          │
│  Drift og sikkerhet   ●●○○○   2/5                          │
│  Personvern           ●●●●●   5/5                          │
│  Tredjepartsstyring   ●○○○○   1/4                          │
│                                                            │
│  Du kan fylle ut baselinen på vegne av kunden — eller     │
│  se gjennom det Lara allerede har foreslått.              │
│                                                            │
│  [Fyll ut baseline]  [Se over baseline]  [Kjør gap-analyse]│
└────────────────────────────────────────────────────────────┘
```

- "Fyll ut baseline" og "Se over baseline" åpner samme drawer/side med kontrollområdene; forskjellen er at "Se over" hopper rett til områder med Lara-forslag som ikke er bekreftet.
- "Kjør gap-analyse" forblir tilgjengelig hele tiden, men er kun primær knapp når baseline er ≥ ~80 % komplett (terskel justerbar). Under det er den sekundær med tooltip: *"Anbefalt: fyll ut baseline først for mer presis gap-analyse"*.
- Kortet snakker direkte til partneren ("Du kan...", "på vegne av kunden") jf. tone-of-voice for partner-vendt UI.

## Endringer

### 1. `src/components/msp/BaselineReadinessCard.tsx`
Erstatt nåværende enkel-status med ny struktur:
- Props utvides: `areaProgress: { area: string; answered: number; total: number }[]`, `totalAnswered`, `totalQuestions`, `activeFrameworkCount`, `onFillBaseline`, `onReviewBaseline`, `onStartGapAnalysis`.
- Liste de fire områdene med dots/progress (semantiske tokens: `bg-primary` for besvart, `bg-muted` for ubesvart). Bruk ikonene fra `MATURITY_AREAS`.
- Tre CTA-er: "Fyll ut baseline", "Se over baseline", "Kjør gap-analyse". Knappehierarki avhenger av completeness.
- Tekster på norsk, partner-tone ("Du fyller ut...", "på vegne av kunden").

### 2. Ny komponent `src/components/msp/BaselineQuestionsDrawer.tsx`
- `Sheet`/`Drawer` (shadcn) som åpnes fra knappene over.
- Bruker `MATURITY_AREAS` fra `src/lib/trustMaturityQuestions.ts` direkte — samme spørsmål som ved Trust Profile-aktivering.
- Per spørsmål: ja / nei / senere (samme `MaturityAnswer`-type), Lara-kilde-tooltip når tilgjengelig (`deriveLaraSources`).
- Topp-banner: *"Du svarer på vegne av {kundenavn}. Svarene lagres som partner-bekreftet og inngår som baseline i gap-analysen."*
- "Se over"-modus filtrerer til spørsmål der Lara har foreslått svar som ennå ikke er bekreftet (start-tab).
- Lagring: per kunde i `localStorage` nøkkel `msp.customer.baselineAnswers.{customerId}` (følger samme mønster som `msp.customer.activatedFrameworks.{customerId}`). Ingen DB-endringer i denne iterasjonen — holdes som frontend-/demo-state.

### 3. `src/pages/MSPCustomerDetail.tsx`
- Last baseline-svar fra localStorage via en liten hook (`useCustomerBaseline(customerId)`) og regn ut `areaProgress` + totaler basert på `MATURITY_AREAS`.
- Send props inn i `BaselineReadinessCard`. Behold `RegulationGapAnalysisCard` som steg 2.
- State for å åpne drawer i "fill" eller "review"-modus.

### 4. Tekst/tone
- All ny tekst på norsk, snakker direkte til partneren.
- "Kontrollområde" konsistent med Trust Profile-siden (memoir: 4 Core Domains).

## Out of scope
- Persistere baseline-svar i Supabase (kan komme i neste iterasjon — nå holder vi det i localStorage på samme måte som aktiverte regelverk).
- Endre selve gap-analyse-algoritmen — den bruker fortsatt aktiverte regelverk; baseline-svarene blir vist som kontekst og kan brukes av Lara senere.
- Endringer på Trust Center-/Edit Profile-siden (`TrustCenterEditProfile.tsx`) — vi gjenbruker dataene derfra, men endrer ikke den UI-en.
