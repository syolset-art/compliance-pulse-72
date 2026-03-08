import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle, Shield, Lock, Layers, Target,
  Server, HardDrive, Network, Building2, TriangleAlert,
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

// ── Main Component ───────────────────────────────────────────────────

export function TrustControlsPanel({
  asset, docsCount, relationsCount, overrideType, scope = {}, onTrustMetrics,
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

  const lastUpdated = asset.updated_at
    ? new Date(asset.updated_at).toLocaleDateString(isNb ? "nb-NO" : "en-US", { day: "numeric", month: "short", year: "numeric" })
    : "–";

  // Report metrics up to parent (for header)
  if (onTrustMetrics) {
    // Use a microtask to avoid setState-during-render
    queueMicrotask(() => onTrustMetrics({ trustScore, confidenceScore, lastUpdated }));
  }

  const highRisks = risks.filter(r => r.severity === "high").length;
  const mediumRisks = risks.filter(r => r.severity === "medium").length;
  const lowRisks = risks.filter(r => r.severity === "low").length;

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* ━━━ Security Areas ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Card className="p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {isNb ? "Sikkerhetsområder" : "Security Areas"}
        </h3>
        {securityAreas.length > 0 ? (
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
        ) : (
          <p className="text-xs text-muted-foreground">{isNb ? "Ingen data" : "No data"}</p>
        )}
      </Card>

      {/* ━━━ Scope & Risk ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Card className="p-4 space-y-4">
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
