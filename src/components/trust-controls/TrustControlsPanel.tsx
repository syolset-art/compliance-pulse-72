import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CheckCircle2, AlertTriangle, XCircle, TrendingUp, Shield, Lock, Bot, User, Building2,
  ShieldCheck, ChevronDown, ChevronRight, Zap, ListTodo, Lightbulb, TriangleAlert,
  Layers, Target, Clock, FileText, Network, Server, Eye, Monitor, HardDrive, AppWindow, GitBranch, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  type EvaluatedControl,
  type TrustControlStatus,
  type VerificationSource,
  type ControlArea,
  type KeyRisk,
  type RecommendedAction,
  type RiskSeverity,
  GENERIC_CONTROLS,
  getTypeSpecificControls,
  calculateTrustScore,
  calculateConfidenceScore,
  deriveKeyRisks,
  deriveRecommendedActions,
  generateAISummary,
  inferProfileMeta,
  inferVerificationSource,
  groupControlsByArea,
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

interface ScopeData {
  systemsMapped: number;
  devicesMapped: number;
  applicationsMapped: number;
  processesMaped: number;
  vendorsMapped: number;
  subProcessorsMapped: number;
}

interface TrustControlsPanelProps {
  asset: AssetLike;
  docsCount: number;
  relationsCount: number;
  overrideType?: string;
  scope?: Partial<ScopeData>;
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
  const vendorMap: Record<string, () => TrustControlStatus> = {
    dpa_verified: () => meta.dpa_verified ? "implemented" : docsCount > 0 ? "partial" : "missing",
    security_contact: () => asset.contact_email ? "implemented" : asset.contact_person ? "partial" : "missing",
    sub_processors_disclosed: () => meta.sub_processors_disclosed ? "implemented" : "missing",
    vendor_security_review: () => meta.vendor_security_review ? "implemented" : "missing",
  };
  const systemMap: Record<string, () => TrustControlStatus> = {
    mfa_enabled: () => meta.mfa_enabled ? "implemented" : "missing",
    encryption_enabled: () => meta.encryption_enabled ? "implemented" : "missing",
    backup_configured: () => meta.backup_configured ? "implemented" : "missing",
    security_logging: () => meta.security_logging ? "implemented" : "missing",
  };
  const hardwareMap: Record<string, () => TrustControlStatus> = {
    device_encryption: () => meta.disk_encrypted ? "implemented" : "missing",
    endpoint_protection: () => meta.antivirus ? "implemented" : "missing",
    patch_management: () => meta.patch_management ? "implemented" : "missing",
  };
  const orgMap: Record<string, () => TrustControlStatus> = {
    responsible_manager: () => asset.asset_manager ? "implemented" : "missing",
    security_training: () => meta.security_training_completed ? "implemented" : "missing",
    incident_reporting: () => meta.incident_reporting_defined ? "implemented" : "missing",
  };

  const maps: Record<string, Record<string, () => TrustControlStatus>> = {
    vendor: vendorMap, system: systemMap, hardware: hardwareMap, self: orgMap,
  };
  return maps[assetType]?.[key]?.() ?? "missing";
}

// ── UI Constants ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TrustControlStatus, { icon: typeof CheckCircle2; color: string; bg: string; labelEn: string; labelNb: string }> = {
  implemented: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", labelEn: "Implemented", labelNb: "Implementert" },
  partial: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", labelEn: "Partial", labelNb: "Delvis" },
  missing: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", labelEn: "Missing", labelNb: "Mangler" },
};

const AREA_CONFIG: Record<ControlArea, { icon: typeof Shield; labelEn: string; labelNb: string }> = {
  governance: { icon: Shield, labelEn: "Governance", labelNb: "Styring" },
  risk_compliance: { icon: Target, labelEn: "Risk & Compliance", labelNb: "Risiko og samsvar" },
  security_posture: { icon: Lock, labelEn: "Security Posture", labelNb: "Sikkerhetsstatus" },
  supplier_governance: { icon: Layers, labelEn: "Supplier Governance", labelNb: "Leverandørstyring" },
};

const SEVERITY_CONFIG: Record<RiskSeverity, { color: string; bg: string; labelEn: string; labelNb: string }> = {
  high: { color: "text-destructive", bg: "bg-destructive/10", labelEn: "High", labelNb: "Høy" },
  medium: { color: "text-warning", bg: "bg-warning/10", labelEn: "Medium", labelNb: "Middels" },
  low: { color: "text-muted-foreground", bg: "bg-muted/50", labelEn: "Low", labelNb: "Lav" },
};

const VERIFICATION_LABELS: Record<VerificationSource, { en: string; nb: string }> = {
  ai_inferred: { en: "AI inferred", nb: "AI-utledet" },
  customer_asserted: { en: "Customer asserted", nb: "Kunde bekreftet" },
  vendor_verified: { en: "Vendor verified", nb: "Leverandør verifisert" },
  third_party_verified: { en: "Third-party verified", nb: "Tredjepartsverifisert" },
};

// ── Sub-components ───────────────────────────────────────────────────

function ExpandableSection({ icon: Icon, title, count, children, defaultOpen = false }: {
  icon: typeof Shield;
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          className="flex items-center justify-between w-full rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2.5">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium">{title}</span>
            {count !== undefined && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">{count}</Badge>
            )}
          </div>
          {open
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-3 pb-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
function FlippableDataQuality({ confidenceLevel, confidenceScore, confidenceColor, confidenceLabelEn, confidenceLabelNb, isNb, implementedCount, allControlsCount }: {
  confidenceLevel: string;
  confidenceScore: number;
  confidenceColor: string;
  confidenceLabelEn: string;
  confidenceLabelNb: string;
  isNb: boolean;
  implementedCount: number;
  allControlsCount: number;
}) {
  const [flipped, setFlipped] = useState(false);

  const levelExplanation = isNb
    ? confidenceLevel === "high"
      ? "De fleste kontrollene er verifisert av leverandør eller tredjepart. Datagrunnlaget er pålitelig."
      : confidenceLevel === "medium"
      ? "Noen kontroller er bekreftet, men flere mangler verifisering fra leverandør eller dokumentasjon."
      : "De fleste kontrollene er basert på AI-antakelser. Last opp dokumentasjon eller be leverandør verifisere."
    : confidenceLevel === "high"
      ? "Most controls are verified by vendor or third party. The data is reliable."
      : confidenceLevel === "medium"
      ? "Some controls are confirmed, but several lack vendor verification or documentation."
      : "Most controls are based on AI assumptions. Upload documentation or request vendor verification.";

  const improveTip = isNb
    ? "Tips: Be leverandøren verifisere profilen, eller last opp dokumentasjon for å øke datakvaliteten."
    : "Tip: Ask the vendor to verify the profile, or upload documentation to improve data quality.";

  return (
    <button
      onClick={() => setFlipped(!flipped)}
      className="flex flex-col items-center text-center gap-2 cursor-pointer rounded-lg p-3 -m-3 hover:bg-accent/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring relative min-h-[120px] justify-center"
      role="group"
      aria-label={isNb ? "Datakvalitet — klikk for detaljer" : "Data Quality — click for details"}
    >
      {!flipped ? (
        <>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {isNb ? "Datakvalitet" : "Data Quality"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {confidenceLevel === "high" && <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />}
            {confidenceLevel === "medium" && <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />}
            {confidenceLevel === "low" && <XCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
            <p className={`text-2xl font-bold ${confidenceColor}`}>
              {isNb ? confidenceLabelNb : confidenceLabelEn}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {isNb ? "Trykk for å lese mer" : "Tap to learn more"}
          </span>
        </>
      ) : (
        <div className="text-left space-y-2 max-w-[200px]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {isNb ? "Datakvalitet" : "Data Quality"}: {confidenceScore}%
            </span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{levelExplanation}</p>
          <p className="text-[10px] text-primary leading-tight">{improveTip}</p>
          <span className="text-[10px] text-muted-foreground">
            {isNb ? "Trykk for å lukke" : "Tap to close"}
          </span>
        </div>
      )}
    </button>
  );
}

function ControlRow({ control, isNb }: { control: EvaluatedControl; isNb: boolean }) {
  const cfg = STATUS_CONFIG[control.status];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm ${cfg.bg}`}>
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} aria-hidden="true" />
        <span className="truncate">{isNb ? control.labelNb : control.labelEn}</span>
        {control.verificationSource && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                  control.verificationSource === "vendor_verified" || control.verificationSource === "third_party_verified" ? "bg-success"
                  : control.verificationSource === "customer_asserted" ? "bg-primary"
                  : "bg-muted-foreground/40"
                }`} aria-label={isNb ? VERIFICATION_LABELS[control.verificationSource].nb : VERIFICATION_LABELS[control.verificationSource].en} />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {isNb ? VERIFICATION_LABELS[control.verificationSource].nb : VERIFICATION_LABELS[control.verificationSource].en}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <Badge
        variant={control.status === "implemented" ? "action" : control.status === "partial" ? "warning" : "destructive"}
        className="text-[10px] px-1.5 py-0 shrink-0"
      >
        {isNb ? cfg.labelNb : cfg.labelEn}
      </Badge>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export function TrustControlsPanel({
  asset, docsCount, relationsCount, overrideType, scope = {},
}: TrustControlsPanelProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const effectiveType = overrideType || asset.asset_type || "";

  // ── Evaluate controls ──────────────────────────────────────────────
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
  const confidenceScore = calculateConfidenceScore(allControls);
  const risks = deriveKeyRisks(allControls);
  const actions = deriveRecommendedActions(risks);
  const aiSummary = generateAISummary(trustScore, confidenceScore, risks, actions, effectiveType, isNb);
  const grouped = groupControlsByArea(allControls);

  const implementedCount = allControls.filter(c => c.status === "implemented").length;
  const partialCount = allControls.filter(c => c.status === "partial").length;
  const missingCount = allControls.filter(c => c.status === "missing").length;

  const highRisks = risks.filter(r => r.severity === "high").length;
  const mediumRisks = risks.filter(r => r.severity === "medium").length;
  const lowRisks = risks.filter(r => r.severity === "low").length;

  const confidenceLevel = confidenceScore >= 80 ? "high" : confidenceScore >= 50 ? "medium" : "low";
  const confidenceLabelEn = confidenceLevel === "high" ? "High" : confidenceLevel === "medium" ? "Medium" : "Low";
  const confidenceLabelNb = confidenceLevel === "high" ? "Høy" : confidenceLevel === "medium" ? "Middels" : "Lav";
  const scoreColor = trustScore >= 75 ? "text-success" : trustScore >= 50 ? "text-warning" : trustScore > 0 ? "text-primary" : "text-muted-foreground";
  const confidenceColor = confidenceLevel === "high" ? "text-success" : confidenceLevel === "medium" ? "text-warning" : "text-muted-foreground";

  const lastUpdated = asset.updated_at
    ? new Date(asset.updated_at).toLocaleDateString(isNb ? "nb-NO" : "en-US", { day: "numeric", month: "short", year: "numeric" })
    : "–";

  // Security overview: area score per domain
  const areaScore = (area: ControlArea) => {
    const controls = grouped[area];
    if (controls.length === 0) return 0;
    const impl = controls.filter(c => c.status === "implemented").length;
    const partial = controls.filter(c => c.status === "partial").length;
    return Math.round(((impl + partial * 0.5) / controls.length) * 100);
  };

  // Scope data
  const s = {
    systemsMapped: scope.systemsMapped ?? 0,
    devicesMapped: scope.devicesMapped ?? 0,
    applicationsMapped: scope.applicationsMapped ?? 0,
    processesMaped: scope.processesMaped ?? 0,
    vendorsMapped: scope.vendorsMapped ?? 0,
    subProcessorsMapped: scope.subProcessorsMapped ?? 0,
  };
  const totalMapped = s.systemsMapped + s.devicesMapped + s.applicationsMapped + s.processesMaped + s.vendorsMapped + s.subProcessorsMapped + docsCount;
  const coveragePercent = Math.min(100, Math.round((totalMapped / Math.max(totalMapped, 10)) * 100));

  const [showRiskDetails, setShowRiskDetails] = useState(false);

  const handleCreateTask = (title: string) => {
    toast.success(isNb ? `Oppgave opprettet: ${title}` : `Task created: ${title}`);
  };

  return (
    <div className="space-y-4">
      {/* ━━━ 1. TRUST SNAPSHOT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Trust Score */}
          <div className="flex flex-col items-center text-center gap-2" role="group" aria-label="Trust Score">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trust Score</span>
            </div>
            <p className={`text-4xl font-bold ${scoreColor}`} aria-label={`Trust score ${trustScore} percent`}>{trustScore}<span className="text-lg">%</span></p>
            <Progress value={trustScore} className="h-2 w-full max-w-[120px]" aria-label={`Trust score progress: ${trustScore}%`} />
          </div>

          {/* Data Quality — flippable */}
          <FlippableDataQuality
            confidenceLevel={confidenceLevel}
            confidenceScore={confidenceScore}
            confidenceColor={confidenceColor}
            confidenceLabelEn={confidenceLabelEn}
            confidenceLabelNb={confidenceLabelNb}
            isNb={isNb}
            implementedCount={implementedCount}
            allControlsCount={allControls.length}
          />

          {/* Last Updated */}
          <div className="flex flex-col items-center text-center gap-2" role="group" aria-label="Last Updated">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {isNb ? "Sist oppdatert" : "Last Updated"}
              </span>
            </div>
            <p className="text-lg font-semibold text-foreground">{lastUpdated}</p>
          </div>
        </div>
      </Card>

      {/* ━━━ 2. SECURITY OVERVIEW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-semibold">{isNb ? "Sikkerhetsoversikt" : "Security Overview"}</h2>
        <div className="space-y-3">
          {([
            { area: "governance" as ControlArea, icon: Shield, label: "Governance", labelNb: "Styring" },
            { area: "risk_compliance" as ControlArea, icon: Target, label: "Operations", labelNb: "Drift" },
            { area: "security_posture" as ControlArea, icon: Lock, label: "Identity & Access", labelNb: "Identitet og tilgang" },
            { area: "supplier_governance" as ControlArea, icon: Layers, label: "Supplier & Ecosystem", labelNb: "Leverandør og økosystem" },
          ]).map(({ area, icon: AreaIcon, label, labelNb: areaNb }) => {
            const score = areaScore(area);
            const count = grouped[area].length;
            if (count === 0) return null;
            return (
              <div key={area} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AreaIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-medium">{isNb ? areaNb : label}</span>
                  </div>
                  <span className="text-sm font-semibold" aria-label={`${label} ${score}%`}>{score}%</span>
                </div>
                <Progress value={score} className="h-2" aria-label={`${label} progress: ${score}%`} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* ━━━ 3. RISK OVERVIEW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">{isNb ? "Risikooversikt" : "Risk Overview"}</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-destructive/10" role="group" aria-label={`${highRisks} high risks`}>
            <TriangleAlert className="h-4 w-4 text-destructive" aria-hidden="true" />
            <span className="text-2xl font-bold text-destructive">{highRisks}</span>
            <span className="text-[10px] font-medium text-destructive uppercase">{isNb ? "Høy" : "High"}</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-warning/10" role="group" aria-label={`${mediumRisks} medium risks`}>
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
            <span className="text-2xl font-bold text-warning">{mediumRisks}</span>
            <span className="text-[10px] font-medium text-warning uppercase">{isNb ? "Middels" : "Medium"}</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50" role="group" aria-label={`${lowRisks} low risks`}>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-2xl font-bold text-muted-foreground">{lowRisks}</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase">{isNb ? "Lav" : "Low"}</span>
          </div>
        </div>
        {risks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowRiskDetails(!showRiskDetails)}
            aria-expanded={showRiskDetails}
          >
            <Eye className="h-3 w-3 mr-1.5" aria-hidden="true" />
            {showRiskDetails
              ? (isNb ? "Skjul risikoer" : "Hide risk details")
              : (isNb ? "Vis risikoer" : "View risk details")}
          </Button>
        )}
        {showRiskDetails && (
          <div className="mt-3 space-y-1.5">
            {risks.map((r) => {
              const sev = SEVERITY_CONFIG[r.severity];
              return (
                <div key={r.id} className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 ${sev.bg}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <TriangleAlert className={`h-4 w-4 shrink-0 ${sev.color}`} aria-hidden="true" />
                    <span className={`text-sm ${sev.color}`}>{isNb ? r.titleNb : r.titleEn}</span>
                  </div>
                  <Badge variant={r.severity === "high" ? "destructive" : r.severity === "medium" ? "warning" : "outline"} className="text-[10px] shrink-0">
                    {isNb ? sev.labelNb : sev.labelEn}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ━━━ 4. SCOPE MODEL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{isNb ? "Omfang" : "Scope"}</h2>
          <div className="flex items-center gap-2" role="group" aria-label={`Coverage ${coveragePercent}%`}>
            <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-bold text-foreground">{coveragePercent}%</span>
            <span className="text-xs text-muted-foreground">{isNb ? "dekning" : "coverage"}</span>
          </div>
        </div>

        <Progress value={coveragePercent} className="h-2" aria-label={`Coverage ${coveragePercent}%`} />

        <div className="grid grid-cols-2 gap-4">
          {/* Assets */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isNb ? "Eiendeler" : "Assets"}</h3>
            <div className="space-y-1">
              {[
                { icon: Server, label: isNb ? "Systemer" : "Systems", value: s.systemsMapped },
                { icon: HardDrive, label: isNb ? "Enheter" : "Devices", value: s.devicesMapped },
                { icon: AppWindow, label: isNb ? "Applikasjoner" : "Applications", value: s.applicationsMapped },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="font-semibold" aria-label={`${item.value} ${item.label}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Processes */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isNb ? "Prosesser" : "Processes"}</h3>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Network className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="text-muted-foreground">{isNb ? "Kartlagt" : "Mapped"}</span>
              </div>
              <span className="font-semibold" aria-label={`${s.processesMaped} processes`}>{s.processesMaped}</span>
            </div>
          </div>

          {/* Third Parties */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isNb ? "Tredjeparter" : "Third Parties"}</h3>
            <div className="space-y-1">
              {[
                { icon: Building2, label: isNb ? "Leverandører" : "Vendors", value: s.vendorsMapped },
                { icon: GitBranch, label: isNb ? "Underleverandører" : "Sub-processors", value: s.subProcessorsMapped },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="font-semibold" aria-label={`${item.value} ${item.label}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Framework Coverage */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isNb ? "Rammeverk" : "Framework Coverage"}</h3>
            <div className="flex flex-wrap gap-1.5">
              {([
                { area: "governance" as ControlArea, label: "Governance", labelNb: "Styring" },
                { area: "risk_compliance" as ControlArea, label: "Operations", labelNb: "Drift" },
                { area: "security_posture" as ControlArea, label: "Identity & Access", labelNb: "Identitet" },
                { area: "supplier_governance" as ControlArea, label: "Supplier", labelNb: "Leverandør" },
              ]).map(({ area, label, labelNb: nb }) => {
                const score = areaScore(area);
                const variant = score >= 75 ? "action" : score >= 40 ? "warning" : score > 0 ? "destructive" : "secondary";
                return (
                  <Badge key={area} variant={variant as any} className="text-[10px] gap-1" aria-label={`${label} ${score}%`}>
                    {isNb ? nb : label}
                    <span className="font-bold">{score}%</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
          {isNb
            ? "Dekning viser hvor mye av organisasjonens systemer, leverandører og prosesser som er inkludert i Trust Profile-vurderingen."
            : "Coverage indicates how much of the organization's systems, vendors and processes are included in the Trust Profile assessment."}
        </p>
      </Card>

      {/* ━━━ 5. KEY RISKS (top 3) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {risks.length > 0 && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3">{isNb ? "Nøkkelrisikoer" : "Key Risks"}</h2>
          <div className="space-y-1.5">
            {risks.slice(0, 3).map((r) => {
              const sev = SEVERITY_CONFIG[r.severity];
              return (
                <div key={r.id} className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 ${sev.bg}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <TriangleAlert className={`h-4 w-4 shrink-0 ${sev.color}`} aria-hidden="true" />
                    <span className={`text-sm font-medium ${sev.color}`}>{isNb ? r.titleNb : r.titleEn}</span>
                  </div>
                  <Badge variant={r.severity === "high" ? "destructive" : r.severity === "medium" ? "warning" : "outline"} className="text-[10px] shrink-0">
                    {isNb ? sev.labelNb : sev.labelEn}
                  </Badge>
                </div>
              );
            })}
          </div>
          {risks.length > 3 && (
            <Button variant="link" size="sm" className="mt-2 px-0 text-xs h-auto" onClick={() => setShowRiskDetails(true)}>
              {isNb ? `Vis alle ${risks.length} risikoer` : `View all ${risks.length} risks`}
            </Button>
          )}
        </Card>
      )}

      {/* ━━━ 6. CONTROLS SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-3">{isNb ? "Kontrollsammendrag" : "Controls Summary"}</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10" role="group" aria-label={`${implementedCount} implemented`}>
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
            <div>
              <p className="text-lg font-bold text-success">{implementedCount}</p>
              <p className="text-[10px] text-success font-medium">{isNb ? "Implementert" : "Implemented"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10" role="group" aria-label={`${partialCount} partial`}>
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
            <div>
              <p className="text-lg font-bold text-warning">{partialCount}</p>
              <p className="text-[10px] text-warning font-medium">{isNb ? "Delvis" : "Partial"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10" role="group" aria-label={`${missingCount} missing`}>
            <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
            <div>
              <p className="text-lg font-bold text-destructive">{missingCount}</p>
              <p className="text-[10px] text-destructive font-medium">{isNb ? "Mangler" : "Missing"}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ━━━ 7. EXPANDABLE DETAILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          {isNb ? "Detaljer" : "Details"}
        </h2>

        {/* Controls detail */}
        <ExpandableSection icon={Shield} title={isNb ? "Kontroller" : "Controls"} count={allControls.length}>
          <div className="space-y-4">
            {(["governance", "risk_compliance", "security_posture", "supplier_governance"] as ControlArea[]).map((area) => {
              const controls = grouped[area];
              if (controls.length === 0) return null;
              const cfg = AREA_CONFIG[area];
              const AreaIcon = cfg.icon;
              const impl = controls.filter(c => c.status === "implemented").length;
              return (
                <div key={area} className="space-y-1.5">
                  <div className="flex items-center gap-2 px-1">
                    <AreaIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{isNb ? cfg.labelNb : cfg.labelEn}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">{impl}/{controls.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {controls.map(c => <ControlRow key={c.key} control={c} isNb={isNb} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </ExpandableSection>

        {/* Risk register */}
        {risks.length > 0 && (
          <ExpandableSection icon={TriangleAlert} title={isNb ? "Risikoregister" : "Risk Register"} count={risks.length}>
            <div className="space-y-1.5">
              {risks.map((r) => {
                const sev = SEVERITY_CONFIG[r.severity];
                return (
                  <div key={r.id} className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 ${sev.bg}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <TriangleAlert className={`h-4 w-4 shrink-0 ${sev.color}`} aria-hidden="true" />
                      <span className={`text-sm ${sev.color}`}>{isNb ? r.titleNb : r.titleEn}</span>
                    </div>
                    <Badge variant={r.severity === "high" ? "destructive" : r.severity === "medium" ? "warning" : "outline"} className="text-[10px] shrink-0">
                      {isNb ? sev.labelNb : sev.labelEn}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ExpandableSection>
        )}

        {/* Recommended actions */}
        {actions.length > 0 && (
          <ExpandableSection icon={Zap} title={isNb ? "Anbefalte handlinger" : "Recommended Actions"} count={actions.length}>
            <div className="space-y-1.5">
              {actions.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                    <span className="text-sm truncate">{isNb ? a.titleNb : a.titleEn}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 shrink-0"
                    onClick={() => handleCreateTask(isNb ? a.titleNb : a.titleEn)}
                  >
                    <ListTodo className="h-3 w-3" aria-hidden="true" />
                    {isNb ? "Oppgave" : "Task"}
                  </Button>
                </div>
              ))}
            </div>
          </ExpandableSection>
        )}
      </div>
    </div>
  );
}
