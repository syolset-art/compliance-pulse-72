## Mål

Gjøre "Veiledning fra Mynder"-fanen på leverandørkortet om til en tydelig agentisk Lara-opplevelse — i tråd med Mynder Design System (purple-100-boble, sommerfugl-avatar, "Lara foreslår…", eksplisitt Godta/Avvis).

## Problem med dagens design

`MynderGuidanceTab.tsx` viser i dag:
- En generisk "Sparkles"-boks med "Veiledning fra Mynder"
- En statisk liste av gap-kort uten agent-personlighet
- Ingen tydelig Lara-identitet, ingen accept/reject-flow, ingen progresjonsfølelse
- Statuspille-redigering er gjemt og lite agentisk

Designet føles som en regel-motor, ikke en samarbeidende agent.

## Ny opplevelse — agentisk Lara-veileder

```text
┌──────────────────────────────────────────────────────────┐
│  [🦋]  Lara — Veileder for {leverandør}                  │
│        Sist analysert: 2 min siden  · Analyserer på nytt│
├──────────────────────────────────────────────────────────┤
│  ╭─ Lara foreslår ─────────────────────────── purple-100╮│
│  │ "Jeg ser 3 gap som bør lukkes før neste revisjon.   ││
│  │  Det viktigste er DPA — den utløper om 18 dager."   ││
│  │                                                      ││
│  │  [Se prioriteringen]  [Avvis sammendraget]          ││
│  ╰──────────────────────────────────────────────────────╯│
│                                                          │
│  Foreslåtte handlinger (3)        Operasjonelt│Taktisk..│
│  ┌──────────────────────────────────────────────────┐   │
│  │ [🦋] Lara foreslår                       Kritisk │   │
│  │ Forny databehandleravtale før 15. mai            │   │
│  │ "DPA fra 2024 utløper. Jeg kan utkaste fornyelse  │  │
│  │  basert på forrige versjon."                     │   │
│  │                                                  │   │
│  │ [Godta og start aktivitet] [Avvis] [Endre status]│   │
│  └──────────────────────────────────────────────────┘   │
│  ...                                                    │
└──────────────────────────────────────────────────────────┘
```

## Nøkkelendringer

1. **Agent-header (ny)**
   - Lara-avatar (mynder-blue sirkel + hvit sommerfugl, gjenbruk eksisterende `LaraAvatar`/SVG hvis funnet, ellers inline SVG)
   - Tittel: "Lara — Veileder for {vendorName}"
   - Meta-linje: "Sist analysert: {tid}" + en `Analyser på nytt`-lenke (prototype: simulert pulsanimasjon i 1.2s)

2. **Sammendrags-boble (Lara-stil)**
   - Bakgrunn `bg-purple-100` (Mulish, purple-900-tekst)
   - Prefiks "Lara foreslår:" i bold
   - To eksplisitte handlinger: `Godta` (primary pill) og `Avvis` (outline pill) — godta = ingen endring (kun bekreftelse-toast); avvis = collapser boblen
   - Erstatter dagens `bg-primary/[0.04]` Sparkles-boks

3. **Kort som agent-forslag**
   - Hvert gap-kort får venstre Lara-avatar (24px) + label "Lara foreslår"
   - Tittel beholdes; rasjonalet (`statusNote`) flyttes inn i en liten purple-100-sub-boble som sitatet fra Lara
   - Tre eksplisitte CTA-er nederst på kortet, alltid synlige (ikke gjemt bak hover):
     - **Godta og start aktivitet** (pill, mynder-blue) → åpner `RegisterActivityDialog` (samme som i dag)
     - **Avvis** (pill, outline) → bruker eksisterende `dismissedSuggestionIds`-mekanisme via ny callback, eller lokal state
     - **Endre status** (ghost) → toggler `InlineStatusEditor` (eksisterende)
   - Statuspille flyttes til toppen som ren badge (ikke knapp)
   - Kritikalitets-badge og nivå-chip beholdes, men strammes til høyre

4. **Tomtilstand**
   - Lara-avatar + "Ingen åpne gap akkurat nå. Jeg fortsetter å overvåke." (purple-100-boble)
   - Knapp: "Spør Lara om noe annet" (åpner global chat hvis tilgjengelig — ellers no-op med toast)

5. **Visuell justering mot designsystem**
   - Alle knapper: `rounded-pill` (allerede i tailwind config)
   - Bruk `bg-purple-100` + `text-purple-900` for Lara-bobler (eksisterende tokens)
   - Mulish er allerede default font
   - Beholde eksisterende status- og nivå-farger (matcher allerede `status-closed`/`warning`/`primary`)

## Filer som endres

- `src/components/asset-profile/MynderGuidanceTab.tsx` — full redesign av layout (header, sammendrags-boble, kort) — beholder all eksisterende logikk (`generateGuidanceForVendor`, `recomputeSummary`, `gapStatusOverrides`, `RegisterActivityDialog`-integrasjon).
- Ny lokal komponent (inline i samme fil, eller egen fil `LaraSuggestionCard.tsx`) for det agentiske kortet — bestemmes ved implementering, sannsynligvis egen fil for ryddighet.
- Ny liten `LaraAvatar`-komponent (`src/components/asset-profile/LaraAvatar.tsx`) hvis ikke en eksisterende finnes — sjekk `LaraAgent.tsx` først for gjenbruk.

## Ut av scope

- Ingen endringer i `vendorGuidanceData.ts` (samme datastruktur, samme suggestions)
- Ingen backend-/Supabase-endringer
- Ingen endringer i `RegisterActivityDialog`, `InlineStatusEditor` eller `VendorStatusRow`
- i18n-strenger holdes inline (samme mønster som dagens fil)
