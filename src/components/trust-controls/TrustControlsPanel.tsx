import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CheckCircle2, AlertTriangle, XCircle, TrendingUp, Shield, Lock,
  ShieldCheck, TriangleAlert, Layers, Target, Clock, Eye,
  Server, HardDrive, AppWindow, Network, Building2, GitBranch, BarChart3,
} from "lucide-react";
import {
  type EvaluatedControl,
  type TrustControlStatus,
  type VerificationSource,
  type ControlArea,
  type KeyRisk,
  type RiskSeverity,
  GENERIC_CONTROLS,
  getTypeSpecificControls,
  calculateTrustScore,
  calculateConfidenceScore,
  deriveKeyRisks,
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
  onViewControls?: () => void;
  onViewRisks?: () => void;
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

const SEVERITY_CONFIG: Record<RiskSeverity, { color: string; bg: string; labelEn: string; labelNb: string }> = {
  high: { color: "text-destructive", bg: "bg-destructive/10", labelEn: "High", labelNb: "Høy" },
  medium: { color: "text-warning", bg: "bg-warning/10", labelEn: "Medium", labelNb: "Middels" },
  low: { color: "text-muted-foreground", bg: "bg-muted/50", labelEn: "Low", labelNb: "Lav" },
};

// ── Main Component ───────────────────────────────────────────────────

export function TrustControlsPanel({
  asset, docsCount, relationsCount, overrideType, scope = {}, onViewControls, onViewRisks,
}: TrustControlsPanelProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const effectiveType = overrideType || asset.asset_type || "";

  // Evaluate controls
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

  const areaScore = (area: ControlArea) => {
    const controls = grouped[area];
    if (controls.length === 0) return 0;
    const impl = controls.filter(c => c.status === "implemented").length;
    const partial = controls.filter(c => c.status === "partial").length;
    return Math.round(((impl + partial * 0.5) / controls.length) * 100);
  };

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

  return (
    <div className="space-y-4">
      {/* ━━━ TRUST METRICS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Trust Score */}
          <div className="flex flex-col items-center text-center gap-2" role="group" aria-label="Trust Score">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trust Score</span>
            </div>
            <p className={`text-4xl font-bold ${scoreColor}`} aria-label={`Trust score ${trustScore} percent`}>
              {trustScore}<span className="text-lg">%</span>
            </p>
            <Progress value={trustScore} className="h-2 w-full max-w-[120px]" aria-label={`Trust score progress: ${trustScore}%`} />
          </div>

          {/* Verification Confidence */}
          <div className="flex flex-col items-center text-center gap-2" role="group" aria-label={isNb ? "Datakvalitet" : "Data Quality"}>
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
            <span className="text-[10px] text-muted-foreground">{confidenceScore}%</span>
          </div>

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

      {/* ━━━ SCOPE & COVERAGE + SECURITY OVERVIEW ━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scope & Coverage */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{isNb ? "Omfang og dekning" : "Scope & Coverage"}</h2>
            <div className="flex items-center gap-1.5" role="group" aria-label={`Coverage ${coveragePercent}%`}>
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-bold text-foreground">{coveragePercent}%</span>
            </div>
          </div>

          <Progress value={coveragePercent} className="h-1.5" aria-label={`Coverage ${coveragePercent}%`} />

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {[
              { icon: Server, label: isNb ? "Systemer" : "Systems", value: s.systemsMapped },
              { icon: Building2, label: isNb ? "Leverandører" : "Vendors", value: s.vendorsMapped },
              { icon: Network, label: isNb ? "Prosesser" : "Processes", value: s.processesMaped },
              { icon: HardDrive, label: isNb ? "Enheter" : "Devices", value: s.devicesMapped },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="text-muted-foreground text-xs">{item.label}</span>
                </div>
                <span className="font-semibold text-xs" aria-label={`${item.value} ${item.label}`}>{item.value}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed pt-1 border-t border-border">
            {isNb
              ? "Dekning viser hvor mye av organisasjonens systemer, leverandører og prosesser som er inkludert."
              : "Coverage shows how much of the organization's systems, vendors and processes are included in this trust profile."}
          </p>
        </Card>

        {/* Control Domains */}
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-semibold">{isNb ? "Kontrollområder" : "Control Domains"}</h2>
          <div className="space-y-2.5">
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
                <div key={area} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <AreaIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                      <span className="text-xs font-medium">{isNb ? areaNb : label}</span>
                    </div>
                    <span className="text-xs font-semibold" aria-label={`${label} ${score}%`}>{score}%</span>
                  </div>
                  <Progress value={score} className="h-1.5" aria-label={`${label} progress: ${score}%`} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ━━━ RISK OVERVIEW + CONTROLS SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Overview */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3">{isNb ? "Risikooversikt" : "Risk Overview"}</h2>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-lg bg-destructive/10" role="group" aria-label={`${highRisks} high risks`}>
              <TriangleAlert className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
              <span className="text-xl font-bold text-destructive">{highRisks}</span>
              <span className="text-[9px] font-medium text-destructive uppercase">{isNb ? "Høy" : "High"}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-lg bg-warning/10" role="group" aria-label={`${mediumRisks} medium risks`}>
              <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
              <span className="text-xl font-bold text-warning">{mediumRisks}</span>
              <span className="text-[9px] font-medium text-warning uppercase">{isNb ? "Middels" : "Medium"}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-lg bg-muted/50" role="group" aria-label={`${lowRisks} low risks`}>
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="text-xl font-bold text-muted-foreground">{lowRisks}</span>
              <span className="text-[9px] font-medium text-muted-foreground uppercase">{isNb ? "Lav" : "Low"}</span>
            </div>
          </div>

          {/* Top 3 key risks */}
          {risks.length > 0 && (
            <div className="space-y-1 mb-2">
              {risks.slice(0, 3).map((r) => {
                const sev = SEVERITY_CONFIG[r.severity];
                return (
                  <div key={r.id} className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 ${sev.bg}`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <TriangleAlert className={`h-3 w-3 shrink-0 ${sev.color}`} aria-hidden="true" />
                      <span className={`text-xs truncate ${sev.color}`}>{isNb ? r.titleNb : r.titleEn}</span>
                    </div>
                    <Badge variant={r.severity === "high" ? "destructive" : r.severity === "medium" ? "warning" : "outline"} className="text-[9px] shrink-0 px-1.5 py-0">
                      {isNb ? sev.labelNb : sev.labelEn}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}

          {onViewRisks && (
            <Button variant="link" size="sm" className="px-0 text-xs h-auto" onClick={onViewRisks}>
              <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
              {isNb ? "Vis risikoregister" : "View risk details"}
            </Button>
          )}
        </Card>

        {/* Controls Summary */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3">{isNb ? "Kontrollsammendrag" : "Controls Summary"}</h2>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-lg bg-success/10" role="group" aria-label={`${implementedCount} implemented`}>
              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              <span className="text-xl font-bold text-success">{implementedCount}</span>
              <span className="text-[9px] font-medium text-success uppercase">{isNb ? "Implementert" : "Implemented"}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-lg bg-warning/10" role="group" aria-label={`${partialCount} partial`}>
              <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
              <span className="text-xl font-bold text-warning">{partialCount}</span>
              <span className="text-[9px] font-medium text-warning uppercase">{isNb ? "Delvis" : "Partial"}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-lg bg-destructive/10" role="group" aria-label={`${missingCount} missing`}>
              <XCircle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
              <span className="text-xl font-bold text-destructive">{missingCount}</span>
              <span className="text-[9px] font-medium text-destructive uppercase">{isNb ? "Mangler" : "Missing"}</span>
            </div>
          </div>

          {/* Control Domain badges */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {([
              { area: "governance" as ControlArea, label: "Governance", labelNb: "Styring" },
              { area: "risk_compliance" as ControlArea, label: "Operations", labelNb: "Drift" },
              { area: "security_posture" as ControlArea, label: "Identity & Access", labelNb: "Identitet" },
              { area: "supplier_governance" as ControlArea, label: "Supplier & Ecosystem", labelNb: "Leverandør" },
            ]).map(({ area, label, labelNb: nb }) => {
              const score = areaScore(area);
              const variant = score >= 75 ? "action" : score >= 40 ? "warning" : score > 0 ? "destructive" : "secondary";
              return (
                <Badge key={area} variant={variant as any} className="text-[9px] gap-1" aria-label={`${label} ${score}%`}>
                  {isNb ? nb : label} {score}%
                </Badge>
              );
            })}
          </div>

          {onViewControls && (
            <Button variant="link" size="sm" className="px-0 text-xs h-auto" onClick={onViewControls}>
              <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
              {isNb ? "Vis kontroller" : "View controls"}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
