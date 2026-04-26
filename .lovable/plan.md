## Plan: Mynder-farger på resten av plattformen

Etter forrige opprydning ble tokens og Regelverk-siden fikset, men **214 filer** bruker fortsatt rå Tailwind-farger (`green-500`, `blue-600`, `orange-500`, `cyan-*`, `purple-500`, hardkodede HEX). Disse vises ikke i Mynder-paletten og bryter visuell konsistens på dashboard, leverandør-, system- og prosesssider.

### Mapping (fast regelsett)

| Rå klasse | → Mynder-token |
|---|---|
| `green-{500-700}`, `emerald-*`, `lime-*`, `teal-*` | `status-closed` (success) |
| `green-{50,100,200}` | `status-closed/10` |
| `red-{500-700}`, `rose-*` | `status-open` / `destructive` |
| `orange-{400-600}`, `amber-*`, `yellow-{400-500}` | `status-followup` / `warning` |
| `blue-{500-700}`, `cyan-*`, `sky-*`, `indigo-*` | `mynder-blue` / `primary` |
| `purple-{400-500}`, `violet-*`, `fuchsia-*`, `pink-*` | `purple-accent` / `accent` |
| `purple-{700-900}` | `purple-900` / `foreground` |
| Hardkodede HEX (#22C55E, #3B82F6 osv.) | tilsvarende token |

Bakgrunner (`bg-*-50/100`) → `/10`-varianter. Borders (`border-*-200/300`) → `/20`. Tekst på farget bakgrunn beholdes med `*-foreground` token.

### Bolker (gjøres i rekkefølge, kan godkjennes løpende)

**Bolk 1 — Dashboard & widgets** (~35 filer)
Mest synlige flatene. Inkluderer:
- `dashboard-v2/*` (KPIRow, ComplianceShield, NextActionCards, RiskAndCalendarSection, RecentActivityFeed, AggregatedMaturityWidget)
- `dashboard/*` (DashboardCompact, DashboardCriticalTasks, DeletionAgentCard)
- `widgets/*` (alle ~30 widget-filer: Compliance, Risk, AI, Vendor, NIS2, GDPR osv.)

**Bolk 2 — Leverandør (Vendors)** (~15 filer)
- `vendor-dashboard/*` (CompareTable, VendorCompareTab, VendorMapView, NeedsAttentionSection, VendorActionCards, VendorActivateDialog, VendorPremiumBanner)
- `trust-controls/*` (VendorTrustScoreCard, VendorRiskAssessment, VendorPrivacyAssessment, RiskOverviewCard, TrustControlsPanel, InlineDocumentChecklist)
- `asset-profile/*` (AssetHeader, alle tabs: VendorUsage, VendorControls, VendorAudit, AIUsage, DataHandling, IncidentManagement, Analysis, Deliveries, Documents, Relations, RiskManagement, CustomerRequests, LaraInbox, SecurityServices, MynderGuidance, TrustProfilePreview, TrustProfilePublishing, RiskInfluenceDiagram, RegisterActivityDialog, UploadDocumentDialog)

**Bolk 3 — System & Enheter** (~10 filer)
- `system-profile/*` (FrameworkMaturityGrid, tabs: Validation, DataHandling, IncidentManagement, RiskManagement)
- `device-profile/*` (DeviceHeader, DeviceTechnicalStatus, DeviceRiskTab, DeviceAutomation)
- `devices/*` (DeviceComplianceTab, NIS2AssessmentTab)

**Bolk 4 — Prosess & Arbeidsområder** (~15 filer)
- `process/*` (ProcessCard, ProcessOverviewCard, ProcessAITab, ProcessAIDialog, ProactiveInputSection, AIRiskPyramid, RiskMatrixVisual, AIHeroSummary, AIDocumentedSummary, AISuggestionStatusPanel, AIGeneratedBadge, alle tabs)
- `work-areas/*` (WorkAreaMembersCard, WorkAreaDocumentsTab, ProcessingActivitiesTab, AssetSummaryDashboard)

**Bolk 5 — MSP & Kundeforespørsler** (~15 filer)
- `msp/*` (MSPAssessmentStep, MSPAssessmentCard, MSPGapAnalysisStep, SecurityServiceGapCard, AddMSPCustomerDialog, AcronisConnectDialog, PurchaseLicensesDialog)
- `customer-requests/*` (CustomerRequestCard, OutboundRequestCard, NetworkTab, SendRequestWizard, ManageSharingDialog)
- `iso-readiness/*` (CertificationJourney, CertificationGoalBanner, LockedDomainCard, PhaseChecklist, SLACategoryBreakdown)

**Bolk 6 — Sider & Dialoger** (~30 filer)
- `pages/*` (Dashboard-sider, Trust Center-sider, MaturityDashboard, BusinessRiskDetail, Tasks, Assets, Systems, Reports, Sustainability, Transparency, Deviations, FrameworkDetail, ComplianceOverview, ComplianceChecklist, MSPCustomerDetail/ROI, MSPInvoices, MSPROICalculator, AISystemRegistry, AdminOrganisation, PersonalSettings, ProcessingRecords, Resources, MaturityMethodology, LaraInbox, WorkAreas, VendorResponseDemo, DemoLibrary)
- `dialogs/*` (FrameworkPurchaseDialog, FrameworkActivationDialog, RiskReductionSuccessDialog, AddVendorDialog, AddSystemDialog, AddAssetDialog, AddRelationDialog, AssignAssetDialog, EditRiskScenarioDialog, ProcessSuggestionsDialog)

### Fremgangsmåte per bolk

1. Skript-basert sweep med `sed`-erstatninger på mapping-tabellen.
2. Manuell verifisering av kontekst-sensitive treff:
   - Charts med distinkte serie-farger → beholdes
   - Logoer/brand-spesifikke ikoner → beholdes
   - Diff-visninger som med vilje bruker rødt/grønt → bruker `status-open`/`status-closed` direkte
3. Visuell spot-sjekk av nøkkelflater før neste bolk.

### Hardkodede HEX

Søker etter `#[0-9A-Fa-f]{6}` på tvers av alle filer og erstatter med tokens der det er semantisk åpenbart. Resterende treff (charts, gradients, illustrasjoner) flagges for vurdering.

### Out of scope

- Layout-, spacing-, font-endringer — kun farger.
- Charts/datavisualiseringer der distinkte farger er nødvendige.
- Egendefinerte gradients i illustrasjoner.
- Komponenter som allerede bruker semantiske tokens (de fungerer automatisk).

### Anbefaling

Start med **Bolk 1 (Dashboard & widgets)** siden det er det første brukerne ser. Resten kan tas i etterfølgende runder slik at du kan QA visuelt mellom hver bolk.
