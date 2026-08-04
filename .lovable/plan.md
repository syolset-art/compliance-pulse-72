# Registrer avvik direkte fra "Registrer aktivitet"

## Mål

Når brukeren registrerer en aktivitet på en leverandør eller et system, skal de i samme flyt kunne markere at aktiviteten avdekket et avvik — klassifisere det, og forstå hvordan avviket påvirker scoren.

## Slik blir flyten

1. I dialogen "Registrer aktivitet" kommer en enkel bryter nederst: **"Denne aktiviteten avdekket et avvik"**.
2. Når den slås på, utvides dialogen med et kompakt klassifiseringsfelt:
   - Kategori (samme kategorier som avviksregisteret)
   - Alvorlighetsgrad (Kritisk / Høy / Middels / Lav)
   - Kilde (Registrert av oss / Meldt av leverandøren / Oppdaget av agent) — forhåndsvalgt ut fra aktivitetstypen
   - Ansvarlig og frist
   - Berørte krav: Lara foreslår krav automatisk ut fra kategori og alvorlighet, brukeren kan huke av/på
3. Under klassifiseringen vises en kort, fast forklaring på score-effekten (se under).
4. Ved lagring opprettes både aktiviteten i aktivitetsloggen **og** avviket i avviksregisteret, koblet til leverandøren/systemet. En liten "Avvik"-markør vises på aktiviteten i loggen.
5. Avviket dukker opp i eksisterende visninger: leverandørens avviksseksjon og den samlede oversikten over leverandøravvik.

## Forklaring av score-påvirkning

En gjenbrukbar forklaringsboks (kort tekst + "Les mer"-utvidelse) som brukes både her og i den eksisterende avviksdialogen:

- Et **åpent** avvik setter de berørte kravene til "ikke oppfylt" så lenge det står åpent. Dokumentasjonen slettes ikke — den teller bare ikke i scoren.
- Berørte kontrollområder får redusert modenhet, som igjen trekker ned samlet modenhet og regelverkene kravene tilhører.
- Alvorlighetsgrad styrer hvor tungt avviket veier i den avledede risikoen på leverandøren/systemet.
- Når avviket lukkes, gjenopptas kravene sin opprinnelige status og scoren hentes inn igjen.
- Avvik meldt av leverandør eller oppdaget av agent må bekreftes av et menneske før kravene nulles.

Boksen viser i tillegg en live-oppsummering av valgene: hvilke kontrollområder som berøres og hvor mange krav som settes til null.

## Teknisk

- `src/components/asset-profile/RegisterActivityDialog.tsx`: nye valgfrie props `assetId` og `vendorName`. Avviksbryteren vises kun når `assetId` finnes. Ny lokal state for kategori/alvorlighet/kilde/ansvarlig/frist/valgte krav. Ved lagring kalles `onSubmit(activity)` som i dag, og i tillegg `useRegisterVendorDeviation` fra `src/hooks/useVendorDeviations.ts` med `suggestRequirementImpacts`-resultatet.
- Ny komponent `src/components/deviations/DeviationScoreImpactNote.tsx` med forklaringen over. Tas i bruk både i `RegisterActivityDialog` og `src/components/dialogs/RegisterVendorDeviationDialog.tsx` (erstatter dagens tooltip-tekst, som beholdes som kortversjon).
- Ny hjelpefunksjon i `src/lib/deviationImpact.ts` som mapper aktivitetstype til foreslått kilde og gir en kort effektbeskrivelse per alvorlighetsgrad.
- Bruksstedene sender inn `assetId`: `src/pages/AssetTrustProfile.tsx`, `src/components/asset-profile/tabs/VendorOverviewTab.tsx`, `src/components/asset-profile/tabs/VendorActivityTab.tsx`, `src/components/asset-profile/AssetMetrics.tsx`, `src/components/asset-profile/MynderGuidanceTab.tsx`, `src/components/system-profile/tabs/ValidationTab.tsx`. Der id ikke er tilgjengelig, faller dialogen tilbake til ren aktivitetsregistrering.
- `VendorActivity`-typen i `src/utils/vendorActivityData.ts` utvides med valgfri `deviationId` og `deviationCriticality` slik at loggen kan vise avviksmarkøren.
- Ingen databaseendringer — `system_incidents` og `deviation_requirement_impacts` dekker behovet.
