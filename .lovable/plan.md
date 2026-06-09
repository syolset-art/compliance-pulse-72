
# Plan: Fem kanoniske kontrollområder overalt

## Mål
Hele plattformen — Trust Center (egen profil), leverandørenes Trust Profile, og partner sine kunders Trust Profile — skal vise nøyaktig de samme fem kontrollområdene, med samme nøkler, rekkefølge, ikoner og labels.

## Den kanoniske modellen

| Backend-nøkkel | Norsk label | English label | Ikon |
|---|---|---|---|
| `governance` | Styring og ansvar | Governance & Accountability | Shield |
| `operations` | Drift og sikkerhet | Drift og sikkerhet (samme på EN) | Settings |
| `identityAccess` | Identitet og tilgang | Identity & Access | KeyRound |
| `privacy` | Personvern og datahåndtering | Privacy & Data Handling | Lock |
| `vendor` | Tredjepart og verdikjede | Third-Party & Supply Chain | Users |

Rekkefølge er fast: governance → operations → identityAccess → privacy → vendor.

## Hva som er rotete i dag

Tre parallelle nøkkelsett brukes:
- `scoringEngine.ts`: `governance | operations | identity_access | supplier_ecosystem | privacy_data`
- `trustControlDefinitions.ts` (ControlArea): `governance | risk_compliance | security_posture | privacy_data | supplier_governance`
- Widgets blander begge, og noen viser bare 4 områder eller bruker feil label (f.eks. `ComplianceStatusHero` viser `identity_access` med label "Privacy & Data Handling"; `AssetMaturityByDomainCard` mangler Identity & Access helt; `ControlsWidget` mangler Tredjepart).

Backend-data som faktisk lagrer disse nøklene i DB er minimal:
- `trust_profile_sources.control_area` — tom (ingen rader)
- `compliance_requirements.sla_category` — bruker et helt annet sett (`roles_access`/`systems_processes`/`organization_governance`) som mapper til områder, ikke direkte til kanoniske nøkler
- `compliance_requirements.domain` — er regulatorisk domene (`privacy/security/ai`), ikke kontrollområde

Konklusjon: refactor er hovedsakelig frontend + en mappingfunksjon for `sla_category`. Ingen rådata trenger backfill.

## Det vi bygger

### 1. Én sannhetskilde: `src/lib/controlAreas.ts` (ny)

Eksporterer:
```ts
export type ControlAreaKey = "governance" | "operations" | "identityAccess" | "privacy" | "vendor";

export const CONTROL_AREAS: ControlAreaDefinition[] = [ /* 5 stk, fast rekkefølge */ ];

export const CONTROL_AREA_BY_KEY: Record<ControlAreaKey, ControlAreaDefinition>;

// Mapper alle legacy-nøkler til kanoniske
export const LEGACY_AREA_MAP: Record<string, ControlAreaKey> = {
  governance: "governance",
  operations: "operations",
  risk_compliance: "operations",
  security_posture: "identityAccess",
  identity_access: "identityAccess",
  privacy: "privacy",
  privacy_data: "privacy",
  vendor: "vendor",
  supplier_governance: "vendor",
  supplier_ecosystem: "vendor",
};

export function toCanonicalArea(key: string): ControlAreaKey;
export function getControlAreaLabel(key: string, locale: "nb" | "en"): string;
```

Hver definisjon inkluderer: `key`, `labelNb`, `labelEn`, `descriptionNb`, `descriptionEn`, `icon` (Lucide-komponent), `accentClass`.

### 2. Migrer `trustControlDefinitions.ts`
- Endre `ControlArea` til `ControlAreaKey` (alias mot ny type).
- Oppdater hver `TrustControlDefinition.area` til kanonisk nøkkel.
  - `risk_compliance` → `operations`
  - `security_posture` → `identityAccess` (gjelder MFA/encryption/backup/logging-kontroller; flytt rene drift-kontroller som `backup_configured` og `security_logging` til `operations`, behold MFA/tilgangslogging som `identityAccess`).
  - `supplier_governance` → `vendor`
  - `privacy_data` → `privacy`
  - Behold `governance`.
- Tilsvarende i `ORG_CONTROLS` (legg til mer i `identityAccess` slik at området ikke er tomt).

### 3. Migrer `scoringEngine.ts`
- Bytt `sla_category`-typen til `ControlAreaKey`.
- Oppdater alle hardkodede `domain`-felt på `CONTROLS`-listen til kanoniske nøkler (`operations`, `identity_access` → `identityAccess`, `privacy_data` → `privacy`, `supplier_ecosystem` → `vendor`).
- I `calculateSlaScores` la `domains: ControlAreaKey[] = ["governance","operations","identityAccess","privacy","vendor"]`.
- Beholdsmapping fra `compliance_requirements.sla_category` (`roles_access` → `identityAccess`, `systems_processes` → `operations`, `organization_governance` → `governance`) via `LEGACY_AREA_MAP`.

### 4. Rens opp alle widgets / sider

Erstatt lokale domene-arrays med import fra `controlAreas.ts`. Berørte filer:

- `src/components/trust-controls/TrustControlsPanel.tsx`
- `src/components/trust-controls/VendorTrustScoreCard.tsx`
- `src/components/trust-controls/HeaderMaturityIndicators.tsx`
- `src/components/asset-profile/AssetMaturityByDomainCard.tsx` (mangler Identity & Access — utvid til 5)
- `src/components/asset-profile/TrustProfilePreview.tsx`
- `src/components/dashboard/DashboardOverallMaturity.tsx`
- `src/components/dashboard/DashboardMaturityOverTime.tsx`
- `src/components/dashboard-v2/AggregatedMaturityWidget.tsx`
- `src/components/widgets/SecurityFoundationsWidget.tsx`
- `src/components/widgets/ControlsWidget.tsx` (utvid til 5)
- `src/components/widgets/ComplianceStatusHero.tsx` (fiks feilmappet label)
- `src/components/vendor-dashboard/VendorCompareTab.tsx`
- `src/components/vendor-dashboard/GapAnalysisSummary.tsx`
- `src/pages/TrustCenterProfile.tsx`
- `src/pages/TrustCenterEditProfile.tsx`
- `src/pages/MynderControls.tsx`
- `src/pages/MaturityMethodology.tsx`
- `src/pages/MSPCustomerPortal.tsx` (partner sine kunders Trust Profile)
- `src/pages/MSPCustomerDetail.tsx`
- `src/hooks/useTrustControlEvaluation.ts`

Hver av disse: importere `CONTROL_AREAS`, iterere i fast rekkefølge, bruke `getControlAreaLabel` for tekst og delt icon-mapping. Det fjerner duplisering og garanterer konsistens.

### 5. Test/demo-data
Oppdater `src/lib/demoSeedTrustProfile.ts`, `src/lib/demoTrustActivation.ts`, `src/lib/trustMaturityQuestions.ts` slik at maturity-spørsmål er gruppert i de fem kanoniske områdene (legg til en `identityAccess`-bolk hvis den mangler).

### 6. i18n
Oppdater `src/locales/nb.json` og `en.json`: én ny seksjon `controlAreas.{key}.{label,description}`. Fjern duplikate gamle nøkler etterhvert som widgets bytter til ny kilde.

### 7. Backend
Én migrasjon for å normalisere eksisterende verdier (forebyggende, selv om radene er få):
```
UPDATE compliance_requirements
SET sla_category = CASE sla_category
  WHEN 'roles_access' THEN 'identityAccess'
  WHEN 'systems_processes' THEN 'operations'
  WHEN 'organization_governance' THEN 'governance'
  ELSE sla_category END;
```
Ingen schemaendring nødvendig — kolonnen er TEXT.

## Avgrensninger
- Endrer ikke scoringsformelen, vektingen eller framework-mapping — bare nøkler og labels.
- Endrer ikke DB-skjema utover en data-normaliseringsoppdatering.
- Maturity-historikk og eksisterende AI-genererte tekster beholdes; de leses gjennom `toCanonicalArea`.
- Memory-noten "4 Core Domains" oppdateres til 5.

## Leveranseplan
1. Lag `controlAreas.ts` + i18n-nøkler.
2. Refactor `trustControlDefinitions.ts` og `scoringEngine.ts` til kanoniske nøkler.
3. Migrer widgets/sider i grupper (Trust Center → Vendor Trust Profile → MSP customer view → Dashboards).
4. Kjør data-normaliseringsmigrasjon.
5. Oppdater memory (`Control Domains` og Core-linjen).
