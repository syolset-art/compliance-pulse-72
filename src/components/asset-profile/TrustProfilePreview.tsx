import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  X, Shield, Lock, Layers, Target, Globe, CheckCircle2,
  AlertTriangle, FileCheck, ExternalLink, Award, Building2,
  ShieldCheck, Clock, TriangleAlert, Mail, FileText, Users,
  TrendingUp, Info, Server, Package,
} from "lucide-react";
import {
  GENERIC_CONTROLS,
  getTypeSpecificControls,
  calculateTrustScore,
  calculateConfidenceScore,
  deriveKeyRisks,
  groupControlsByArea,
  inferVerificationSource,
  type EvaluatedControl,
  type ControlArea,
  type TrustControlStatus,
} from "@/lib/trustControlDefinitions";

interface TrustProfilePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
}

function evaluateGenericControl(key: string, asset: any, docsCount: number): TrustControlStatus {
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

function evaluateTypeControl(key: string, assetType: string, asset: any): TrustControlStatus {
  const meta = (asset.metadata || {}) as Record<string, any>;
  const maps: Record<string, Record<string, () => TrustControlStatus>> = {
    self: {
      responsible_manager: () => asset.asset_manager ? "implemented" : "missing",
      security_training: () => meta.security_training_completed ? "implemented" : "missing",
      incident_reporting: () => meta.incident_reporting_defined ? "implemented" : "missing",
    },
  };
  return maps[assetType]?.[key]?.() ?? "missing";
}

const FRAMEWORK_COLORS: Record<string, string> = {
  gdpr: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  personopplysningsloven: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  nis2: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  iso27001: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "ai-act": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

function frameworkBadgeClass(id: string): string {
  const lower = id.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [key, cls] of Object.entries(FRAMEWORK_COLORS)) {
    if (lower.includes(key.replace("-", ""))) return cls;
  }
  return "bg-muted text-muted-foreground";
}

export function TrustProfilePreview({ open, onOpenChange, assetId }: TrustProfilePreviewProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const { data: asset } = useQuery({
    queryKey: ["asset-preview", assetId],
    queryFn: async () => {
      const { data } = await supabase.from("assets").select("*").eq("id", assetId).maybeSingle();
      return data;
    },
    enabled: open,
  });

  const { data: companyProfile } = useQuery({
    queryKey: ["company_profile_preview"],
    queryFn: async () => {
      const { data } = await supabase.from("company_profile").select("*").limit(1).maybeSingle();
      return data;
    },
    enabled: open,
  });

  const { data: docsCount = 0 } = useQuery({
    queryKey: ["preview-docs-count", assetId],
    queryFn: async () => {
      const { data } = await supabase.from("vendor_documents").select("id").eq("asset_id", assetId);
      return data?.length || 0;
    },
    enabled: open,
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ["preview-frameworks"],
    queryFn: async () => {
      const { data } = await supabase.from("selected_frameworks").select("framework_id, framework_name").eq("is_selected", true);
      // Only show frameworks that have a recognized color/badge — these are the ones
      // the user would intentionally want to display on a public Trust Profile
      const recognized = Object.keys(FRAMEWORK_COLORS);
      return (data || []).filter((fw) => {
        const lower = fw.framework_id.toLowerCase().replace(/[^a-z0-9]/g, "");
        return recognized.some((key) => lower.includes(key.replace("-", "")));
      });
    },
    enabled: open,
  });

  const { data: certDocs = [] } = useQuery({
    queryKey: ["preview-certs", assetId],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_documents")
        .select("*")
        .eq("asset_id", assetId)
        .in("document_type", ["iso_certificate", "soc2_report", "certification"]);
      return data || [];
    },
    enabled: open,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["preview-services", assetId],
    queryFn: async () => {
      const { data: rels } = await supabase
        .from("asset_relationships")
        .select("target_asset_id")
        .eq("source_asset_id", assetId)
        .eq("relationship_type", "service_of");
      if (!rels || rels.length === 0) return [];
      const ids = rels.map((r) => r.target_asset_id);
      const { data: assets } = await supabase
        .from("assets")
        .select("id, name, description, asset_type, compliance_score")
        .in("id", ids);
      return assets || [];
    },
    enabled: open,
  });

  if (!asset) return null;

  // Compute scores
  const effectiveType = asset.asset_type || "self";
  const evaluatedGeneric: EvaluatedControl[] = GENERIC_CONTROLS.map((c) => ({
    ...c,
    status: evaluateGenericControl(c.key, asset, docsCount),
    verificationSource: inferVerificationSource(c.key, asset as any, docsCount),
  }));
  const typeDefinitions = getTypeSpecificControls(effectiveType);
  const evaluatedType: EvaluatedControl[] = typeDefinitions.map((c) => ({
    ...c,
    status: evaluateTypeControl(c.key, effectiveType, asset),
    verificationSource: inferVerificationSource(c.key, asset as any, docsCount),
  }));
  const allControls = [...evaluatedGeneric, ...evaluatedType];
  const trustScore = calculateTrustScore(allControls);
  const confidenceScore = calculateConfidenceScore(allControls);
  const risks = deriveKeyRisks(allControls);
  const grouped = groupControlsByArea(allControls);

  const implemented = allControls.filter((c) => c.status === "implemented").length;
  const partial = allControls.filter((c) => c.status === "partial").length;
  const missing = allControls.filter((c) => c.status === "missing").length;

  const areaScore = (area: ControlArea) => {
    const controls = grouped[area];
    if (!controls || controls.length === 0) return 0;
    const impl = controls.filter((c) => c.status === "implemented").length;
    const part = controls.filter((c) => c.status === "partial").length;
    return Math.round(((impl + part * 0.5) / controls.length) * 100);
  };

  const securityAreas = [
    { area: "governance" as ControlArea, icon: Shield, label: "Governance", labelNb: "Styring" },
    { area: "risk_compliance" as ControlArea, icon: Target, label: "Operations", labelNb: "Drift" },
    { area: "security_posture" as ControlArea, icon: Lock, label: "Identity & Access", labelNb: "Identitet og tilgang" },
    { area: "supplier_governance" as ControlArea, icon: Layers, label: "Supplier & Ecosystem", labelNb: "Leverandør og økosystem" },
  ];

  const isHigh = trustScore >= 75;
  const isMid = trustScore >= 50;
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const dash = (trustScore / 100) * circ;
  const strokeColor = isHigh ? "hsl(var(--success))" : isMid ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  const confRadius = 18;
  const confCirc = 2 * Math.PI * confRadius;
  const confDash = (confidenceScore / 100) * confCirc;

  const lastUpdated = asset.updated_at
    ? new Date(asset.updated_at).toLocaleDateString(isNb ? "nb-NO" : "en-US", { day: "numeric", month: "short", year: "numeric" })
    : "–";

  const highRisks = risks.filter((r) => r.severity === "high").length;
  const mediumRisks = risks.filter((r) => r.severity === "medium").length;
  const lowRisks = risks.filter((r) => r.severity === "low").length;

  const isMspPartner = (companyProfile as any)?.is_msp_partner === true;

  const scoreLabel = isHigh
    ? (isNb ? "Sterk tillitsprofil" : "Strong trust posture")
    : isMid
    ? (isNb ? "Moderat tillitsprofil" : "Moderate trust posture")
    : (isNb ? "Tillitsprofil under utvikling" : "Trust posture developing");

  const confLabel = confidenceScore >= 80
    ? (isNb ? "Høy" : "High")
    : confidenceScore >= 50
    ? (isNb ? "Middels" : "Medium")
    : (isNb ? "Lav" : "Low");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[94vh] overflow-y-auto p-0 gap-0 border-0">
        {/* ── Top bar ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-6 py-2.5">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              {isNb ? "Forhåndsvisning — slik ser kunder profilen din" : "Preview — this is how customers see your profile"}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ══════════ HERO SECTION ══════════ */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/[0.04] via-background to-primary/[0.02]">
          <div className="px-6 md:px-10 py-8 md:py-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
              {/* Left: Identity */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {(asset as any).logo_url ? (
                  <div className="h-14 w-14 rounded-xl overflow-hidden border border-border shadow-sm shrink-0">
                    <img src={(asset as any).logo_url} alt={asset.name} className="h-full w-full object-contain bg-background" />
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{asset.name}</h1>
                    {isMspPartner && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-400 text-[10px] gap-1 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-600">
                        <Award className="h-3 w-3" /> Mynder Partner
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isNb ? "Digital Trust Profile og samsvarsoversikt" : "Digital Trust Profile and compliance overview"}
                  </p>
                  {asset.description && (
                    <p className="text-sm text-muted-foreground/70 mt-1.5 leading-relaxed max-w-xl line-clamp-2">{asset.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-3">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 text-[9px] gap-1">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      {isNb ? "Verifisert av organisasjon" : "Verified by organisation"}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] gap-1 text-muted-foreground border-border">
                      <Clock className="h-2.5 w-2.5" />
                      {lastUpdated}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Right: Trust Score – prominent */}
              <div className="flex items-center gap-6 shrink-0 md:border-l md:border-border md:pl-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                      <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="7" opacity="0.5" />
                      <circle cx="64" cy="64" r={radius} fill="none" stroke={strokeColor} strokeWidth="7" strokeLinecap="round"
                        strokeDasharray={`${dash} ${circ}`} style={{ transition: "stroke-dasharray 0.8s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-extrabold tabular-nums leading-none ${isHigh ? "text-success" : isMid ? "text-warning" : "text-destructive"}`}>
                        {trustScore}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{isNb ? "av" : "of"} 100</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">{scoreLabel}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Trust Score</p>
                  </div>
                </div>

                {/* Mini metrics column */}
                <div className="flex flex-col gap-3">
                  {/* Verification confidence mini gauge */}
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
                        <circle cx="20" cy="20" r={confRadius} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" opacity="0.4" />
                        <circle cx="20" cy="20" r={confRadius} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${confDash} ${confCirc}`}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-foreground">
                        {confidenceScore}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-foreground">{confLabel}</p>
                      <p className="text-[9px] text-muted-foreground">{isNb ? "Verifiseringstillit" : "Verification confidence"}</p>
                    </div>
                  </div>
                  {/* Control summary */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      <span className="text-[10px] text-muted-foreground">{implemented} {isNb ? "oppfylt" : "met"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-warning" />
                      <span className="text-[10px] text-muted-foreground">{partial} {isNb ? "delvis" : "partial"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Info className="h-3 w-3 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground">{missing} {isNb ? "mangler" : "missing"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ COMPANY INFO STRIP ══════════ */}
        {(asset.org_number || companyProfile?.industry || asset.category || asset.url) && (
          <div className="px-6 md:px-10 -mt-1">
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-sm grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
              {asset.org_number && (
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{isNb ? "Org.nr" : "Org no."}</p>
                    <p className="text-sm font-semibold text-foreground tabular-nums truncate">{asset.org_number}</p>
                  </div>
                </div>
              )}
              {companyProfile?.industry && (
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{isNb ? "Bransje" : "Industry"}</p>
                    <p className="text-sm font-semibold text-foreground truncate">{companyProfile.industry}</p>
                  </div>
                </div>
              )}
              {asset.category && (
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{isNb ? "Kategori" : "Category"}</p>
                    <p className="text-sm font-semibold text-foreground truncate">{asset.category}</p>
                  </div>
                </div>
              )}
              {asset.url && (
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{isNb ? "Nettside" : "Website"}</p>
                    <a href={asset.url.startsWith("http") ? asset.url : `https://${asset.url}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold text-primary hover:underline truncate block"
                    >
                      {asset.url.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ BODY ══════════ */}
        <div className="px-6 md:px-10 py-6 space-y-5">

          {/* ── Security Domains + Regulatory Scope ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Security Domains — spans 2 cols */}
            <Card className="lg:col-span-2 p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                {isNb ? "Sikkerhetsområder" : "Security Domains"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {securityAreas.map(({ area, icon: AreaIcon, label, labelNb }) => {
                  const score = areaScore(area);
                  const scoreHigh = score >= 75;
                  const scoreMid = score >= 50;
                  return (
                    <div key={area} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-md flex items-center justify-center ${scoreHigh ? "bg-success/10" : scoreMid ? "bg-warning/10" : "bg-muted"}`}>
                            <AreaIcon className={`h-3.5 w-3.5 ${scoreHigh ? "text-success" : scoreMid ? "text-warning" : "text-muted-foreground"}`} />
                          </div>
                          <span className="text-sm font-medium text-foreground">{isNb ? labelNb : label}</span>
                        </div>
                        <span className={`text-sm font-bold tabular-nums ${scoreHigh ? "text-success" : scoreMid ? "text-warning" : "text-destructive"}`}>
                          {score}%
                        </span>
                      </div>
                      <Progress value={score} className="h-2 rounded-full" />
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Regulatory Scope */}
            <Card className="p-5 flex flex-col">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5" />
                {isNb ? "Gjeldende regelverk" : "Regulatory Scope"}
              </h3>
              {frameworks.length > 0 ? (
                <div className="flex flex-col gap-2 flex-1">
                  {frameworks.map((fw: any) => (
                    <div key={fw.framework_id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${frameworkBadgeClass(fw.framework_id)}`}
                    >
                      <FileCheck className="h-3.5 w-3.5 shrink-0" />
                      {fw.framework_name}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic flex-1 flex items-center">
                  {isNb ? "Ingen rammeverk spesifisert" : "No frameworks specified"}
                </p>
              )}
            </Card>
          </div>

          {/* ── Risk Overview ── */}
          <Card className="p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              {isNb ? "Risikooversikt" : "Risk Overview"}
            </h3>
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex items-center gap-3">
                {highRisks > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                    <TriangleAlert className="h-4 w-4 text-destructive" />
                    <div>
                      <span className="text-lg font-bold text-destructive">{highRisks}</span>
                      <span className="text-xs text-destructive/70 ml-1">{isNb ? "Høy risiko" : "High risk"}</span>
                    </div>
                  </div>
                )}
                {mediumRisks > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <div>
                      <span className="text-lg font-bold text-warning">{mediumRisks}</span>
                      <span className="text-xs text-warning/70 ml-1">{isNb ? "Middels" : "Medium"}</span>
                    </div>
                  </div>
                )}
                {lowRisks > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-lg font-bold text-muted-foreground">{lowRisks}</span>
                      <span className="text-xs text-muted-foreground/70 ml-1">{isNb ? "Lav" : "Low"}</span>
                    </div>
                  </div>
                )}
                {highRisks === 0 && mediumRisks === 0 && lowRisks === 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-success">
                      {isNb ? "Ingen identifiserte risikoer" : "No identified risks"}
                    </span>
                  </div>
                )}
              </div>

              {/* Top risks */}
              {risks.length > 0 && (
                <div className="flex-1 min-w-[200px] space-y-1.5 border-l border-border pl-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {isNb ? "Viktigste funn" : "Key findings"}
                  </p>
                  {risks.slice(0, 3).map((risk, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <TriangleAlert className={`h-3 w-3 mt-0.5 shrink-0 ${risk.severity === "high" ? "text-destructive" : risk.severity === "medium" ? "text-warning" : "text-muted-foreground"}`} />
                      <span className="text-xs text-foreground/80 leading-tight">
                        {isNb ? risk.titleNb : risk.titleEn}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* ── Certifications ── */}
          <Card className="p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              {isNb ? "Sertifikater og dokumentasjon" : "Certifications & Documentation"}
            </h3>
            {certDocs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {certDocs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-success" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      {doc.valid_to && (
                        <p className="text-[10px] text-muted-foreground">
                          {isNb ? "Gyldig til" : "Valid until"} {new Date(doc.valid_to).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
                        </p>
                      )}
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed border-border">
                <FileText className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground/50">
                  {isNb ? "Ingen sertifikater lastet opp ennå" : "No certifications uploaded yet"}
                </p>
              </div>
            )}
          </Card>

          {/* ── Contact ── */}
          <Card className="p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {isNb ? "Kontaktpersoner" : "Key Contacts"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(companyProfile as any)?.dpo_name && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{(companyProfile as any).dpo_name}</p>
                    <p className="text-[10px] text-muted-foreground">{isNb ? "Personvernombud" : "Data Protection Officer"}</p>
                  </div>
                </div>
              )}
              {(companyProfile as any)?.compliance_officer && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{(companyProfile as any).compliance_officer}</p>
                    <p className="text-[10px] text-muted-foreground">{isNb ? "Samsvarsleder" : "Compliance Officer"}</p>
                  </div>
                </div>
              )}
              {(asset as any).contact_email && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{(asset as any).contact_email}</p>
                    <p className="text-[10px] text-muted-foreground">{isNb ? "Kontakt e-post" : "Contact email"}</p>
                  </div>
                </div>
              )}
              {asset.url && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate block">
                      {asset.url}
                    </a>
                    <p className="text-[10px] text-muted-foreground">{isNb ? "Nettsted" : "Website"}</p>
                  </div>
                </div>
              )}
            </div>
            {!(companyProfile as any)?.dpo_name && !(companyProfile as any)?.compliance_officer && !(asset as any).contact_email && !asset.url && (
              <p className="text-sm text-muted-foreground/50 italic text-center py-4">
                {isNb ? "Ingen kontaktinformasjon tilgjengelig" : "No contact information available"}
              </p>
            )}
          </Card>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-center gap-2 py-4 border-t border-border bg-muted/10">
          <Globe className="h-3 w-3 text-muted-foreground/40" />
          <span className="text-[10px] text-muted-foreground/40 font-medium tracking-wide">
            {isNb ? "Drevet av" : "Powered by"} Mynder Trust Engine
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
