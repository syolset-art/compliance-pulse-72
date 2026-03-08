import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CheckCircle2, AlertTriangle, XCircle, TrendingUp, Shield, Lock, Bot, User, Building2,
  ShieldCheck, ChevronDown, ChevronUp, Zap, ListTodo, Lightbulb, TriangleAlert,
  Layers, Target,
} from "lucide-react";
import { toast } from "sonner";
import {
  type EvaluatedControl,
  type TrustControlStatus,
  type VerificationSource,
  type TrustProfileMeta,
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

// ── Status evaluation helpers ────────────────────────────────────────

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
}

interface TrustControlsPanelProps {
  asset: AssetLike;
  docsCount: number;
  relationsCount: number;
  overrideType?: string;
}

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

function evaluateVendorControl(key: string, asset: AssetLike, docsCount: number): TrustControlStatus {
  const meta = (asset.metadata || {}) as Record<string, any>;
  switch (key) {
    case "dpa_verified": return meta.dpa_verified ? "implemented" : docsCount > 0 ? "partial" : "missing";
    case "security_contact": return asset.contact_email ? "implemented" : asset.contact_person ? "partial" : "missing";
    case "sub_processors_disclosed": return meta.sub_processors_disclosed ? "implemented" : "missing";
    case "vendor_security_review": return meta.vendor_security_review ? "implemented" : "missing";
    default: return "missing";
  }
}

function evaluateSystemControl(key: string, asset: AssetLike): TrustControlStatus {
  const meta = (asset.metadata || {}) as Record<string, any>;
  switch (key) {
    case "mfa_enabled": return meta.mfa_enabled ? "implemented" : "missing";
    case "encryption_enabled": return meta.encryption_enabled ? "implemented" : "missing";
    case "backup_configured": return meta.backup_configured ? "implemented" : "missing";
    case "security_logging": return meta.security_logging ? "implemented" : "missing";
    default: return "missing";
  }
}

function evaluateHardwareControl(key: string, asset: AssetLike): TrustControlStatus {
  const meta = (asset.metadata || {}) as Record<string, any>;
  switch (key) {
    case "device_encryption": return meta.disk_encrypted ? "implemented" : "missing";
    case "endpoint_protection": return meta.antivirus ? "implemented" : "missing";
    case "patch_management": return meta.patch_management ? "implemented" : "missing";
    default: return "missing";
  }
}

function evaluateOrgControl(key: string, asset: AssetLike): TrustControlStatus {
  const meta = (asset.metadata || {}) as Record<string, any>;
  switch (key) {
    case "responsible_manager": return asset.asset_manager ? "implemented" : "missing";
    case "security_training": return meta.security_training_completed ? "implemented" : "missing";
    case "incident_reporting": return meta.incident_reporting_defined ? "implemented" : "missing";
    default: return "missing";
  }
}

function evaluateTypeControl(key: string, assetType: string, asset: AssetLike, docsCount: number): TrustControlStatus {
  switch (assetType) {
    case "vendor": return evaluateVendorControl(key, asset, docsCount);
    case "system": return evaluateSystemControl(key, asset);
    case "hardware": return evaluateHardwareControl(key, asset);
    case "self": return evaluateOrgControl(key, asset);
    default: return "missing";
  }
}

// ── UI config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TrustControlStatus, { icon: typeof CheckCircle2; color: string; bg: string; labelEn: string; labelNb: string }> = {
  implemented: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", labelEn: "Implemented", labelNb: "Implementert" },
  partial: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", labelEn: "Partial", labelNb: "Delvis" },
  missing: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", labelEn: "Missing", labelNb: "Mangler" },
};

const VERIFICATION_LABELS: Record<VerificationSource, { en: string; nb: string }> = {
  ai_inferred: { en: "AI inferred", nb: "AI-utledet" },
  customer_asserted: { en: "Customer asserted", nb: "Kunde bekreftet" },
  vendor_verified: { en: "Vendor verified", nb: "Leverandør verifisert" },
  third_party_verified: { en: "Third-party verified", nb: "Tredjepartsverifisert" },
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

// ── Sub-components ───────────────────────────────────────────────────

function VerificationBadge({ source, isNb }: { source: VerificationSource; isNb: boolean }) {
  const label = VERIFICATION_LABELS[source];
  const dotColor =
    source === "vendor_verified" || source === "third_party_verified" ? "bg-success"
    : source === "customer_asserted" ? "bg-primary"
    : "bg-muted-foreground/40";
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">{isNb ? label.nb : label.en}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ControlRow({ control, isNb }: { control: EvaluatedControl; isNb: boolean }) {
  const cfg = STATUS_CONFIG[control.status];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${cfg.bg}`}>
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
        <span className="truncate">{isNb ? control.labelNb : control.labelEn}</span>
        {control.verificationSource && <VerificationBadge source={control.verificationSource} isNb={isNb} />}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {control.verificationSource && (
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {isNb ? VERIFICATION_LABELS[control.verificationSource].nb : VERIFICATION_LABELS[control.verificationSource].en}
          </span>
        )}
        <Badge variant={control.status === "implemented" ? "action" : control.status === "partial" ? "warning" : "destructive"} className="text-[10px] px-1.5 py-0">
          {isNb ? cfg.labelNb : cfg.labelEn}
        </Badge>
      </div>
    </div>
  );
}

function ControlAreaSection({ area, controls, isNb }: { area: ControlArea; controls: EvaluatedControl[]; isNb: boolean }) {
  const [expanded, setExpanded] = useState(true);
  if (controls.length === 0) return null;
  const cfg = AREA_CONFIG[area];
  const SectionIcon = cfg.icon;
  const implemented = controls.filter(c => c.status === "implemented").length;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-2">
          <SectionIcon className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{isNb ? cfg.labelNb : cfg.labelEn}</h4>
          <span className="text-[10px] text-muted-foreground">{implemented}/{controls.length}</span>
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="grid grid-cols-1 gap-1.5">
          {controls.map((c) => <ControlRow key={c.key} control={c} isNb={isNb} />)}
        </div>
      )}
    </div>
  );
}

function ProfileBadges({ meta, isNb }: { meta: TrustProfileMeta; isNb: boolean }) {
  const sourceLabels: Record<string, { en: string; nb: string; icon: typeof Bot }> = {
    ai_generated: { en: "Generated by Mynder AI", nb: "Generert av Mynder AI", icon: Bot },
    customer_created: { en: "Created by customer", nb: "Opprettet av kunde", icon: User },
    vendor_claimed: { en: "Verified by vendor", nb: "Verifisert av leverandør", icon: Building2 },
  };
  const src = sourceLabels[meta.profileSource];
  const SrcIcon = src.icon;

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary" className="gap-1.5 text-xs font-normal">
        <SrcIcon className="h-3 w-3" />
        {isNb ? src.nb : src.en}
      </Badge>
      {meta.contributors.includes("customer") && meta.profileSource !== "customer_created" && (
        <Badge variant="outline" className="gap-1.5 text-xs font-normal">
          <User className="h-3 w-3" />
          {isNb ? "Beriket av kunde" : "Enriched by customer"}
        </Badge>
      )}
      {meta.contributors.includes("vendor") && meta.profileSource !== "vendor_claimed" && (
        <Badge variant="outline" className="gap-1.5 text-xs font-normal">
          <Building2 className="h-3 w-3" />
          {isNb ? "Verifisert av leverandør" : "Verified by vendor"}
        </Badge>
      )}
    </div>
  );
}

function RiskItem({ risk, isNb }: { risk: KeyRisk; isNb: boolean }) {
  const sev = SEVERITY_CONFIG[risk.severity];
  return (
    <div className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 ${sev.bg}`}>
      <TriangleAlert className={`h-4 w-4 shrink-0 mt-0.5 ${sev.color}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${sev.color}`}>{isNb ? risk.titleNb : risk.titleEn}</p>
      </div>
      <Badge variant={risk.severity === "high" ? "destructive" : risk.severity === "medium" ? "warning" : "outline"} className="text-[10px] shrink-0">
        {isNb ? sev.labelNb : sev.labelEn}
      </Badge>
    </div>
  );
}

function ActionItem({ action, isNb, onCreateTask }: { action: RecommendedAction; isNb: boolean; onCreateTask: (title: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <Zap className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm truncate">{isNb ? action.titleNb : action.titleEn}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1 shrink-0"
        onClick={() => onCreateTask(isNb ? action.titleNb : action.titleEn)}
      >
        <ListTodo className="h-3 w-3" />
        {isNb ? "Opprett oppgave" : "Create task"}
      </Button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────

export function TrustControlsPanel({ asset, docsCount, relationsCount, overrideType }: TrustControlsPanelProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const effectiveType = overrideType || asset.asset_type || "";

  const profileMeta = inferProfileMeta(asset);

  // Evaluate all controls
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
  const scoreColor = trustScore >= 75 ? "text-success" : trustScore >= 50 ? "text-warning" : trustScore > 0 ? "text-primary" : "text-muted-foreground";
  const confidenceLevel = confidenceScore >= 80 ? "high" : confidenceScore >= 50 ? "medium" : "low";
  const confidenceColor = confidenceLevel === "high" ? "text-success" : confidenceLevel === "medium" ? "text-warning" : "text-muted-foreground";

  const handleCreateTask = (title: string) => {
    toast.success(isNb ? `Oppgave opprettet: ${title}` : `Task created: ${title}`);
  };

  return (
    <div className="space-y-4">
      {/* ── 1. Trust Status ──────────────────────────────────────── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{isNb ? "Tillitsstatus" : "Trust Status"}</h3>
          <ProfileBadges meta={profileMeta} isNb={isNb} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Trust Score */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Trust Score</span>
            </div>
            <p className={`text-2xl font-bold ${scoreColor}`}>{trustScore}%</p>
            <Progress value={trustScore} className="h-1.5" />
          </div>

          {/* Verification Confidence */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">
                {isNb ? "Verifiseringsgrad" : "Verification Confidence"}
              </span>
            </div>
            <p className={`text-2xl font-bold ${confidenceColor}`}>{confidenceScore}%</p>
            <p className={`text-[10px] ${confidenceColor}`}>
              {confidenceLevel === "high" ? (isNb ? "Høy" : "High")
                : confidenceLevel === "medium" ? (isNb ? "Middels" : "Medium")
                : (isNb ? "Lav" : "Low")}
            </p>
          </div>

          {/* Summary chips */}
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground font-medium block">{isNb ? "Kontroller" : "Controls"}</span>
            <div className="space-y-1">
              <span className="flex items-center gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3 text-success" />
                {allControls.filter(c => c.status === "implemented").length} {isNb ? "implementert" : "implemented"}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <AlertTriangle className="h-3 w-3 text-warning" />
                {allControls.filter(c => c.status === "partial").length} {isNb ? "delvis" : "partial"}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <XCircle className="h-3 w-3 text-destructive" />
                {allControls.filter(c => c.status === "missing").length} {isNb ? "mangler" : "missing"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 2. Control Areas ─────────────────────────────────────── */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold">{isNb ? "Kontrollområder" : "Control Areas"}</h3>
        {(["governance", "risk_compliance", "security_posture", "supplier_governance"] as ControlArea[]).map((area) => (
          grouped[area].length > 0 ? (
            <ControlAreaSection key={area} area={area} controls={grouped[area]} isNb={isNb} />
          ) : null
        ))}
      </Card>

      {/* ── 3. Key Risks ─────────────────────────────────────────── */}
      {risks.length > 0 && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold">{isNb ? "Nøkkelrisikoer" : "Key Risks"}</h3>
            <Badge variant="destructive" className="text-[10px] ml-auto">{risks.length}</Badge>
          </div>
          <div className="space-y-1.5">
            {risks.map((r) => <RiskItem key={r.id} risk={r} isNb={isNb} />)}
          </div>
        </Card>
      )}

      {/* ── 4. Recommended Actions ───────────────────────────────── */}
      {actions.length > 0 && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">{isNb ? "Anbefalte handlinger" : "Recommended Actions"}</h3>
          </div>
          <div className="space-y-1.5">
            {actions.slice(0, 6).map((a) => (
              <ActionItem key={a.id} action={a} isNb={isNb} onCreateTask={handleCreateTask} />
            ))}
          </div>
        </Card>
      )}

      {/* ── 5. AI Insights ───────────────────────────────────────── */}
      <Card className="p-5 space-y-3 border-primary/20 bg-primary/[0.02]">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{isNb ? "AI-innsikt fra Lara" : "AI Insights from Lara"}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{aiSummary}</p>
      </Card>
    </div>
  );
}
