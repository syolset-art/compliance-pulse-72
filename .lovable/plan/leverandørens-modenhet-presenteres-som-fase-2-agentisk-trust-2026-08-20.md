# Leverandørens modenhet: presenteres som fase 2 / Agentisk Trust Profile

## Bakgrunn
I dag viser `AssetMaturityByDomainCard` på leverandørens oversiktsfane en Trust Score under tittelen "Modenhet per kontrollområde". Brukeren skal tydelig forstå at dette er *leverandørens* modenhet, og at det først blir et reelt bilde når leverandøren overtar sin Trust Profile via Agentisk Trust Profile. Inntil videre er dette en fase 2-funksjon.

## Mål
Endre presentasjonen i `MynderGuidanceTab` slik at det kommuniseres:
1. Dette er leverandørens modenhet.
2. Brukeren kan ikke påvirke den utover å be leverandøren om dokumentasjon.
3. Et reelt bilde kommer først når Agentisk Trust Profile er tilgjengelig.
4. Funksjonen er fase 2 og begrenses til leverandørstyring og kontroll i verdikjeden — ikke alle fem kontrollområder.

## Implementasjon

### 1. Ny variant-prop på `AssetMaturityByDomainCard`
Fil: `src/components/asset-profile/AssetMaturityByDomainCard.tsx`
- Legg til `variant?: "default" | "vendor"` (standardverdi "default").
- I `vendor`-variant:
  - Endre tittel fra "Modenhet per kontrollområde" til "Leverandørens modenhet".
  - Legg til badge "Fase 2" / "Phase 2" ved siden av tittelen.
  - Legg til en kort informasjonstekst under header:
    - NB: "Dette er leverandørens modenhet. Du kan ikke påvirke den utover å be om dokumentasjon. Et reelt bilde vises først når leverandøren overtar sin Trust Profile via Agentisk Trust Profile — da begrenses forespørselen til leverandørstyring og kontroll i verdikjeden."
    - EN: "This is the vendor's maturity. You cannot influence it except by requesting documentation. A real picture will appear only when the vendor takes over its Trust Profile via Agentic Trust Profile — the request will then be limited to vendor management and control in the value chain."
  - Behold scorene som en grået, stilfull forhåndsvisning slik at konteksten ikke forsvinner, men signaliser at de er foreløpige.
- `default`-varianten forblir uendret for selv/system/andre bruk.

### 2. Aktiver vendor-variant fra `MynderGuidanceTab`
Fil: `src/components/asset-profile/MynderGuidanceTab.tsx`
- Endre `<AssetMaturityByDomainCard assetId={assetId} />` til `<AssetMaturityByDomainCard assetId={assetId} variant="vendor" />`.

### 3. i18n-nøkler
Filer: `src/locales/nb.json` og `src/locales/en.json`
- Legg til nøkler under `assetMaturityByDomain`:
  - `titleVendor`
  - `phase2Badge`
  - `vendorExplainer`
  - `previewNote`
- Bytt ut hardkodede `isNb ? ... : ...` strenger i komponenten med `t(...)` for de nye nøklene.

## Filial/omfang
- Kun `MynderGuidanceTab` (leverandøroversikt) påvirkes direkte.
- `AssetMaturityByDomainCard` brukes også av system-profile `ValidationTab` (import, men ikke sikkert i bruk) og ellers; disse beholder default-oppsettet.

## Akseptansekriterier
- Oversiktsfane for leverandør viser "Leverandørens modenhet" med Fase 2-badge.
- Tekst forklarer at brukeren ikke kan påvirke scoren utover å be om dokumentasjon.
- Standard (ikke-leverandør) visninger endres ikke.
- Tekstene er i i18n-filene, ikke hardkodet.
