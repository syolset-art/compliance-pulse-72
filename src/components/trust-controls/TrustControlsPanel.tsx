import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, AlertTriangle, XCircle, Shield, Lock,
  ShieldCheck, Layers, Target, Clock,
  Server, HardDrive, Network, Building2,
  TriangleAlert,
} from "lucide-react";
import {
  type EvaluatedControl,
  type TrustControlStatus,
  type ControlArea,
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

// ── Main Component ───────────────────────────────────────────────────

export function TrustControlsPanel({
  asset, docsCount, relationsCount, overrideType, scope = {},
}: TrustControlsPanelProps) {
  const { i18n } = useTranslation();
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
  const confidenceScore = calculateConfidenceScore(allControls);
  const risks = deriveKeyRisks(allControls);
  const grouped = groupControlsByArea(allControls);

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
    processesMaped: scope.processesMaped ?? 0,
    vendorsMapped: scope.vendorsMapped ?? 0,
  };

  const securityAreas = ([
    { area: "governance" as ControlArea, icon: Shield, label: "Governance", labelNb: "Styring" },
    { area: "risk_compliance" as ControlArea, icon: Target, label: "Operations", labelNb: "Drift" },
    { area: "security_posture" as ControlArea, icon: Lock, label: "Identity & Access", labelNb: "Identitet og tilgang" },
    { area: "supplier_governance" as ControlArea, icon: Layers, label: "Supplier & Ecosystem", labelNb: "Leverandør og økosystem" },
  ]).filter(({ area }) => grouped[area].length > 0);

  return (
    <div className="space-y-3">

      {/* ━━━ CARD 1: TRUST SCORE + SECURITY AREAS (Hero) ━━━━━━━━━━━━━ */}
      <Card className="p-5">
        {/* Top: Score hero + meta */}
        <div className="flex items-start gap-6">
          {/* Trust Score — dominant */}
          <div className="flex flex-col items-center gap-1.5 shrink-0" role="group" aria-label="Trust Score">
            <p className={`text-5xl font-bold tracking-tight ${scoreColor}`} aria-label={`Trust score ${trustScore} percent`}>
              {trustScore}
            </p>
            <Progress value={trustScore} className="h-1.5 w-20" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Trust Score</span>
          </div>

          {/* Meta: Confidence + Last Updated — secondary */}
          <div className="flex-1 min-w-0 space-y-2 pt-1">
            <div className="flex items-center gap-2">
              {confidenceLevel === "high" && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
              {confidenceLevel === "medium" && <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />}
              {confidenceLevel === "low" && <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              <span className="text-xs text-muted-foreground">
                {isNb ? "Verifiseringstillit" : "Confidence"}:
              </span>
              <span className={`text-xs font-semibold ${confidenceColor}`}>
                {isNb ? confidenceLabelNb : confidenceLabelEn}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">
                {isNb ? "Oppdatert" : "Updated"}: <span className="font-medium text-foreground">{lastUpdated}</span>
              </span>
            </div>
            <Badge variant="outline" className="text-[9px] text-muted-foreground gap-1 mt-1">
              <ShieldCheck className="h-2.5 w-2.5" />
              {isNb ? "Egenerklæring" : "Self-declared"}
            </Badge>
          </div>
        </div>

        {/* Security Areas — below score */}
        {securityAreas.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {isNb ? "Sikkerhetsområder" : "Security Areas"}
            </h3>
            {securityAreas.map(({ area, icon: AreaIcon, label, labelNb: areaNb }) => {
              const score = areaScore(area);
              return (
                <div key={area} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <AreaIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] font-medium text-foreground">{isNb ? areaNb : label}</span>
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums">{score}%</span>
                  </div>
                  <Progress value={score} className="h-1" />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ━━━ CARD 2: SCOPE + RISK (Compact secondary) ━━━━━━━━━━━━━━━ */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Scope */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {isNb ? "Omfang" : "Scope"}
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                { icon: Server, label: isNb ? "Systemer" : "Systems", value: s.systemsMapped },
                { icon: Building2, label: isNb ? "Leverandører" : "Vendors", value: s.vendorsMapped },
                { icon: Network, label: isNb ? "Prosesser" : "Processes", value: s.processesMaped },
                { icon: HardDrive, label: isNb ? "Enheter" : "Devices", value: s.devicesMapped },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <item.icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {isNb ? "Risiko" : "Risk"}
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/10">
                <TriangleAlert className="h-3 w-3 text-destructive" />
                <span className="text-xs font-bold text-destructive">{highRisks}</span>
                <span className="text-[10px] text-destructive/70">{isNb ? "Høy" : "High"}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-warning/10">
                <AlertTriangle className="h-3 w-3 text-warning" />
                <span className="text-xs font-bold text-warning">{mediumRisks}</span>
                <span className="text-[10px] text-warning/70">{isNb ? "Middels" : "Med"}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60">
                <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-bold text-muted-foreground">{lowRisks}</span>
                <span className="text-[10px] text-muted-foreground/70">{isNb ? "Lav" : "Low"}</span>
              </div>
            </div>

            {/* Top risk item — only show first one for density */}
            {risks.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <TriangleAlert className={`h-2.5 w-2.5 shrink-0 ${risks[0].severity === "high" ? "text-destructive" : "text-warning"}`} />
                <span className="text-[10px] text-muted-foreground truncate">{isNb ? risks[0].titleNb : risks[0].titleEn}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
