import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { StackedProgress } from "@/components/ui/stacked-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Shield, Lock, Layers, Target,
  TriangleAlert, FileCheck, Pencil, ChevronDown, CheckCircle2, AlertCircle, MinusCircle, Settings,
  Key,
  Users,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { MaturityHistoryChart } from "./MaturityHistoryChart";
import { InlineDocumentChecklist } from "./InlineDocumentChecklist";
import {
  type EvaluatedControl,
  type TrustControlStatus,
  type ControlArea,
  GENERIC_CONTROLS,
  getTypeSpecificControls,
  calculateTrustScore,
  calculateScoreBySource,
  calculateConfidenceScore,
  deriveKeyRisks,
  inferVerificationSource,
  groupControlsByArea,
  CONTROL_NAV_MAP,
} from "@/lib/trustControlDefinitions";

// ── Types ────────────────────────────────────────────────────────────

interface AssetLike {
  id: string;
  asset_type?: string;
  asset_owner?: string | null;
  asset_manager?: string | null;
  description?: string | null;
  risk_level?: string | null;
  criticality?: string | null;
  next_review_date?: string | null;
  gdpr_role?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  work_area_id?: string | null;
  metadata?: Record<string, any> | null;
  updated_at?: string | null;
}

interface FrameworkItem {
  framework_id: string;
  framework_name: string;
}

interface TrustControlsPanelProps {
  asset: AssetLike;
  docsCount: number;
  relationsCount: number;
  overrideType?: string;
  hideHeader?: boolean;
  frameworks?: FrameworkItem[];
  onTrustMetrics?: (metrics: { trustScore: number; confidenceScore: number; lastUpdated: string }) => void;
  onNavigateToTab?: (target: string) => void;
}

// ── Control evaluation ───────────────────────────────────────────────

function evaluateGenericControl(key: string, asset: AssetLike, docsCount: number): TrustControlStatus {
  switch (key) {
    case "owner_assigned": return asset.asset_owner || asset.work_area_id ? "implemented" : "missing";
    case "responsible_person": return asset.asset_manager ? "implemented" : "missing";
    case "description_defined":
      return asset.description && asset.description.length > 10 ? "implemented" : asset.description ? "partial" : "missing";
    case "risk_level_defined": return asset.risk_level ? "implemented" : "missing";
    case "criticality_defined": return asset.criticality ? "implemented" : "missing";
    case "risk_assessment": return asset.risk_level ? "partial" : "missing";
    case "review_cycle": return asset.next_review_date ? "implemented" : "missing";
    case "documentation_available": return docsCount >= 3 ? "implemented" : docsCount > 0 ? "partial" : "missing";
    default: return "missing";
  }
}

function evaluateTypeControl(key: string, assetType: string, asset: AssetLike, docsCount: number): TrustControlStatus {
  const meta = (asset.metadata || {}) as Record<string, any>;
  const maps: Record<string, Record<string, () => TrustControlStatus>> = {
    vendor: {
      dpa_verified: () => meta.dpa_verified ? "implemented" : docsCount > 0 ? "partial" : "missing",
      security_contact: () => asset.contact_email ? "implemented" : asset.contact_person ? "partial" : "missing",
      sub_processors_disclosed: () => meta.sub_processors_disclosed ? "implemented" : "missing",
      vendor_security_review: () => meta.vendor_security_review ? "implemented" : "missing",
    },
    system: {
      mfa_enabled: () => meta.mfa_enabled ? "implemented" : "missing",
      encryption_enabled: () => meta.encryption_enabled ? "implemented" : "missing",
      backup_configured: () => meta.backup_configured ? "implemented" : "missing",
      security_logging: () => meta.security_logging ? "implemented" : "missing",
    },
    hardware: {
      device_encryption: () => meta.disk_encrypted ? "implemented" : "missing",
      endpoint_protection: () => meta.antivirus ? "implemented" : "missing",
      patch_management: () => meta.patch_management ? "implemented" : "missing",
    },
    self: {
      responsible_manager: () => asset.asset_manager ? "implemented" : "missing",
      security_training: () => meta.security_training_completed ? "implemented" : "missing",
      incident_reporting: () => meta.incident_reporting_defined ? "implemented" : "missing",
    },
  };
  return maps[assetType]?.[key]?.() ?? "missing";
}

// ── Framework badge colours ──────────────────────────────────────────

const FRAMEWORK_COLORS: Record<string, string> = {
  gdpr: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  personopplysningsloven: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  nis2: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
  iso27001: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  iso27701: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  "ai-act": "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
  nsmicf: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
};

function frameworkBadgeClass(id: string): string {
  const lower = id.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [key, cls] of Object.entries(FRAMEWORK_COLORS)) {
    if (lower.includes(key.replace("-", ""))) return cls;
  }
  return "bg-muted text-muted-foreground border-border";
}

// ── Main Component ───────────────────────────────────────────────────

export function TrustControlsPanel({
  asset, docsCount, relationsCount, overrideType, hideHeader, frameworks = [], onTrustMetrics, onNavigateToTab,
}: TrustControlsPanelProps) {
  const [expandedArea, setExpandedArea] = useState<ControlArea | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [docChecklistArea, setDocChecklistArea] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isNb = i18n.language === "nb";
  const effectiveType = overrideType || asset.asset_type || "";

  const evaluatedGeneric: EvaluatedControl[] = GENERIC_CONTROLS.map((c) => ({
    ...c,
    status: evaluateGenericControl(c.key, asset, docsCount),
    verificationSource: inferVerificationSource(c.key, asset, docsCount),
  }));
  const typeDefinitions = getTypeSpecificControls(effectiveType);
  const evaluatedType: EvaluatedControl[] = typeDefinitions.map((c) => ({
    ...c,
    status: evaluateTypeControl(c.key, effectiveType, asset, docsCount),
    verificationSource: inferVerificationSource(c.key, asset, docsCount),
  }));
  const allControls = [...evaluatedGeneric, ...evaluatedType];

  const trustScore = calculateTrustScore(allControls);
  const { baselinePercent, enrichmentPercent } = calculateScoreBySource(allControls);
  const confidenceScore = calculateConfidenceScore(allControls);
  const risks = deriveKeyRisks(allControls);
  const grouped = groupControlsByArea(allControls);

  const lastUpdated = asset.updated_at
    ? new Date(asset.updated_at).toLocaleDateString(isNb ? "nb-NO" : "en-US", { day: "numeric", month: "short", year: "numeric" })
    : "–";

  // Report metrics up to parent (for header)
  if (onTrustMetrics) {
    queueMicrotask(() => onTrustMetrics({ trustScore, confidenceScore, lastUpdated }));
  }

  const highRisks = risks.filter(r => r.severity === "high").length;
  const mediumRisks = risks.filter(r => r.severity === "medium").length;
  const lowRisks = risks.filter(r => r.severity === "low").length;

  const areaScore = (area: ControlArea) => {
    const controls = grouped[area];
    if (!controls || controls.length === 0) return 0;
    const impl = controls.filter(c => c.status === "implemented").length;
    const partial = controls.filter(c => c.status === "partial").length;
    return Math.round(((impl + partial * 0.5) / controls.length) * 100);
  };

  const areaScoreBySource = (area: ControlArea) => {
    const controls = grouped[area];
    if (!controls || controls.length === 0) return { baseline: 0, enrichment: 0 };
    const total = controls.length;
    let baselineEarned = 0;
    let enrichmentEarned = 0;
    for (const c of controls) {
      const factor = c.status === "implemented" ? 1 : c.status === "partial" ? 0.5 : 0;
      if (factor === 0) continue;
      if (c.source === "vendor_baseline") baselineEarned += factor;
      else enrichmentEarned += factor;
    }
    return {
      baseline: Math.round((baselineEarned / total) * 100),
      enrichment: Math.round((enrichmentEarned / total) * 100),
    };
  };

  // All 5 security areas — always displayed
  const securityAreas = [
    { area: "governance" as ControlArea, icon: Shield, label: "Governance", labelNb: "Styring",
      descNb: "Styringsgrunnlag, eierskap til vurderinger og sentral dokumentasjon for systemet.",
      descEn: "Governance framework, ownership of assessments and central documentation." },
    { area: "risk_compliance" as ControlArea, icon: Settings, label: "Operations & Security", labelNb: "Drift og sikkerhet",
      descNb: "Dokumentert bruk, prosesser, hendelser og praktisk oppfølging av systemet.",
      descEn: "Documented usage, processes, incidents and practical follow-up." },
    { area: "security_posture" as ControlArea, icon: Key, label: "Identity & Access", labelNb: "Identitet og tilgang",
      descNb: "Roller, ansvar og tilgang som styrer hvem som eier og bruker systemet.",
      descEn: "Roles, responsibilities and access controlling who owns and uses the system." },
    { area: "privacy_data" as ControlArea, icon: Lock, label: "Privacy & Data Handling", labelNb: "Personvern og datahåndtering",
      descNb: "Behandlingsoversikt, databehandleravtaler, DPIA og registrertes rettigheter.",
      descEn: "Processing records, data processing agreements, DPIAs and data subject rights." },
    { area: "supplier_governance" as ControlArea, icon: Users, label: "Third-Party & Value Chain", labelNb: "Leverandører og økosystem",
      descNb: "Tredjeparter, overføringer og avhengigheter rundt systemet.",
      descEn: "Third parties, transfers and dependencies around the system." },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-orange-500 dark:text-orange-400";
    return "text-destructive";
  };

  const getMaturityLabel = (score: number) => {
    if (score >= 75) return { en: "High", nb: "Høy" };
    if (score >= 50) return { en: "Medium", nb: "Middels" };
    return { en: "Low", nb: "Lav" };
  };

  const getStatusIcon = (status: TrustControlStatus) => {
    if (status === "implemented") return <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />;
    if (status === "partial") return <MinusCircle className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />;
    return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
  };

  const totalImplemented = allControls.filter(c => c.status === "implemented").length;

  // Descriptive action labels per control (what the user should do)
  const ACTION_LABELS: Record<string, { en: string; nb: string; tabEn: string; tabNb: string }> = {
    owner_assigned: { en: "Assign owner", nb: "Tilordne eier", tabEn: "asset header", tabNb: "profilhodet" },
    responsible_person: { en: "Define responsible person", nb: "Definer ansvarlig", tabEn: "asset header", tabNb: "profilhodet" },
    description_defined: { en: "Add description", nb: "Legg til beskrivelse", tabEn: "asset header", tabNb: "profilhodet" },
    risk_level_defined: { en: "Set risk level", nb: "Sett risikonivå", tabEn: "Usage & Context", tabNb: "Bruk og kontekst" },
    criticality_defined: { en: "Set criticality", nb: "Sett kritikalitet", tabEn: "Usage & Context", tabNb: "Bruk og kontekst" },
    risk_assessment: { en: "Perform risk assessment", nb: "Utfør risikovurdering", tabEn: "Audit & Risk", tabNb: "Revisjon og risiko" },
    review_cycle: { en: "Define review cycle", nb: "Definer gjennomgangssyklus", tabEn: "Validation", tabNb: "Validering" },
    documentation_available: { en: "Upload documents", nb: "Last opp dokumenter", tabEn: "Documents", tabNb: "Dokumenter" },
    dpa_verified: { en: "Verify DPA", nb: "Verifiser DPA", tabEn: "Documents", tabNb: "Dokumenter" },
    security_contact: { en: "Add security contact", nb: "Legg til sikkerhetskontakt", tabEn: "asset header", tabNb: "profilhodet" },
    sub_processors_disclosed: { en: "Disclose sub-processors", nb: "Oppgi underleverandører", tabEn: "Relations", tabNb: "Relasjoner" },
    vendor_security_review: { en: "Complete security review", nb: "Fullfør sikkerhetsgjennomgang", tabEn: "Controls", tabNb: "Kontroller" },
    mfa_enabled: { en: "Enable MFA", nb: "Aktiver MFA", tabEn: "Controls", tabNb: "Kontroller" },
    encryption_enabled: { en: "Enable encryption", nb: "Aktiver kryptering", tabEn: "Controls", tabNb: "Kontroller" },
    backup_configured: { en: "Configure backup", nb: "Konfigurer backup", tabEn: "Controls", tabNb: "Kontroller" },
    security_logging: { en: "Enable logging", nb: "Aktiver logging", tabEn: "Controls", tabNb: "Kontroller" },
    device_encryption: { en: "Enable encryption", nb: "Aktiver kryptering", tabEn: "Controls", tabNb: "Kontroller" },
    endpoint_protection: { en: "Install protection", nb: "Installer beskyttelse", tabEn: "Controls", tabNb: "Kontroller" },
    patch_management: { en: "Activate patching", nb: "Aktiver patching", tabEn: "Controls", tabNb: "Kontroller" },
    responsible_manager: { en: "Assign manager", nb: "Tilordne leder", tabEn: "asset header", tabNb: "profilhodet" },
    security_training: { en: "Complete training", nb: "Fullfør opplæring", tabEn: "Controls", tabNb: "Kontroller" },
    incident_reporting: { en: "Define process", nb: "Definer prosess", tabEn: "Incidents", tabNb: "Avvik og hendelser" },
  };

  const DOCUMENT_CONTROLS = new Set(["documentation_available", "dpa_verified"]);

  const handleControlClick = (control: EvaluatedControl, area?: string) => {
    if (control.status === "implemented") return;

    // For document-related controls, toggle inline checklist instead of navigating
    if (DOCUMENT_CONTROLS.has(control.key) && area) {
      setDocChecklistArea(prev => prev === area ? null : area);
      return;
    }

    const target = CONTROL_NAV_MAP[control.key];
    const actionLabel = ACTION_LABELS[control.key];
    if (target && onNavigateToTab) {
      onNavigateToTab(target);
      if (actionLabel) {
        const tabName = isNb ? actionLabel.tabNb : actionLabel.tabEn;
        const isHeader = target.startsWith("_header:");
        toast.info(
          isNb
            ? `${actionLabel.nb} — ${isHeader ? "Oppdater feltet i" : "Gå til"} «${tabName}»`
            : `${actionLabel.en} — ${isHeader ? "Update the field in" : "Go to"} "${tabName}"`,
          { duration: 4000 }
        );
      }
    }
  };

  const totalPartial = allControls.filter(c => c.status === "partial").length;
  const totalMissing = allControls.filter(c => c.status === "missing").length;
  const remaining = totalPartial + totalMissing;

  const coverageLabel = trustScore >= 75
    ? { en: "GOOD COVERAGE", nb: "GOD DEKNING", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" }
    : trustScore >= 50
    ? { en: "PARTIAL COVERAGE", nb: "DELVIS DEKNING", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" }
    : { en: "LOW COVERAGE", nb: "LAV DEKNING", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };

  const assetName = (asset as any).name || (asset as any).vendor || "";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* ━━━ Sikkerhet og kontroller ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Card className="p-5 md:col-span-2">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-foreground">{isNb ? "Modenhet per kontrollområde" : "Maturity by control areas"}</h3>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${coverageLabel.color}`}>
                {isNb ? coverageLabel.nb : coverageLabel.en}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(prev => !prev)}
                className="h-7 w-7 p-0 ml-1"
                title={isNb ? "Vis modenhetshistorikk" : "Show maturity history"}
              >
                <TrendingUp className={`h-4 w-4 ${showHistory ? "text-primary" : "text-muted-foreground"}`} />
              </Button>
            </div>
            {assetName && (
              <p className="text-xs text-muted-foreground">
                {isNb ? `For ${assetName}` : `For ${assetName}`}
              </p>
            )}
            <p className="text-xs text-muted-foreground max-w-xl">
              {isNb
                ? "Måler hvor godt systemet er dokumentert, organisert og fulgt opp. Scoren bygger på relevante vurderinger av systemdata og dokumentert bruk i arbeidsområder, behandlingsaktiviteter, prosesser og leverandørforhold."
                : "Measures how well the system is documented, organized and followed up. The score is based on relevant assessments of system data and documented use across work areas, processing activities, processes and vendor relationships."}
            </p>
          </div>
          <span className={`text-4xl font-bold tabular-nums ${getScoreColor(trustScore)}`}>{trustScore}%</span>
        </div>

        {/* Source legend + stacked bar */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary/40" />
              {isNb ? "Leverandørens baseline" : "Vendor baseline"}: {baselinePercent}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
              {isNb ? "Eget arbeid" : "Your enrichment"}: {enrichmentPercent}%
            </span>
          </div>
          <StackedProgress baselinePercent={baselinePercent} enrichmentPercent={enrichmentPercent} height="h-2" />
        </div>

        {/* Maturity history chart */}
        {showHistory && (
          <div className="mb-4 p-4 border border-border rounded-xl bg-muted/20 animate-fade-in">
            <MaturityHistoryChart
              assetId={asset.id}
              baselinePercent={baselinePercent}
              enrichmentPercent={enrichmentPercent}
            />
          </div>
        )}

        {/* Summary badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
            {totalImplemented} {isNb ? "OPPFYLT" : "FULFILLED"}
          </span>
          {remaining > 0 && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
              {remaining} {isNb ? "GJENSTÅR" : "REMAINING"}
            </span>
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
            {securityAreas.length} {isNb ? "KONTROLLOMRÅDER" : "CONTROL AREAS"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {securityAreas.map(({ area, icon: AreaIcon, label, labelNb: areaNb, descNb, descEn }, index) => {
            const score = areaScore(area);
            const areaSourceScores = areaScoreBySource(area);
            const controls = grouped[area];
            const isExpanded = expandedArea === area;
            const implemented = controls.filter(c => c.status === "implemented").length;
            const remaining = controls.length - implemented;
            const areaCoverage = score >= 75
              ? { nb: "GOD DEKNING", en: "GOOD COVERAGE", color: "text-green-600 dark:text-green-400" }
              : score >= 50
              ? { nb: "DELVIS DEKNING", en: "PARTIAL COVERAGE", color: "text-orange-500 dark:text-orange-400" }
              : { nb: "LAV DEKNING", en: "LOW COVERAGE", color: "text-destructive" };

            const isLastOdd = index === securityAreas.length - 1 && securityAreas.length % 2 === 1;

            const isVendorAsset = asset.asset_type !== "self" && asset.asset_type !== "hardware";
            const auditTab = isVendorAsset ? "vendor-audit" : "riskManagement";

            return (
              <div key={area} className={`border border-border rounded-xl p-4 hover:border-primary/30 transition-colors ${isLastOdd ? "sm:col-span-2" : ""}`}>
                <button
                  onClick={() => setExpandedArea(isExpanded ? null : area)}
                  className="w-full text-left"
                >
                  {/* Top row: icon + name + count + score + chevron */}
                  <div className="flex items-start gap-2.5 mb-1">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <AreaIcon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-foreground">{isNb ? areaNb : label}</span>
                      <p className="text-[11px] text-muted-foreground">{implemented}/{controls.length} {isNb ? "oppfylt" : "fulfilled"}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-xl font-bold tabular-nums ${getScoreColor(score)}`}>{score}%</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-muted-foreground mb-2 pl-[38px]">{isNb ? descNb : descEn}</p>

                  {/* Coverage label + remaining */}
                  <div className="flex items-center justify-between pl-[38px] mb-2">
                    {remaining > 0 && (
                      <span className="text-[10px] text-muted-foreground">{remaining} {isNb ? "gjenstår" : "remaining"}</span>
                    )}
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${areaCoverage.color} ml-auto`}>
                      {isNb ? areaCoverage.nb : areaCoverage.en}
                    </span>
                  </div>

                  {/* Stacked progress bar */}
                  <StackedProgress baselinePercent={areaSourceScores.baseline} enrichmentPercent={areaSourceScores.enrichment} />
                </button>


                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border space-y-1 animate-fade-in">
                    {controls.map((control) => {
                      const isDocControl = DOCUMENT_CONTROLS.has(control.key);
                      const isActionable = control.status !== "implemented" && (isDocControl || (!!CONTROL_NAV_MAP[control.key] && !!onNavigateToTab));
                      return (
                        <div
                          key={control.key}
                          onClick={() => isActionable && handleControlClick(control, area)}
                          className={`flex items-center gap-2 rounded-md px-1.5 py-1 -mx-1 ${
                            isActionable
                              ? "cursor-pointer hover:bg-muted/60 transition-colors group"
                              : ""
                          }`}
                        >
                          {getStatusIcon(control.status)}
                          <span className="text-xs text-foreground flex-1">{isNb ? control.labelNb : control.labelEn}</span>
                          {isActionable ? (
                            <button
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                              onClick={(e) => { e.stopPropagation(); handleControlClick(control, area); }}
                            >
                              {isNb ? (ACTION_LABELS[control.key]?.nb || "Fiks") : (ACTION_LABELS[control.key]?.en || "Fix")}
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          ) : (
                            <span className={`text-[10px] font-medium ${
                              control.status === "implemented" ? "text-green-600 dark:text-green-400" :
                              control.status === "partial" ? "text-orange-500 dark:text-orange-400" :
                              "text-destructive"
                            }`}>
                              {control.status === "implemented" ? "OK" :
                               control.status === "partial" ? (isNb ? "Delvis" : "Partial") :
                               (isNb ? "Mangler" : "Missing")}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* Inline document checklist for this area */}
                    {docChecklistArea === area && (
                      <InlineDocumentChecklist
                        assetId={asset.id}
                        controlArea={area}
                        onNavigateToDocuments={onNavigateToTab ? () => onNavigateToTab("documents") : undefined}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

    </div>
  );
}
