# Forenkle Gap-analyse mot rammeverk + agentisk oppfølging

Strip ned `VendorGapAnalysisTab` til kjernen: velg rammeverk → se mangler → la Lara opprette oppfølgingsaktiviteter agentisk.

## Mål

- Fjern alt domeneoppsett (Styring, Drift og sikkerhet, Personvern, Tredjepart) fra fanen — det hører ikke hjemme her.
- Vis én flat, prioritert liste over mangler ("missing" + "partial").
- Etter listen: ett tydelig Lara-spørsmål — *"Skal jeg sette opp oppfølgingsaktiviteter for disse N manglene?"* — Ja / Nei.
- Ved Ja: aktiviteter registreres automatisk i aktivitetsloggen, med Laras vanlige autonomi-mønster (auto-utført eller venter på bekreftelse per aktivitet).

## Ny fane-layout

```
┌────────────────────────────────────────────────────┐
│  Velg rammeverk: [ Normen ▾ ]   [ Kjør analyse ]   │
├────────────────────────────────────────────────────┤
│  Score 64% ▓▓▓▓▓▓░░░  • 8 oppfylt • 3 delvis • 5 mangler │
├────────────────────────────────────────────────────┤
│  Mangler (8)                                       │
│  ─────────────────────────────────────────────     │
│  ⛔ NOR-3.2  DPA mangler                           │
│      Lara: Be leverandør om signert DPA            │
│  ⚠️ NOR-4.1  SOC 2-rapport utløpt                  │
│      Lara: Etterspør oppdatert rapport             │
│  ⛔ NOR-5.4  Hendelsesvarsling ikke dokumentert    │
│      Lara: Be om varslingsrutine                   │
│  ...                                               │
├────────────────────────────────────────────────────┤
│  ✦ Lara                                            │
│  Skal jeg sette opp oppfølgingsaktiviteter for     │
│  disse 8 manglene?                                 │
│                                                    │
│  [ Ja, sett opp aktiviteter ]   [ Nei, ikke nå ]   │
└────────────────────────────────────────────────────┘
```

Etter Ja:
```
┌────────────────────────────────────────────────────┐
│  ✦ Lara satte opp 8 aktiviteter                    │
│  • 5 utført automatisk (e-post sendt, oppgave...)  │
│  • 3 venter på din bekreftelse  →  [Se aktivitet]  │
└────────────────────────────────────────────────────┘
```

Hver aktivitet får:
- type (e-post / oppgave / møte) — utledet fra mangelen
- nivå, tema, kritikalitet — utledet fra rammeverk + status
- tittel + beskrivelse — fra `buildProposal()` (gjenbrukes)
- `linkedGapId` peker til mangelen
- `actorRole`: "Lara — autonom" eller "Lara — venter på bekreftelse"

## Hva fjernes

- `DOMAIN_LABELS` og hele domain-grouping
- "Domain summary chips"-griden (4 farger per domene)
- `Collapsible`-seksjoner per domene
- `AgentPlanStrip` (erstattes av enkelt Lara-spørsmål)
- `InlineAgentProposal` per rad (erstattes av samlet bulk-handling)
- "Eksporter PDF" knappen (foreløpig — ikke aktuelt for forenklet visning)

## Hva beholdes

- Rammeverk-velger + "Kjør analyse"-knapp
- Score-summary (samsvar % + tellere)
- `buildProposal()`-helperen brukes til å generere aktivitetsforslag
- Edge function `analyze-vendor-gap` — uendret (returnerer fortsatt med domain-felt, vi bare ignorerer det)

## Lara-bekreftelsesdialog

Bruker eksisterende mønster fra `mem://product/ai-native-trust-philosophy` (3 nivåer):

- **Default per workspace-instilling** bestemmer om aktiviteter blir
  - *Automatic* → utført uten bekreftelse, vises som logg
  - *Assisted* → opprettet med status "Venter på bekreftelse" i aktivitetsloggen
  - *Manual* → forslag — bruker må åpne hver enkelt og lagre

I første iterasjon: les `aiAutonomy` fra brukers settings hvis tilgjengelig, fallback til *Assisted* (sikrere default). Vis liten chip i Lara-spørsmålet: *"Modus: Assistert — du bekrefter hver aktivitet"* med lenke til settings.

## Tekniske detaljer

**Filer som endres**
- `src/components/asset-profile/tabs/VendorGapAnalysisTab.tsx` — refaktoreres (≈ halvering i linjer)

**Filer som potensielt slettes** (etter at vi har bekreftet ingen andre brukere)
- `src/components/asset-profile/gap/AgentPlanStrip.tsx`
- `src/components/asset-profile/gap/InlineAgentProposal.tsx` — *behold filen* hvis den brukes andre steder; vi importerer kun `buildProposal`

**Ny komponent (lokal i fanen, eller egen fil hvis > 80 linjer)**
- `<LaraGapFollowupCard>` — viser spørsmålet, håndterer Ja/Nei, kaller en `createActivitiesFromGaps(gaps, mode)`-funksjon

**Aktivitetsoppretting**
- Reuses `VendorActivity`-typen
- Skriver via samme datalag som `RegisterActivityDialog.onSubmit` — dvs. det callback-mønsteret som allerede finnes i `AssetTrustProfile.tsx` (følger samme path som dagens `onSubmit`).
- Ny prop på `VendorGapAnalysisTab`: `onCreateActivities?: (activities: VendorActivity[]) => void` — kalleren (`AssetTrustProfile.tsx`) videresender til samme handler som registreringsdialogen.

**Mapping mangel → aktivitet**
```ts
function gapToActivity(gap, assetName, isNb): VendorActivity {
  const proposal = buildProposal(gap, assetName, isNb);
  const type = proposal.kind.includes("document") || proposal.kind === "find_contact"
    ? "email"
    : proposal.kind === "draft_policy" ? "manual" : "manual";
  return {
    id: `lara-gap-${gap.requirement_id}-${Date.now()}`,
    type,
    phase: "ongoing",
    titleNb: proposal.titleNb, titleEn: proposal.titleEn,
    descriptionNb: proposal.bodyNb, descriptionEn: proposal.bodyEn,
    outcomeStatus: mode === "automatic" ? "in_progress" : "open",
    outcome*: ...,
    date: new Date(),
    actor: "Lara",
    actorRole: mode === "automatic" ? "Lara — autonom" : "Lara — venter på bekreftelse",
    isManual: false,
    linkedGapId: gap.requirement_id,
    criticality: gap.status === "missing" ? "hoy" : "medium",
    level: "operasjonelt",
    theme: themeFromRequirement(gap),
    createdAt: new Date(),
  };
}
```

**Toast etter opprettelse** — "Lara satte opp N aktiviteter" med link til Aktivitet-fanen.

**i18n** — fortsetter med inline `isNb`-mønster (samme som dagens fil).

## Out of scope

- PDF-eksport (kommer tilbake senere)
- Endre edge function eller datamodell
- Endre andre Gap-komponenter (`GapAnalysisVendorRow`, `BulkGapAnalysisDialog`, `MSPGapAnalysisStep`)
- Domeneinndeling andre steder i appen (kun fjernet i denne fanen)
