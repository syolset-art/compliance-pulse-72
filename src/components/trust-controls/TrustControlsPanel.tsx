import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Shield, Lock, Layers, Target,
  TriangleAlert, FileCheck, Pencil,
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

interface FrameworkItem {
  framework_id: string;
  framework_name: string;
}

interface TrustControlsPanelProps {
  asset: AssetLike;
  docsCount: number;
  relationsCount: number;
  overrideType?: string;
  frameworks?: FrameworkItem[];
  onTrustMetrics?: (metrics: { trustScore: number; confidenceScore: number; lastUpdated: string }) => void;
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
  asset, docsCount, relationsCount, overrideType, frameworks = [], onTrustMetrics,
}: TrustControlsPanelProps) {
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

  // All 4 security areas — always displayed
  const securityAreas = [
    { area: "governance" as ControlArea, icon: Shield, label: "Governance", labelNb: "Styring" },
    { area: "risk_compliance" as ControlArea, icon: Target, label: "Operations", labelNb: "Drift" },
    { area: "security_posture" as ControlArea, icon: Lock, label: "Identity & Access", labelNb: "Identitet og tilgang" },
    { area: "supplier_governance" as ControlArea, icon: Layers, label: "Supplier & Ecosystem", labelNb: "Leverandør og økosystem" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* ━━━ Security Areas ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Card className="p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {isNb ? "Sikkerhetsområder" : "Security Areas"}
        </h3>
        <div className="space-y-2.5">
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
      </Card>

      {/* ━━━ Regulatory Scope + Risk ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Card className="p-4 space-y-4">
        {/* Frameworks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Gjeldende regelverk" : "Regulatory Scope"}
            </h3>
            {asset.asset_type === "self" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1"
                onClick={() => navigate("/trust-center/regulations")}
              >
                <Pencil className="h-2.5 w-2.5" />
                {isNb ? "Rediger" : "Edit"}
              </Button>
            )}
          </div>
          {frameworks.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {frameworks.map((fw) => (
                <span
                  key={fw.framework_id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${frameworkBadgeClass(fw.framework_id)}`}
                >
                  <FileCheck className="h-2.5 w-2.5" />
                  {fw.framework_name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">
              {isNb ? "Ingen rammeverk valgt ennå" : "No frameworks selected yet"}
            </p>
          )}
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

          {risks.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <TriangleAlert className={`h-2.5 w-2.5 shrink-0 ${risks[0].severity === "high" ? "text-destructive" : "text-warning"}`} />
              <span className="text-[10px] text-muted-foreground truncate">{isNb ? risks[0].titleNb : risks[0].titleEn}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
