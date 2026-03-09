import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  X, Shield, Lock, Layers, Target, Globe, CheckCircle2,
  AlertTriangle, FileCheck, ExternalLink, Award, Building2,
  ShieldCheck, Clock, TriangleAlert, Mail, MapPin, FileText,
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

/* ── Control evaluation (duplicated from TrustControlsPanel for preview isolation) ── */
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

function evaluateTypeControl(key: string, assetType: string, asset: any, docsCount: number): TrustControlStatus {
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

  const { data: relationsCount = 0 } = useQuery({
    queryKey: ["preview-relations-count", assetId],
    queryFn: async () => {
      const { data } = await supabase.from("asset_relationships").select("id").or(`source_asset_id.eq.${assetId},target_asset_id.eq.${assetId}`);
      return data?.length || 0;
    },
    enabled: open,
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ["preview-frameworks"],
    queryFn: async () => {
      const { data } = await supabase.from("selected_frameworks").select("framework_id, framework_name").eq("is_selected", true);
      return data || [];
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

  if (!asset) return null;

  // Compute trust scores
  const effectiveType = asset.asset_type || "self";
  const evaluatedGeneric: EvaluatedControl[] = GENERIC_CONTROLS.map((c) => ({
    ...c,
    status: evaluateGenericControl(c.key, asset, docsCount),
    verificationSource: inferVerificationSource(c.key, asset as any, docsCount),
  }));
  const typeDefinitions = getTypeSpecificControls(effectiveType);
  const evaluatedType: EvaluatedControl[] = typeDefinitions.map((c) => ({
    ...c,
    status: evaluateTypeControl(c.key, effectiveType, asset, docsCount),
    verificationSource: inferVerificationSource(c.key, asset as any, docsCount),
  }));
  const allControls = [...evaluatedGeneric, ...evaluatedType];
  const trustScore = calculateTrustScore(allControls);
  const confidenceScore = calculateConfidenceScore(allControls);
  const risks = deriveKeyRisks(allControls);
  const grouped = groupControlsByArea(allControls);

  const areaScore = (area: ControlArea) => {
    const controls = grouped[area];
    if (!controls || controls.length === 0) return 0;
    const impl = controls.filter((c) => c.status === "implemented").length;
    const partial = controls.filter((c) => c.status === "partial").length;
    return Math.round(((impl + partial * 0.5) / controls.length) * 100);
  };

  const securityAreas = [
    { area: "governance" as ControlArea, icon: Shield, label: "Governance", labelNb: "Styring" },
    { area: "risk_compliance" as ControlArea, icon: Target, label: "Operations", labelNb: "Drift" },
    { area: "security_posture" as ControlArea, icon: Lock, label: "Identity & Access", labelNb: "Identitet og tilgang" },
    { area: "supplier_governance" as ControlArea, icon: Layers, label: "Supplier & Ecosystem", labelNb: "Leverandør og økosystem" },
  ];

  const isHigh = trustScore >= 75;
  const isMid = trustScore >= 50;
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const dash = (trustScore / 100) * circ;
  const strokeColor = isHigh ? "hsl(var(--success))" : isMid ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  const lastUpdated = asset.updated_at
    ? new Date(asset.updated_at).toLocaleDateString(isNb ? "nb-NO" : "en-US", { day: "numeric", month: "short", year: "numeric" })
    : "–";

  const highRisks = risks.filter((r) => r.severity === "high").length;
  const mediumRisks = risks.filter((r) => r.severity === "medium").length;

  const isMspPartner = (companyProfile as any)?.is_msp_partner === true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* ── Top bar ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-6 py-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {isNb ? "Forhåndsvisning — slik ser kunder profilen din" : "Preview — this is how customers see your profile"}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 md:p-8 space-y-6 bg-muted/20">
          {/* ══════════ HEADER ══════════ */}
          <div className="flex items-start gap-5">
            {/* Logo */}
            <div className="shrink-0">
              {(asset as any).logo_url ? (
                <div className="h-16 w-16 rounded-2xl overflow-hidden border border-border shadow-sm">
                  <img src={(asset as any).logo_url} alt={asset.name} className="h-full w-full object-contain bg-background" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-foreground">{asset.name}</h1>
                {isMspPartner && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-400 text-[10px] gap-1 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-600">
                    <Award className="h-3 w-3" />
                    Mynder Partner
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isNb ? "Digital Trust Profile og samsvarsoversikt" : "Digital Trust Profile and compliance overview"}
              </p>
              {asset.description && (
                <p className="text-sm text-muted-foreground/80 mt-1.5 leading-relaxed max-w-2xl">{asset.description}</p>
              )}
              <div className="flex items-center gap-1.5 mt-2">
                <Badge variant="outline" className="text-[9px] gap-1 text-muted-foreground">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  {isNb ? "Verifisert av organisasjon" : "Verified by organisation"}
                </Badge>
                <Badge variant="outline" className="text-[9px] gap-1 text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {isNb ? "Oppdatert" : "Updated"} {lastUpdated}
                </Badge>
              </div>
            </div>

            {/* Trust Score gauge */}
            <div className="hidden md:flex flex-col items-center gap-1.5 shrink-0">
              <div className="relative flex items-center justify-center">
                <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                  <circle cx="44" cy="44" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                  <circle cx="44" cy="44" r={radius} fill="none" stroke={strokeColor} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`} style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold tabular-nums leading-none ${isHigh ? "text-success" : isMid ? "text-warning" : "text-destructive"}`}>
                    {trustScore}
                  </span>
                  <span className="text-[8px] font-semibold text-muted-foreground uppercase">/100</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Trust Score</span>
            </div>
          </div>

          <Separator />

          {/* ══════════ SECURITY AREAS + SCOPE ══════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Security Areas */}
            <Card className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {isNb ? "Sikkerhetsområder" : "Security Domains"}
              </h3>
              <div className="space-y-3">
                {securityAreas.map(({ area, icon: AreaIcon, label, labelNb }) => {
                  const score = areaScore(area);
                  return (
                    <div key={area} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AreaIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{isNb ? labelNb : label}</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">{score}%</span>
                      </div>
                      <Progress value={score} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Regulatory Scope & Risk */}
            <Card className="p-5 space-y-5">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {isNb ? "Gjeldende regelverk" : "Regulatory Scope"}
                </h3>
                {frameworks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {frameworks.map((fw: any) => (
                      <span key={fw.framework_id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${frameworkBadgeClass(fw.framework_id)}`}
                      >
                        <FileCheck className="h-3 w-3" />
                        {fw.framework_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/60 italic">
                    {isNb ? "Ingen rammeverk spesifisert" : "No frameworks specified"}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {isNb ? "Risikooversikt" : "Risk Summary"}
                </h3>
                <div className="flex items-center gap-3">
                  {highRisks > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-destructive/10">
                      <TriangleAlert className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-sm font-bold text-destructive">{highRisks}</span>
                      <span className="text-[11px] text-destructive/70">{isNb ? "Høy" : "High"}</span>
                    </div>
                  )}
                  {mediumRisks > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-warning/10">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      <span className="text-sm font-bold text-warning">{mediumRisks}</span>
                      <span className="text-[11px] text-warning/70">{isNb ? "Middels" : "Medium"}</span>
                    </div>
                  )}
                  {highRisks === 0 && mediumRisks === 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-success/10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      <span className="text-sm font-medium text-success">
                        {isNb ? "Ingen kritiske risikoer" : "No critical risks"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* ══════════ CERTIFICATIONS ══════════ */}
          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {isNb ? "Sertifikater og dokumentasjon" : "Certifications & Documentation"}
            </h3>
            {certDocs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {certDocs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-background">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      {doc.valid_to && (
                        <p className="text-[10px] text-muted-foreground">
                          {isNb ? "Gyldig til" : "Valid until"} {new Date(doc.valid_to).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
                        </p>
                      )}
                    </div>
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground/60">
                  {isNb ? "Ingen sertifikater lastet opp ennå" : "No certifications uploaded yet"}
                </p>
              </div>
            )}
          </Card>

          {/* ══════════ CONTACT ══════════ */}
          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {isNb ? "Kontaktinformasjon" : "Contact Information"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(companyProfile as any)?.dpo_name && (
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {isNb ? "Personvernombud" : "Data Protection Officer"}
                    </p>
                    <p className="text-sm font-medium">{(companyProfile as any).dpo_name}</p>
                  </div>
                </div>
              )}
              {(companyProfile as any)?.compliance_officer && (
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {isNb ? "Samsvarsleder" : "Compliance Officer"}
                    </p>
                    <p className="text-sm font-medium">{(companyProfile as any).compliance_officer}</p>
                  </div>
                </div>
              )}
              {(asset as any).contact_email && (
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {isNb ? "E-post" : "Email"}
                    </p>
                    <p className="text-sm font-medium">{(asset as any).contact_email}</p>
                  </div>
                </div>
              )}
              {asset.url && (
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {isNb ? "Nettsted" : "Website"}
                    </p>
                    <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                      {asset.url}
                    </a>
                  </div>
                </div>
              )}
            </div>
            {!(companyProfile as any)?.dpo_name && !(companyProfile as any)?.compliance_officer && !(asset as any).contact_email && !asset.url && (
              <p className="text-sm text-muted-foreground/60 italic text-center py-4">
                {isNb ? "Ingen kontaktinformasjon tilgjengelig" : "No contact information available"}
              </p>
            )}
          </Card>

          {/* ── Footer watermark ── */}
          <div className="flex items-center justify-center gap-2 pt-2 pb-1">
            <span className="text-[10px] text-muted-foreground/50">
              {isNb ? "Drevet av" : "Powered by"} Mynder Trust Engine
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
