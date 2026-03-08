import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Shield, Lock, Bot, User, Building2, Award, ShieldCheck } from "lucide-react";
import {
  type EvaluatedControl,
  type TrustControlStatus,
  type VerificationSource,
  type TrustProfileMeta,
  GENERIC_CONTROLS,
  getTypeSpecificControls,
  calculateTrustScore,
  calculateConfidenceScore,
  inferProfileMeta,
  inferVerificationSource,
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

// ── UI helpers ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TrustControlStatus, { icon: typeof CheckCircle2; color: string; bg: string; labelEn: string; labelNb: string }> = {
  implemented: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", labelEn: "Implemented", labelNb: "Implementert" },
  partial: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", labelEn: "Partial", labelNb: "Delvis" },
  missing: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", labelEn: "Missing", labelNb: "Mangler" },
};

const VERIFICATION_LABELS: Record<VerificationSource, { en: string; nb: string; color: string }> = {
  ai_inferred: { en: "AI inferred", nb: "AI-utledet", color: "text-muted-foreground" },
  customer_asserted: { en: "Customer asserted", nb: "Kunde bekreftet", color: "text-primary" },
  vendor_verified: { en: "Vendor verified", nb: "Leverandør verifisert", color: "text-success" },
  third_party_verified: { en: "Third-party verified", nb: "Tredjepartsverifisert", color: "text-success" },
};

function VerificationDot({ source, isNb }: { source: VerificationSource; isNb: boolean }) {
  const cfg = VERIFICATION_LABELS[source];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${
            source === "vendor_verified" || source === "third_party_verified" ? "bg-success"
            : source === "customer_asserted" ? "bg-primary"
            : "bg-muted-foreground/40"
          }`} />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {isNb ? cfg.nb : cfg.en}
        </TooltipContent>
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
        {control.verificationSource && (
          <VerificationDot source={control.verificationSource} isNb={isNb} />
        )}
      </div>
      <span className={`text-xs font-medium shrink-0 ${cfg.color}`}>
        {isNb ? cfg.labelNb : cfg.labelEn}
      </span>
    </div>
  );
}

function ControlSection({ title, icon: SectionIcon, controls, isNb }: { title: string; icon: typeof Shield; controls: EvaluatedControl[]; isNb: boolean }) {
  if (controls.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <SectionIcon className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {controls.map((c) => <ControlRow key={c.key} control={c} isNb={isNb} />)}
      </div>
    </div>
  );
}

// ── Profile badge ────────────────────────────────────────────────────

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

// ── Confidence indicator ─────────────────────────────────────────────

function ConfidenceIndicator({ score, isNb }: { score: number; isNb: boolean }) {
  const level = score >= 80 ? "high" : score >= 50 ? "medium" : "low";
  const color = level === "high" ? "text-success" : level === "medium" ? "text-warning" : "text-muted-foreground";
  const bgColor = level === "high" ? "bg-success/10" : level === "medium" ? "bg-warning/10" : "bg-muted/50";
  const label = {
    high: { en: "High confidence", nb: "Høy tillit" },
    medium: { en: "Medium confidence", nb: "Middels tillit" },
    low: { en: "Low confidence", nb: "Lav tillit" },
  }[level];

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${bgColor}`}>
      <ShieldCheck className={`h-4 w-4 ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">{isNb ? "Verifiseringsgrad" : "Verification confidence"}</span>
          <span className={`text-xs font-bold ${color}`}>{score}%</span>
        </div>
        <p className={`text-[10px] ${color}`}>{isNb ? label.nb : label.en}</p>
      </div>
    </div>
  );
}

// ── Type label mapping ───────────────────────────────────────────────

function getTypeSectionTitle(assetType: string, isNb: boolean): string {
  switch (assetType) {
    case "vendor": return isNb ? "Leverandørstyring" : "Supplier Governance";
    case "system": return isNb ? "Sikkerhetsstatus" : "Security Posture";
    case "hardware": return isNb ? "Endepunktsikkerhet" : "Endpoint Security";
    case "self": return isNb ? "Styrings- og bevissthetskontroller" : "Governance & Awareness";
    default: return isNb ? "Typespesifikke kontroller" : "Type-Specific Controls";
  }
}

// ── Main component ───────────────────────────────────────────────────

export function TrustControlsPanel({ asset, docsCount, relationsCount, overrideType }: TrustControlsPanelProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const effectiveType = overrideType || asset.asset_type || "";

  const profileMeta = inferProfileMeta(asset);

  // Evaluate generic controls
  const evaluatedGeneric: EvaluatedControl[] = GENERIC_CONTROLS.map((c) => ({
    ...c,
    status: evaluateGenericControl(c.key, asset, docsCount),
    verificationSource: inferVerificationSource(c.key, asset, docsCount),
  }));

  // Evaluate type-specific controls
  const typeDefinitions = getTypeSpecificControls(effectiveType);
  const evaluatedType: EvaluatedControl[] = typeDefinitions.map((c) => ({
    ...c,
    status: evaluateTypeControl(c.key, effectiveType, asset, docsCount),
    verificationSource: inferVerificationSource(c.key, asset, docsCount),
  }));

  const allControls = [...evaluatedGeneric, ...evaluatedType];
  const trustScore = calculateTrustScore(allControls);
  const confidenceScore = calculateConfidenceScore(allControls);
  const scoreColor = trustScore >= 75 ? "text-success" : trustScore >= 50 ? "text-warning" : trustScore > 0 ? "text-primary" : "text-muted-foreground";

  return (
    <Card className="p-5 space-y-5">
      {/* Profile verification badges */}
      <ProfileBadges meta={profileMeta} isNb={isNb} />

      {/* Trust score header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Trust Score</span>
        </div>
        <span className={`text-2xl font-bold ${scoreColor}`}>{trustScore}%</span>
      </div>
      <Progress value={trustScore} className="h-2" />

      {/* Confidence indicator */}
      <ConfidenceIndicator score={confidenceScore} isNb={isNb} />

      {/* Summary chips */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-success" />
          {allControls.filter((c) => c.status === "implemented").length} {isNb ? "implementert" : "implemented"}
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-warning" />
          {allControls.filter((c) => c.status === "partial").length} {isNb ? "delvis" : "partial"}
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="h-3 w-3 text-destructive" />
          {allControls.filter((c) => c.status === "missing").length} {isNb ? "mangler" : "missing"}
        </span>
      </div>

      {/* Generic controls */}
      <ControlSection
        title={isNb ? "Generelle kontroller" : "Generic Trust Controls"}
        icon={Shield}
        controls={evaluatedGeneric}
        isNb={isNb}
      />

      {/* Type-specific controls */}
      {evaluatedType.length > 0 && (
        <ControlSection
          title={getTypeSectionTitle(effectiveType, isNb)}
          icon={Lock}
          controls={evaluatedType}
          isNb={isNb}
        />
      )}
    </Card>
  );
}
