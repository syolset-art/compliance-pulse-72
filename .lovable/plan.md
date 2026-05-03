## Mål

På Veiledning fra Mynder-tab-en (Trust Profile-mal):
1. Erstatte dagens header + lilla "Lara foreslår"-boble med samme **Lara-anbefalingsbanner som dashbordet** — ekspanderbar fra kompakt banner til "plan-modus".
2. Under banneret legge til en kompakt **"Modenhet per kontrollområde"-widget** som standard-blokk for alle Trust Profiler.

## Endringer

### 1. Ekstrahere gjenbrukbar Lara-anbefalingskomponent

Refaktorere `src/components/dashboard/DashboardLaraRecommendation.tsx` slik at den tar props i stedet for å hente DPA-tall fra databasen selv:

```ts
interface LaraRecommendationProps {
  context: "dashboard" | "vendor-profile";
  totalCount: number;          // f.eks. 13
  criticalCount: number;       // f.eks. 8
  tasks: PlanTask[];           // forhåndsbygde plan-oppgaver
  onShowAllPath?: string;      // /tasks eller vendor-spesifikk
}
```

- Behold dagens dashboard-bruk (lag en thin wrapper som beholder navnet `DashboardLaraRecommendation` og kaller den nye delte komponenten).
- Ny delt komponent: `src/components/lara/LaraRecommendationBanner.tsx`.

### 2. Bruke banneret i `MynderGuidanceTab.tsx`

- **Fjern**: dagens "Agent header" (Lara avatar + "Sist analysert" + "Analyser på nytt"-knapp) og dagens lilla `purple-100`-sammendrags-boble.
- **Legg inn**: `<LaraRecommendationBanner context="vendor-profile" ... />` øverst.
  - `totalCount` = `visibleSuggestions.length`
  - `criticalCount` = antall med `criticality === "kritisk"` eller `"hoy"`
  - `tasks` = mappe `visibleSuggestions` til `PlanTask`-formatet (vendor = denne leverandøren / asset-navn, category = `theme`, insight = `statusNoteNb/En`).
  - "Be Lara håndtere det"-CTA-en i plan-kortet skal i denne konteksten kalle `handleAcceptOne(s)` (oppretter aktiviteten med Lara's neste-steg-flyt) i stedet for å åpne DPA-modal.
- **Behold**: "Foreslåtte handlinger"-listen og "Pågående aktiviteter"-seksjonen som de er nå.

### 3. Ny modenhets-widget på Trust Profile

Lage `src/components/asset-profile/AssetMaturityByDomainCard.tsx` — en kompakt 2x2-grid over de 4 kontrollområdene (Governance & Accountability, Security, Privacy & Data Handling, Third-Party & Supply Chain) med:
- Ikon + label til venstre
- Prosent til høyre (farget: grønn ≥75%, oransje 50-74%, rød <50% — matcher Risk Colors-regelen)
- Tynn fremdriftslinje under
- Header "Modenhet per kontrollområde" + "Trust Score X/100" til høyre
- Klikkbare kort som ekspanderer (chevron) — i første versjon navigerer de til `/reports/compliance` (samme mønster som `AggregatedMaturityWidget`).

Plassere den i `MynderGuidanceTab.tsx` rett under Lara-banneret (før forslagslisten). Dette gjør den til en standard-blokk i Trust Profile-malen.

### 4. Rydde opp

Fjerne nå-ubrukte imports (`LaraAvatar`, `RefreshCw`, `reanalyzing`-state) fra `MynderGuidanceTab.tsx`.

## Tekniske detaljer

- `PlanTask`-typen flyttes til `src/components/lara/types.ts` så både dashboard-wrapperen og `MynderGuidanceTab` importerer fra samme sted.
- Modenhets-data hentes fra `useComplianceRequirements` på samme måte som `AggregatedMaturityWidget` gjør i dag — gjenbruk `byDomain`-strukturen.
- I første versjon brukes samme aggregerte data; per-asset breakdown kan komme senere.

## Filer

**Nye:**
- `src/components/lara/LaraRecommendationBanner.tsx`
- `src/components/lara/types.ts`
- `src/components/asset-profile/AssetMaturityByDomainCard.tsx`

**Endrede:**
- `src/components/dashboard/DashboardLaraRecommendation.tsx` (refaktoreres til wrapper)
- `src/components/asset-profile/MynderGuidanceTab.tsx` (bytter header/sammendragsboble + legger inn modenhets-kort)

## Resultat

Veiledning fra Mynder får samme visuelle Lara-banner som dashbordet (konsistens), og under får brukeren et standard modenhetsoverblikk per kontrollområde — som blir en mal-komponent for alle Trust Profiler.
