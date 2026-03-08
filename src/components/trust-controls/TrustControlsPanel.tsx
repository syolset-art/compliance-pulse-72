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
      <Badge variant={control.status === "implemented" ? "action" : control.status === "partial" ? "warning" : "destructive"} className="text-[10px] px-1.5 py-0 shrink-0">
        {isNb ? cfg.labelNb : cfg.labelEn}
      </Badge>
    </div>
  );
}

function ControlAreaSection({ area, controls, isNb }: { area: ControlArea; controls: EvaluatedControl[]; isNb: boolean }) {
  const [expanded, setExpanded] = useState(false);
  if (controls.length === 0) return null;
  const cfg = AREA_CONFIG[area];
  const SectionIcon = cfg.icon;
  const implemented = controls.filter(c => c.status === "implemented").length;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full py-1.5 group">
          <div className="flex items-center gap-2">
            <SectionIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{isNb ? cfg.labelNb : cfg.labelEn}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
              {implemented}/{controls.length}
            </Badge>
          </div>
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-1 gap-1.5 pt-1.5 pb-2">
          {controls.map((c) => <ControlRow key={c.key} control={c} isNb={isNb} />)}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function RiskItem({ risk, isNb }: { risk: KeyRisk; isNb: boolean }) {
  const sev = SEVERITY_CONFIG[risk.severity];
  return (
    <div className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 ${sev.bg}`}>
      <div className="flex items-center gap-2 min-w-0">
        <TriangleAlert className={`h-4 w-4 shrink-0 ${sev.color}`} />
        <span className={`text-sm ${sev.color}`}>{isNb ? risk.titleNb : risk.titleEn}</span>
      </div>
      <Badge variant={risk.severity === "high" ? "destructive" : risk.severity === "medium" ? "warning" : "outline"} className="text-[10px] shrink-0">
        {isNb ? sev.labelNb : sev.labelEn}
      </Badge>
    </div>
  );
}

function ActionItem({ action, isNb, onCreateTask }: { action: RecommendedAction; isNb: boolean; onCreateTask: (title: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
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
        {isNb ? "Oppgave" : "Task"}
      </Button>
    </div>
  );
}

// ── Collapsible section wrapper ──────────────────────────────────────

function DetailSection({ icon: Icon, title, count, children, defaultOpen = false }: {
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
        <button className="flex items-center justify-between w-full rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{title}</span>
            {count !== undefined && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">{count}</Badge>
            )}
          </div>
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
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

  const implementedCount = allControls.filter(c => c.status === "implemented").length;
  const topRisks = risks.slice(0, 2);
  const topAction = actions[0];

  const sourceLabels: Record<string, { en: string; nb: string; icon: typeof Bot }> = {
    ai_generated: { en: "Mynder AI", nb: "Mynder AI", icon: Bot },
    customer_created: { en: "Customer", nb: "Kunde", icon: User },
    vendor_claimed: { en: "Vendor verified", nb: "Leverandør", icon: Building2 },
  };
  const src = sourceLabels[profileMeta.profileSource];
  const SrcIcon = src.icon;

  const handleCreateTask = (title: string) => {
    toast.success(isNb ? `Oppgave opprettet: ${title}` : `Task created: ${title}`);
  };

  return (
    <div className="space-y-3">
      {/* ── Compact Summary Card ─────────────────────────────────── */}
      <Card className="p-5">
        <div className="flex items-start gap-5">
          {/* Left: Trust Score */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <p className={`text-3xl font-bold ${scoreColor}`}>{trustScore}%</p>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Trust Score</span>
            <Progress value={trustScore} className="h-1 w-16" />
          </div>

          {/* Center: AI summary + meta */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1 text-[10px] font-normal">
                <SrcIcon className="h-3 w-3" />
                {isNb ? src.nb : src.en}
              </Badge>
              <span className={`text-[10px] font-medium ${confidenceColor}`}>
                <ShieldCheck className="h-3 w-3 inline mr-0.5" />
                {isNb ? "Verifisering" : "Confidence"}: {confidenceScore}%
              </span>
              <span className="text-[10px] text-muted-foreground">
                {implementedCount}/{allControls.length} {isNb ? "kontroller" : "controls"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              <Lightbulb className="h-3.5 w-3.5 inline mr-1 text-primary" />
              {aiSummary}
            </p>
          </div>

          {/* Right: Top risks + CTA */}
          <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
            {topRisks.map((r) => {
              const sev = SEVERITY_CONFIG[r.severity];
              return (
                <Badge key={r.id} variant={r.severity === "high" ? "destructive" : r.severity === "medium" ? "warning" : "outline"} className="text-[10px]">
                  {isNb ? r.titleNb : r.titleEn}
                </Badge>
              );
            })}
            {topAction && (
              <Button size="sm" className="h-7 text-xs gap-1 mt-1" onClick={() => handleCreateTask(isNb ? topAction.titleNb : topAction.titleEn)}>
                <Zap className="h-3 w-3" />
                {isNb ? topAction.titleNb : topAction.titleEn}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ── Collapsible: Control Areas ───────────────────────────── */}
      <DetailSection
        icon={Shield}
        title={isNb ? "Kontrollområder" : "Control Areas"}
        count={allControls.length}
      >
        <Card className="p-4 space-y-2">
          {(["governance", "risk_compliance", "security_posture", "supplier_governance"] as ControlArea[]).map((area) => (
            grouped[area].length > 0 ? (
              <ControlAreaSection key={area} area={area} controls={grouped[area]} isNb={isNb} />
            ) : null
          ))}
        </Card>
      </DetailSection>

      {/* ── Collapsible: Key Risks ───────────────────────────────── */}
      {risks.length > 0 && (
        <DetailSection
          icon={TriangleAlert}
          title={isNb ? "Nøkkelrisikoer" : "Key Risks"}
          count={risks.length}
        >
          <div className="space-y-1.5">
            {risks.map((r) => <RiskItem key={r.id} risk={r} isNb={isNb} />)}
          </div>
        </DetailSection>
      )}

      {/* ── Collapsible: Recommended Actions ─────────────────────── */}
      {actions.length > 0 && (
        <DetailSection
          icon={Zap}
          title={isNb ? "Anbefalte handlinger" : "Recommended Actions"}
          count={actions.length}
        >
          <div className="space-y-1.5">
            {actions.slice(0, 6).map((a) => (
              <ActionItem key={a.id} action={a} isNb={isNb} onCreateTask={handleCreateTask} />
            ))}
          </div>
        </DetailSection>
      )}
    </div>
  );
}
