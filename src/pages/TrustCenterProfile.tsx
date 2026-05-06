import { useState, useCallback, useEffect } from "react";
import mynderLogo from "@/assets/mynder-logo.png";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Shield, ShieldCheck, Eye, Share2, Settings, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronUp, ChevronRight, Clock, MessageSquare, FileText, Award, Globe,
  Lock, Layers, Users, Link2, Code2, Copy, Check, Building2, Info, Pencil,
  Sparkles, Zap, Server, Package, ArrowRight, ExternalLink,
  Linkedin, Facebook, Mail, Star,
} from "lucide-react";

// EU-style 12-star wreath used in the compliance badge
const StarWreath = ({ count = 12, radius = 30, starSize = 7, color = "hsl(45, 90%, 55%)" }: { count?: number; radius?: number; starSize?: number; color?: string }) => (
  <div className="absolute inset-0 pointer-events-none" aria-hidden>
    {Array.from({ length: count }).map((_, i) => (
      <Star
        key={i}
        className="absolute left-1/2 top-1/2"
        style={{
          width: starSize,
          height: starSize,
          color,
          fill: color,
          transform: `translate(-50%, -50%) rotate(${i * (360 / count)}deg) translateY(-${radius}px)`,
        }}
        strokeWidth={0}
      />
    ))}
  </div>
);

// Mynder butterfly mark (matches LaraAvatar silhouette)
const ButterflyMark = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden>
    <path
      d="M12 12c-1.6-3.2-4.2-5-6.4-5-1.6 0-2.6 1.1-2.6 2.7 0 2.4 2.4 5.3 5.4 6.5C6.8 17.5 6 18.7 6 20c0 .9.7 1.5 1.6 1.5 1.5 0 3.3-1.4 4.4-3.5 1.1 2.1 2.9 3.5 4.4 3.5.9 0 1.6-.6 1.6-1.5 0-1.3-.8-2.5-2.4-3.8 3-1.2 5.4-4.1 5.4-6.5 0-1.6-1-2.7-2.6-2.7-2.2 0-4.8 1.8-6.4 5z"
      fill={color}
    />
    <circle cx="12" cy="6" r="1.4" fill={color} />
  </svg>
);

// Small circular Trust Score ring
const TrustScoreRing = ({ score, size = 36, stroke = 3, color = "hsl(45, 90%, 55%)", trackColor = "rgba(255,255,255,0.18)" }: { score: number; size?: number; stroke?: number; color?: string; trackColor?: string }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${c}`} />
      </svg>
      <span className="absolute text-[10px] font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
};
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import { usePageHelpListener } from "@/hooks/usePageHelpListener";
import { ContextualHelpPanel } from "@/components/shared/ContextualHelpPanel";
import { EvidenceStatusBadge, deriveWorstStatus } from "@/components/trust-controls/EvidenceStatusBadge";
import type { EvidenceStatus } from "@/components/trust-controls/EvidenceStatusBadge";
import { seedDemoTrustProfile } from "@/lib/demoSeedTrustProfile";

import type { ControlArea } from "@/lib/trustControlDefinitions";
import { POLICY_TYPES as TC_POLICY_TYPES, CERT_TYPES as TC_CERT_TYPES } from "@/lib/trustDocumentTypes";
import { RequiredArtifactsBlock } from "@/components/trust-center/RequiredArtifactsBlock";

const AREA_CONFIG: { area: ControlArea; icon: typeof Shield; labelEn: string; labelNb: string }[] = [
  { area: "governance", icon: Shield, labelEn: "Governance & Accountability", labelNb: "Governance & Accountability" },
  { area: "risk_compliance", icon: Lock, labelEn: "Security", labelNb: "Security" },
  { area: "security_posture", icon: Globe, labelEn: "Privacy & Data Handling", labelNb: "Privacy & Data Handling" },
  { area: "supplier_governance", icon: Layers, labelEn: "Third-Party & Supply Chain", labelNb: "Third-Party & Supply Chain" },
];

const TrustCenterProfile = ({ assetId: propAssetId, readOnly = false }: { assetId?: string; readOnly?: boolean }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const isServiceProfile = !!propAssetId;
  const [activeTab, setActiveTab] = useState<"preview" | "publish">("preview");
  const [expandedArea, setExpandedArea] = useState<ControlArea | null>(null);
  const [publishSubTab, setPublishSubTab] = useState<"link" | "vendor" | "badge">("link");
  const [badgeTheme, setBadgeTheme] = useState<"dark" | "light">("dark");
  const [selectedBadgeTier, setSelectedBadgeTier] = useState<"free" | "pro">("free");
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishStep, setPublishStep] = useState<"confirm" | "publishing" | "success">("confirm");
  const [isPublishing, setIsPublishing] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [docsSectionOpen, setDocsSectionOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const setHelpOpenCb = useCallback((v: boolean) => setHelpOpen(v), []);
  usePageHelpListener(setHelpOpenCb);

  const { data: asset, isLoading } = useQuery({
    queryKey: propAssetId ? ["asset-profile", propAssetId] : ["self-asset-profile"],
    queryFn: async () => {
      if (propAssetId) {
        const { data, error } = await supabase
          .from("assets")
          .select("*")
          .eq("id", propAssetId)
          .maybeSingle();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("asset_type", "self")
        .order("updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: companyProfile } = useQuery({
    queryKey: ["company_profile_trust_center"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_profile").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ["selected-frameworks-active-tc"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("selected_frameworks")
        .select("framework_id, framework_name, is_public")
        .eq("is_selected", true)
        .eq("is_public", true);
      if (error) return [];
      return data || [];
    },
  });

  const { data: vendorDocs = [] } = useQuery({
    queryKey: ["vendor-documents-tc", asset?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_documents")
        .select("id, document_type, file_name, display_name, status, created_at, valid_to, visibility, external_url, available_on_request, file_path, category")
        .eq("asset_id", asset!.id)
        .eq("visibility", "published");
      return data || [];
    },
    enabled: !!asset?.id,
  });

  const policies = vendorDocs.filter((d: any) => TC_POLICY_TYPES.includes(d.document_type));
  const certs = vendorDocs.filter((d: any) => TC_CERT_TYPES.includes(d.document_type));
  const otherDocs = vendorDocs.filter((d: any) =>
    !TC_POLICY_TYPES.includes(d.document_type) && !TC_CERT_TYPES.includes(d.document_type)
  );
  const docsCount = policies.length;
  const certsCount = certs.length;
  const otherDocsCount = otherDocs.length;

  const { data: services = [] } = useQuery({
    queryKey: ["trust-center-services", asset?.id],
    queryFn: async () => {
      const { data: rels } = await supabase
        .from("asset_relationships")
        .select("target_asset_id")
        .eq("source_asset_id", asset!.id)
        .eq("relationship_type", "service_of");
      if (!rels || rels.length === 0) return [];
      const ids = rels.map((r) => r.target_asset_id);
      const { data: assets } = await supabase
        .from("assets")
        .select("id, name, description, asset_type, compliance_score")
        .in("id", ids);
      return assets || [];
    },
    enabled: !!asset?.id,
  });

  const evaluation = useTrustControlEvaluation(asset?.id || "");

  // Auto-seed demo profile if none exists
  useEffect(() => {
    if (!asset && !isLoading && !isSeeding) {
      setIsSeeding(true);
      seedDemoTrustProfile()
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
          queryClient.invalidateQueries({ queryKey: ["company_profile_trust_center"] });
        })
        .catch((e) => {
          console.error("Auto-seed failed:", e);
          toast.error(isNb ? "Kunne ikke opprette profil" : "Could not create profile");
        })
        .finally(() => setIsSeeding(false));
    }
  }, [asset, isLoading, isSeeding]);

  if (isLoading || !asset) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const trustScore = evaluation?.trustScore ?? 0;
  const risks = evaluation?.risks ?? [];
  const highRisks = risks.filter(r => r.severity === "high");

  // Slug for public URL
  const slug = (companyProfile?.name || asset?.name || "")
    .toLowerCase()
    .replace(/[^a-z0-9æøå\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
  const orgSuffix = companyProfile?.org_number ? `-${companyProfile.org_number.replace(/\s/g, "").slice(-4)}` : "";
  const publicUrl = `trust.mynder.com/${slug}${orgSuffix}`;

  const isPublished = (asset as any).publish_mode && (asset as any).publish_mode !== "private";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${publicUrl}`);
    setCopiedLink(true);
    toast.success(isNb ? "Lenke kopiert" : "Link copied");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishStep("publishing");
    const { error } = await supabase
      .from("assets")
      .update({ publish_mode: "all" } as any)
      .eq("id", asset!.id);

    if (error) {
      setIsPublishing(false);
      setPublishStep("confirm");
      toast.error(isNb ? "Kunne ikke publisere" : "Could not publish");
      return;
    }

    // Brief spinner so user sees what's happening, then land on the public profile
    setTimeout(() => {
      setIsPublishing(false);
      setPublishDialogOpen(false);
      setPublishStep("confirm");
      toast.success(
        isNb ? "Trust Center publisert" : "Trust Center published",
        {
          description: isNb
            ? "Slik ser profilen din ut på Mynder Trust Engine."
            : "Here's how your profile looks on the Mynder Trust Engine.",
        }
      );
      if (asset?.id) navigate(`/trust-engine/profile/${asset.id}`);
    }, 1400);
  };

  const openPublishDialog = () => {
    setPublishStep("confirm");
    setPublishDialogOpen(true);
  };

  const trustLabel = trustScore >= 80 ? "HIGH TRUST" : trustScore >= 50 ? "MODERATE TRUST" : "LOW TRUST";
  const trustColor = trustScore >= 80 ? "text-success" : trustScore >= 50 ? "text-warning" : "text-destructive";
  const strokeColor = trustScore >= 80 ? "hsl(var(--success))" : trustScore >= 50 ? "hsl(142, 71%, 45%)" : "hsl(var(--destructive))";

  // Gauge SVG
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const dash = (trustScore / 100) * circ;

  const lastUpdated = asset.updated_at
    ? new Date(asset.updated_at).toLocaleDateString(isNb ? "nb-NO" : "en-US", { day: "numeric", month: "long", year: "numeric" })
    : "–";

  const meta = (asset.metadata || {}) as Record<string, any>;
  const dpaOk = meta.dpa_verified === true;

  const frameworkBadgeClass = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("gdpr")) return "bg-primary/10 text-primary border-primary/20 dark:bg-primary/30 dark:text-primary";
    if (n.includes("nis2")) return "bg-warning/10 text-warning border-warning/20 dark:bg-warning/30 dark:text-warning";
    if (n.includes("iso")) return "bg-status-closed/10 text-status-closed border-status-closed/20 dark:bg-status-closed/30 dark:text-status-closed";
    if (n.includes("soc")) return "bg-primary/10 text-primary border-primary/20 dark:bg-primary/30 dark:text-primary";
    if (n.includes("personopp")) return "bg-primary/10 text-primary border-primary/20 dark:bg-primary/30 dark:text-primary";
    if (n.includes("dora")) return "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/30 dark:text-destructive";
    if (n.includes("ai") || n.includes("ki-forordning")) return "bg-accent/10 text-foreground border-accent/20 dark:bg-foreground/30 dark:text-accent";
    if (n.includes("cra")) return "bg-status-closed/10 text-status-closed border-status-closed/20 dark:bg-status-closed/30 dark:text-status-closed";
    return null; // unrecognized — will be filtered out
  };

  const isStandard = (name: string) => {
    const n = name.toLowerCase();
    return n.includes("iso") || n.includes("soc");
  };

  const recognizedFrameworks = frameworks.filter((fw: any) => frameworkBadgeClass(fw.framework_name) !== null);
  const standardFrameworks = recognizedFrameworks.filter((fw: any) => isStandard(fw.framework_name));
  const regulationFrameworks = recognizedFrameworks.filter((fw: any) => !isStandard(fw.framework_name));


  if (readOnly) {
    // Force preview tab for readOnly
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {asset?.name || "Trust Profile"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Shareable compliance profile for due diligence
          </p>
        </div>

        {/* Render only preview content — the Card from line ~598 */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-stretch">
            <div className="flex-1 min-w-0">
          {/* Powered by header */}
          <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Powered by Mynder Trust Center</span>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Company Header */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border">
                    {(asset as any)?.logo_url ? (
                      <img src={(asset as any).logo_url} alt={`${companyProfile?.name || asset.name} logo`} className="h-full w-full object-contain bg-background" />
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">
                        {(companyProfile?.name || asset.name || "?").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-foreground">{(companyProfile as any)?.legal_name || companyProfile?.name || asset.name}</h2>
                    {asset?.description ? (
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{asset.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic mt-0.5">{isNb ? "Mangler kort beskrivelse – legg til i Rediger profil" : "Missing short description — add in Edit profile"}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground mt-2">
                      <span className="inline-flex items-center gap-1 text-success font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isNb ? "Kryptografisk verifiserbar" : "Cryptographically verifiable"}
                      </span>
                      <span className="text-muted-foreground/50">·</span>
                      <span>{isNb ? "sist signert 3. mai 2026" : "last signed May 3, 2026"}</span>
                      <span className="text-muted-foreground/50">·</span>
                      <button type="button" onClick={() => setProofDialogOpen(true)} className="text-primary hover:underline">{isNb ? "se bevis" : "view proof"}</button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Trust Score Gauge */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="relative flex items-center justify-center">
                  <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                    <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <circle cx="64" cy="64" r={radius} fill="none" stroke={strokeColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{ transition: "stroke-dasharray 0.6s ease" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold tabular-nums leading-none ${trustColor}`}>{trustScore}</span>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mt-1">/100</span>
                  </div>
                </div>
                <span className={`text-sm font-semibold uppercase tracking-wider ${trustColor}`}>{trustLabel}</span>
                <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {lastUpdated}
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span className="tabular-nums font-medium text-foreground">1 247</span>
                    <span>{isNb ? "visninger" : "views"}</span>
                  </span>
                </div>
                {evaluation?.evidenceChecks && evaluation.evidenceChecks.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="outline" className="text-[13px] gap-1 border-primary/20 text-primary">
                      <Zap className="h-2.5 w-2.5" />
                      {isNb ? "Agent-verifisert" : "Agent-verified"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Identity stripe */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border border-border">
              {[
                { label: isNb ? "ORG.NR" : "REG. NUMBER", value: companyProfile?.org_number || (isNb ? "Mangler" : "Missing"), missing: !companyProfile?.org_number },
                { label: isNb ? "LAND" : "COUNTRY", value: (companyProfile as any)?.country || (isNb ? "Mangler" : "Missing"), missing: !(companyProfile as any)?.country },
                { label: isNb ? "NETTSIDE" : "WEBSITE", value: companyProfile?.domain || (isNb ? "Mangler" : "Missing"), missing: !companyProfile?.domain, isLink: !!companyProfile?.domain },
                { label: isNb ? "BRANSJE" : "INDUSTRY", value: companyProfile?.industry || "–" },
              ].map(item => (
                <div key={item.label} className="bg-card px-4 py-3">
                  <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  {item.isLink ? (
                    <a href={item.value.startsWith("http") ? item.value : `https://${item.value}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline mt-0.5 truncate block">{item.value}</a>
                  ) : (
                    <p className={`text-sm font-medium mt-0.5 truncate ${item.missing ? "text-muted-foreground italic" : "text-foreground"}`}>{item.value}</p>
                  )}
                </div>
              ))}
            </div>
            </div>
            </div>
          </div>

          {/* Sections below — each in its own subtle frame */}
          <div className="p-4 md:p-6 pt-4 space-y-4 bg-muted/20 [&>section]:rounded-xl [&>section]:border [&>section]:border-border [&>section]:bg-card [&>section]:p-5 [&>section]:md:p-6">


            {/* Control areas */}
            <section id="tc-section-maturity">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">{isNb ? "Modenhet per kontrollområde" : "Maturity by control areas"}</h3>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[13px] text-muted-foreground">{isNb ? "Trust Score" : "Trust Score"}</span>
                  <span className={`text-lg font-bold tabular-nums ${trustColor}`}>{trustScore}</span>
                  <span className="text-[13px] text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AREA_CONFIG.map(({ area, icon: Icon, labelEn, labelNb }) => {
                  const score = evaluation?.areaScore(area) ?? 0;
                  const barColor = score >= 75 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive";
                  const evidenceInfo = evaluation?.evidenceSummary?.[area];
                  const evidenceStatus = evidenceInfo?.worst as EvidenceStatus | null;
                  return (
                    <div key={area} className="rounded-lg border border-border overflow-hidden">
                      <div className="w-full text-left p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{isNb ? labelNb : labelEn}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {evidenceStatus && (
                              <EvidenceStatusBadge
                                status={evidenceStatus}
                                count={evidenceStatus === "stale" ? evidenceInfo?.staleCount : evidenceStatus === "expired" ? evidenceInfo?.expiredCount : undefined}
                                compact
                              />
                            )}
                            <span className={`text-sm font-semibold tabular-nums ${score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive"}`}>{score}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Summary */}
            <section className="space-y-5">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground">{isNb ? "Sammendrag" : "Summary"}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: String(recognizedFrameworks.length), label: isNb ? "Regelverk" : "Frameworks", color: "" },
                  { value: String(policies.length), label: isNb ? "Retningslinjer" : "Policies", color: "" },
                  { value: String(certsCount), label: isNb ? "Sertifiseringer" : "Certifications", color: "" },
                  { value: dpaOk ? "✓" : "–", label: "DPA", color: dpaOk ? "text-success" : "text-muted-foreground" },
                ].map((item, i) => (
                  <div key={i} className="text-center py-4 px-2 rounded-xl bg-muted/30 border border-border/50">
                    <p className={`text-xl font-bold ${item.color || "text-foreground"}`}>{item.value}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Kontaktinformasjon — role-based, no personal names */}
            {(() => {
              const a: any = asset || {};
              const cp: any = companyProfile || {};
              const generalEmail = a.contact_email;
              const privacyEmail = a.privacy_contact_email || cp.dpo_email;
              const securityEmail = a.security_contact_email || cp.ciso_email;
              const privacyUrl = a.privacy_policy_url;
              const incidentUrl = a.incident_report_url;
              const privacyAddress = a.privacy_contact_address;

              const generalName = a.contact_name || cp.ceo_name;
              const generalRole = a.contact_role || (cp.ceo_name ? (isNb ? "Daglig leder" : "CEO") : null);
              const generalSub = [generalName, generalRole].filter(Boolean).join(" · ");

              const rows = [
                generalEmail && {
                  label: isNb ? "Generell kontakt" : "General contact",
                  sub: generalSub || undefined,
                  primary: { text: generalEmail, href: `mailto:${generalEmail}` },
                },
                privacyEmail && {
                  label: isNb ? "Personvernkontakt" : "Privacy contact",
                  sub: isNb ? "For spørsmål om dine personopplysninger" : "For questions about your personal data",
                  primary: { text: privacyEmail, href: `mailto:${privacyEmail}` },
                },
                securityEmail && {
                  label: isNb ? "Sikkerhetskontakt" : "Security contact",
                  sub: isNb ? "For å rapportere sikkerhetsproblemer" : "To report security issues",
                  primary: { text: securityEmail, href: `mailto:${securityEmail}` },
                },
                privacyAddress && {
                  label: isNb ? "Postadresse" : "Postal address",
                  block: privacyAddress,
                },
              ].filter(Boolean) as any[];

              if (rows.length === 0) return null;

              return (
                <>
                  <section id="tc-section-contact" className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-3.5 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">{isNb ? "Kontaktinformasjon" : "Contact information"}</h3>
                    </div>
                    <div className="divide-y divide-border border-t border-border">
                      {rows.map((r, i) => (
                        <div key={i} className={`px-5 py-3.5 ${r.block ? "" : "flex items-start justify-between gap-6"}`}>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{r.label}</p>
                            {r.sub && <p className="text-xs text-muted-foreground mt-0.5">{r.sub}</p>}
                            {r.block && <p className="text-xs text-muted-foreground mt-1">{r.block}</p>}
                          </div>
                          {!r.block && r.primary && (
                            <div className="flex flex-col items-end gap-0.5 shrink-0 text-right">
                              <a
                                href={r.primary.href}
                                target={r.primary.external ? "_blank" : undefined}
                                rel="noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                {r.primary.text}
                              </a>
                              {r.secondary && (
                                <a
                                  href={r.secondary.href}
                                  target={r.secondary.external ? "_blank" : undefined}
                                  rel="noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  {r.secondary.text}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                  <div className="border-t border-border" />
                </>
              );
            })()}

            {/* Documentation */}
            {(() => {
              const allDocs = [...policies, ...certs, ...otherDocs];
              const fmtDate = (d: string) => {
                if (!d) return "";
                try {
                  return new Date(d).toLocaleDateString(isNb ? "nb-NO" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
                } catch { return ""; }
              };
              return (
                <section id="tc-section-documentation" className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">
                        {isNb ? "Dokumentasjon" : "Documentation"}
                      </h3>
                    </div>
                  </div>
                  {allDocs.length === 0 ? (
                    <div className="px-5 pb-5 pt-1 border-t border-border">
                      <p className="text-xs text-muted-foreground/70 italic">
                        {isNb ? "Ingen publisert." : "None published."}
                      </p>
                    </div>
                  ) : (
                    <div className="border-t border-border divide-y divide-border">
                      {allDocs.map((doc: any) => {
                        const updated = doc.valid_to || doc.created_at;
                        const content = (
                          <>
                            <FileText className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {doc.display_name || doc.file_name}
                              </p>
                              {updated && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {isNb ? "Oppdatert" : "Updated"} {fmtDate(updated)}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </>
                        );
                        const cls = "w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors text-left";
                        return doc.external_url ? (
                          <a key={doc.id} href={doc.external_url} target="_blank" rel="noreferrer" className={cls}>{content}</a>
                        ) : (
                          <button key={doc.id} onClick={() => setPreviewDoc(doc)} className={cls}>{content}</button>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })()}

            <div className="border-t border-border" />

            {/* Contact */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">{isNb ? "Trenger du mer informasjon?" : "Need more information?"}</p>
                <p className="text-xs text-muted-foreground">{isNb ? "Kontakt oss for spørsmål om sikkerhet, compliance eller databehandling." : "Contact us for questions about security, compliance or data handling."}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 shrink-0 rounded-lg">
                <MessageSquare className="h-4 w-4" />
                {isNb ? "Kontakt oss" : "Contact us"}
              </Button>
            </div>

            {/* Mynder footer */}
            <div className="border-t border-border pt-4 mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={mynderLogo} alt="Mynder" className="h-4 opacity-50" />
              </div>
              <div className="text-[13px] text-muted-foreground/60">
                Org.nr 933 036 729 &middot; mynder.io
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-11">
          <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-5">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Trust Center</span>
              </div>
              <Badge variant="outline" className="text-xs">Free Plan</Badge>
            </div>

            {isServiceProfile && (
              <button
                onClick={() => navigate("/trust-center/products")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ChevronUp className="h-4 w-4 -rotate-90" />
                {isNb ? "Tilbake til produkter" : "Back to products"}
              </button>
            )}

            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isServiceProfile ? (asset?.name || "Trust Profile") : "Trust Profile"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isServiceProfile
                  ? (isNb
                    ? "Produkt- eller tjenesteprofil slik den vises for kunder og partnere."
                    : "Product or service profile as seen by customers and partners.")
                  : "Shareable compliance profile for due diligence"}
              </p>
            </div>

            {/* Tab bar */}
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === "preview"
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                onClick={() => setActiveTab("publish")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === "publish"
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Share2 className="h-4 w-4" />
                Share & Publish
              </button>
            </div>

            {activeTab === "publish" ? (
              <div className="space-y-5">
                {/* Sub-tabs */}
                <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
                  {([
                    { key: "link" as const, icon: Link2, label: isNb ? "Del lenke" : "Share Link" },
                    { key: "vendor" as const, icon: Building2, label: "Vendor Hub" },
                    { key: "badge" as const, icon: Code2, label: isNb ? "Nettside-badge" : "Website Badge" },
                  ] as const).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setPublishSubTab(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        publishSubTab === tab.key
                          ? "bg-background text-foreground shadow-sm border border-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Share Link sub-tab */}
                {publishSubTab === "link" && (
                  <div className="space-y-5">
                    <Card className="p-6 space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-primary" />
                          {isNb ? "Din offentlige Trust Center-lenke" : "Your public Trust Center link"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {isNb
                            ? "Dette er din unike adresse – som en LinkedIn-profil for virksomhetens sikkerhet."
                            : "This is your unique address – like a LinkedIn profile for your organization's security posture."}
                        </p>
                      </div>

                      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
                        <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Public URL</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm font-mono text-foreground">{publicUrl}</code>
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shrink-0" onClick={() => setIsEditingSlug(true)}>
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={handleCopyLink}>
                            {copiedLink ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {isNb
                          ? "Du kan endre denne når som helst. Del denne lenken med kunder og partnere."
                          : "You can change this at any time. Share this link with customers and partners."}
                      </p>
                    </Card>

                    {/* Ready to publish / Published section */}
                    <Card className="p-8 text-center space-y-4">
                      <Globe className="h-10 w-10 mx-auto text-muted-foreground" />
                      {isPublished ? (
                        <>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{isNb ? "Publisert" : "Published"}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {isNb ? "Din Trust Center er tilgjengelig på" : "Your Trust Center is available at"}{" "}
                              <span className="font-medium text-foreground">{publicUrl}</span>
                            </p>
                          </div>
                          <Button variant="outline" onClick={openPublishDialog} className="gap-2">
                            <Share2 className="h-4 w-4" />
                            {isNb ? "Publiser" : "Publish"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{isNb ? "Klar til publisering" : "Ready to publish"}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {isNb ? "Publiser din Trust Center for å gjøre den tilgjengelig på" : "Publish your Trust Center to make it available at"}{" "}
                              <span className="font-medium text-foreground">{publicUrl}</span>
                            </p>
                          </div>
                          <Button onClick={openPublishDialog} className="gap-2 bg-primary hover:bg-primary/90">
                            <Share2 className="h-4 w-4" />
                            {isNb ? "Publiser" : "Publish"}
                          </Button>
                        </>
                      )}
                    </Card>

                    {/* Info banner */}
                    <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/10 px-4 py-3">
                      <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        {isNb
                          ? "Din Trust Center erstatter behovet for å sende separate dokumenter som personvernerklæringer og databehandleravtaler."
                          : "Your Trust Center replaces the need to send separate documents like privacy policies and data processing agreements."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Vendor Hub sub-tab */}
                {publishSubTab === "vendor" && (
                  <Card className="p-10 text-center space-y-4">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
                    <h3 className="text-lg font-semibold text-foreground">Vendor Network Visibility</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {isNb
                        ? "Leverandørnettverkets synlighet hjelper organisasjoner med å finne pålitelige leverandører. Tilgjengelig i Trust Profile Pro."
                        : "Vendor network visibility helps organizations discover trusted suppliers. Available in Trust Profile Pro."}
                    </p>
                    <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setUpgradeDialogOpen(true)}>
                      <Zap className="h-4 w-4" />
                      {isNb ? "Oppgrader til Pro" : "Upgrade to Pro"}
                    </Button>
                  </Card>
                )}

                {/* Website Badge sub-tab */}
                {publishSubTab === "badge" && (
                  <div className="space-y-6">
                    {/* Theme toggle */}
                    {(() => {
                      const isDark = badgeTheme === "dark";
                      const t = {
                        bgFree: isDark
                          ? "linear-gradient(135deg, hsl(220, 45%, 18%) 0%, hsl(220, 50%, 26%) 100%)"
                          : "linear-gradient(135deg, hsl(0, 0%, 100%) 0%, hsl(30, 40%, 98%) 100%)",
                        bgPro: isDark
                          ? "linear-gradient(160deg, hsl(220, 50%, 14%) 0%, hsl(220, 45%, 22%) 100%)"
                          : "linear-gradient(160deg, hsl(0, 0%, 100%) 0%, hsl(30, 50%, 97%) 100%)",
                        gold: isDark ? "hsl(45, 90%, 55%)" : "#BA7517",
                        goldSoft: isDark ? "hsl(45, 90%, 70%)" : "#A1670F",
                        textMain: isDark ? "white" : "hsl(220, 25%, 18%)",
                        textSub: isDark ? "rgba(255,255,255,0.6)" : "hsl(220, 12%, 45%)",
                        ringTrack: isDark ? "rgba(255,255,255,0.18)" : "hsl(33, 50%, 90%)",
                        chipBg: isDark ? "hsl(45 90% 55% / 0.15)" : "rgba(186, 117, 23, 0.08)",
                        chipBorder: isDark ? "hsl(45 90% 55% / 0.35)" : "rgba(186, 117, 23, 0.3)",
                        chipText: isDark ? "hsl(45, 90%, 75%)" : "#8B5610",
                        divider: isDark ? "hsl(45 90% 55% / 0.25)" : "hsl(33, 30%, 88%)",
                        dividerSoft: isDark ? "hsl(45 90% 55% / 0.15)" : "hsl(33, 30%, 92%)",
                        boxShadowFree: isDark
                          ? "0 4px 18px hsl(220 45% 18% / 0.35), 0 0 0 1px hsl(45 90% 55% / 0.4) inset"
                          : "0 4px 16px rgba(186, 117, 23, 0.15), 0 0 0 1px rgba(186, 117, 23, 0.28) inset",
                        boxShadowPro: isDark
                          ? "0 10px 30px hsl(220 45% 12% / 0.4), 0 0 0 1px hsl(45 90% 55% / 0.25) inset"
                          : "0 10px 26px rgba(186, 117, 23, 0.15), 0 0 0 1px rgba(186, 117, 23, 0.25) inset",
                      };
                      return (
                        <>
                          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              {isNb ? "Bakgrunn for forhåndsvisning" : "Preview background"}
                            </span>
                            <div className="inline-flex rounded-md border border-border bg-background p-0.5">
                              <button
                                onClick={() => setBadgeTheme("dark")}
                                className={`px-3 py-1 text-xs font-medium rounded ${isDark ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                              >
                                {isNb ? "Mørk" : "Dark"}
                              </button>
                              <button
                                onClick={() => setBadgeTheme("light")}
                                className={`px-3 py-1 text-xs font-medium rounded ${!isDark ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                              >
                                {isNb ? "Lys" : "Light"}
                              </button>
                            </div>
                          </div>
                    {/* Badge tiers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Free Badge */}
                      <Card
                        onClick={() => setSelectedBadgeTier("free")}
                        className={`p-5 space-y-4 cursor-pointer transition-all ${selectedBadgeTier === "free" ? "border-primary ring-2 ring-primary/30 shadow-md" : "hover:border-primary/40"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">Free Badge</h3>
                            <p className="text-xs text-muted-foreground">{isNb ? "Inkludert i ditt abonnement" : "Included in your plan"}</p>
                          </div>
                          {selectedBadgeTier === "free" ? (
                            <Badge variant="default" className="text-[13px] gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {isNb ? "Valgt" : "Selected"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[13px]">{isNb ? "Velg" : "Select"}</Badge>
                          )}
                        </div>
                        <div className="flex justify-center py-5">
                          <span
                            className="relative inline-flex items-center gap-3 pl-3 pr-4 py-2 rounded-full text-sm font-semibold shadow-lg ring-1"
                            style={{
                              background: t.bgFree,
                              borderColor: t.gold,
                              color: t.textMain,
                              boxShadow: t.boxShadowFree,
                            }}
                          >
                            <span className="relative inline-flex items-center justify-center" style={{ width: 36, height: 36 }}>
                              <ButterflyMark size={16} color={t.gold} />
                            </span>
                            <span className="flex flex-col leading-tight">
                              <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: t.goldSoft }}>Mynder Verified</span>
                              <span className="text-[12px] font-semibold" style={{ color: t.textMain, opacity: 0.9 }}>Trust Score</span>
                            </span>
                            <TrustScoreRing score={trustScore} size={32} stroke={2.5} color={t.gold} trackColor={t.ringTrack} />
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {[
                            isNb ? 'Enkel "Mynder Verified" badge' : 'Basic "Mynder Verified" badge',
                            isNb ? "Embed-kode inkludert" : "Embed code included",
                            isNb ? "Lenker til ditt Trust Center" : "Links to your Trust Center",
                          ].map(item => (
                            <div key={item} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Pro Badge */}
                      <Card
                        onClick={() => setSelectedBadgeTier("pro")}
                        className={`p-5 space-y-4 cursor-pointer transition-all ${selectedBadgeTier === "pro" ? "border-primary ring-2 ring-primary/30 shadow-md" : "hover:border-primary/40"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">Pro Badge</h3>
                            <p className="text-xs text-muted-foreground">{isNb ? "Full tilpasning" : "Full customization"}</p>
                          </div>
                          {selectedBadgeTier === "pro" ? (
                            <Badge variant="default" className="text-[13px] gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {isNb ? "Valgt" : "Selected"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[13px]">{isNb ? "Velg" : "Select"}</Badge>
                          )}
                        </div>
                        <div className="flex justify-center py-4">
                          <div
                            className="relative rounded-2xl p-5 min-w-[260px]"
                            style={{
                              background: t.bgPro,
                              border: `1px solid ${t.gold}`,
                              color: t.textMain,
                              boxShadow: t.boxShadowPro,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative inline-flex items-center justify-center" style={{ width: 64, height: 64 }}>
                                <ButterflyMark size={26} color={t.gold} />
                              </div>
                              <div className="flex-1">
                                <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: t.goldSoft }}>Mynder Verified</div>
                                <div className="text-base font-semibold leading-tight" style={{ color: t.textMain }}>Trust Profile</div>
                                <div className="text-[11px]" style={{ color: t.textSub }}>Compliance · Security</div>
                              </div>
                              <div className="flex flex-col items-center gap-0.5">
                                <TrustScoreRing score={trustScore} size={42} stroke={3} color={t.gold} trackColor={t.ringTrack} />
                                <span className="text-[9px] uppercase tracking-wider" style={{ color: t.textSub }}>Trust Score</span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t text-center text-[9px] uppercase tracking-[0.22em]" style={{ borderColor: t.dividerSoft, color: t.goldSoft }}>
                              Trust · Compliance · Verified
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {[
                            isNb ? "Standard og detaljerte stiler" : "Standard and detailed styles",
                            isNb ? "Tilpasset tema (lys / mørk / auto)" : "Custom theme (light / dark / auto)",
                            isNb ? "Firmanavn på badge" : "Company name on badge",
                          ].map(item => (
                            <div key={item} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success">
                              <Sparkles className="h-3 w-3" />
                              {isNb ? "Gratis i lanseringsperioden" : "Free during launch period"}
                            </span>
                          </div>
                          <Button className="w-full gap-2 bg-primary hover:bg-primary/90" onClick={() => setUpgradeDialogOpen(true)}>
                            <Sparkles className="h-4 w-4" />
                            {isNb ? "Aktiver Pro Badge — gratis frem til lansering" : "Activate Pro Badge — free until launch"}
                          </Button>
                        </div>
                      </Card>
                    </div>

                    {/* Integration method */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-muted-foreground" />
                        {isNb ? "Velg integrasjonsmetode" : "Choose integration method"}
                      </h3>
                      <div className="rounded-lg border border-border overflow-hidden">
                        <div className="flex border-b border-border">
                          <button className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-muted/30 border-b-2 border-primary">
                            Script ({isNb ? "anbefalt" : "recommended"})
                          </button>
                          <button className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Iframe
                          </button>
                        </div>
                        <div className="relative p-4 bg-muted/20">
                          <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">{`<!-- Mynder Trust Badge -->
<div id="mynder-trust-badge"
     data-profile="${slug}${orgSuffix}"
     data-style="compact"
     data-theme="auto">
</div>
<script src="https://trust.mynder.com/badge.js" async></script>`}</pre>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(`<!-- Mynder Trust Badge -->\n<div id="mynder-trust-badge"\n     data-profile="${slug}${orgSuffix}"\n     data-style="compact"\n     data-theme="auto">\n</div>\n<script src="https://trust.mynder.com/badge.js" async></script>`);
                              toast.success(isNb ? "Kode kopiert" : "Code copied");
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <p className="px-4 py-2.5 text-xs text-muted-foreground border-t border-border">
                          {isNb
                            ? "Script-metoden gir best brukeropplevelse og oppdateres automatisk."
                            : "The script method provides the best user experience and updates automatically."}
                        </p>
                      </div>
                    </div>

                    {/* Info banner */}
                    <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/10 px-4 py-3">
                      <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {isNb ? "Trust Badge erstatter tradisjonelle dokumenter." : "Trust Badge replaces traditional documents."}
                        </span>{" "}
                        {isNb
                          ? "Besøkende kan klikke på badgen for å se din fullstendige Trust Profile med personvern, databehandleravtale og sikkerhetsdokumentasjon."
                          : "Visitors can click the badge to view your complete Trust Profile with privacy policy, data processing agreement and security documentation."}
                      </p>
                    </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              /* ── PREVIEW TAB ── */
              <Card className="overflow-hidden p-0">
                <div className="flex items-stretch">
                  <div className="flex-1 min-w-0">
                {/* Powered by header */}
                <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium">Powered by Mynder Trust Center</span>
                  </div>
                  {isPublished ? (
                    <a
                      href={`/trust-engine/profile/${asset.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={isNb ? "Åpne ditt publiserte Trust Center" : "Open your published Trust Center"}
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
                    >
                      {isNb ? "Utforsk Trust Center" : "Explore Trust Center"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground/70 cursor-help">
                          <Lock className="h-3 w-3" />
                          {isNb ? "Utforsk Trust Center" : "Explore Trust Center"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-xs leading-relaxed">
                          {isNb
                            ? "Trust Centeret aktiveres når du publiserer profilen. Da kan kunder og partnere se all informasjonen du har valgt å dele — dokumenter, sertifiseringer, modenhet og kontaktinfo — samlet på ett sted."
                            : "The Trust Center activates when you publish your profile. Customers and partners can then see all the information you've chosen to share — documents, certifications, maturity and contact info — gathered in one place."}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <div className="p-6 md:p-8 space-y-8">
                  {/* ── Company Header ── */}
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border">
                          {(asset as any)?.logo_url ? (
                            <img src={(asset as any).logo_url} alt={`${companyProfile?.name || asset.name} logo`} className="h-full w-full object-contain bg-background" />
                          ) : (
                            <span className="text-lg font-bold text-muted-foreground">
                              {(companyProfile?.name || asset.name || "?").slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-xl font-bold text-foreground">{(companyProfile as any)?.legal_name || companyProfile?.name || asset.name}</h2>
                          {asset?.description ? (
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{asset.description}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic mt-0.5">{isNb ? "Mangler kort beskrivelse" : "Missing short description"}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground mt-2">
                            <span className="inline-flex items-center gap-1 text-success font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {isNb ? "Kryptografisk verifiserbar" : "Cryptographically verifiable"}
                            </span>
                            <span className="text-muted-foreground/50">·</span>
                            <span>{isNb ? "sist signert 3. mai 2026" : "last signed May 3, 2026"}</span>
                            <span className="text-muted-foreground/50">·</span>
                            <button type="button" onClick={() => setProofDialogOpen(true)} className="text-primary hover:underline">{isNb ? "se bevis" : "view proof"}</button>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Trust Score Gauge */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className="relative flex items-center justify-center">
                        <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                          <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                          <circle
                            cx="64" cy="64" r={radius} fill="none"
                            stroke={strokeColor} strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={`${dash} ${circ}`}
                            style={{ transition: "stroke-dasharray 0.6s ease" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-4xl font-bold tabular-nums leading-none ${trustColor}`}>{trustScore}</span>
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mt-1">/100</span>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold uppercase tracking-wider ${trustColor}`}>{trustLabel}</span>
                      <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lastUpdated}
                        </span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span className="tabular-nums font-medium text-foreground">1 247</span>
                          <span>{isNb ? "visninger" : "views"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Identity stripe */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border border-border">
                    {[
                      { label: isNb ? "ORG.NR" : "REG. NUMBER", value: companyProfile?.org_number || (isNb ? "Mangler" : "Missing"), missing: !companyProfile?.org_number },
                      { label: isNb ? "LAND" : "COUNTRY", value: (companyProfile as any)?.country || (isNb ? "Mangler" : "Missing"), missing: !(companyProfile as any)?.country },
                      { label: isNb ? "NETTSIDE" : "WEBSITE", value: companyProfile?.domain || (isNb ? "Mangler" : "Missing"), missing: !companyProfile?.domain, isLink: !!companyProfile?.domain },
                      { label: isNb ? "BRANSJE" : "INDUSTRY", value: companyProfile?.industry || "–" },
                    ].map(item => (
                      <div key={item.label} className="bg-card px-4 py-3">
                        <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                        {item.isLink ? (
                          <a href={item.value.startsWith("http") ? item.value : `https://${item.value}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline mt-0.5 truncate block">{item.value}</a>
                        ) : (
                          <p className={`text-sm font-medium mt-0.5 truncate ${item.missing ? "text-muted-foreground italic" : "text-foreground"}`}>{item.value}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                  </div>
                </div>

                {/* Sections below — each in its own subtle frame */}
                <div className="p-4 md:p-6 pt-4 space-y-4 bg-muted/20 [&>section]:rounded-xl [&>section]:border [&>section]:border-border [&>section]:bg-card [&>section]:p-5 [&>section]:md:p-6">


                  {/* ── Sikkerhet og kontroller ── */}
                  <section>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-base font-semibold text-foreground">
                          {isNb ? "Modenhet per kontrollområde" : "Maturity by control areas"}
                        </h3>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[13px] text-muted-foreground">{isNb ? "Trust Score" : "Trust Score"}</span>
                        <span className={`text-lg font-bold tabular-nums ${trustColor}`}>{trustScore}</span>
                        <span className="text-[13px] text-muted-foreground">/100</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AREA_CONFIG.map(({ area, icon: Icon, labelEn, labelNb }) => {
                        const score = evaluation?.areaScore(area) ?? 0;
                        const barColor = score >= 75 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive";
                        const isExpanded = expandedArea === area;
                        const areaControls = evaluation?.grouped[area] ?? [];

                        return (
                          <div key={area} className="rounded-lg border border-border overflow-hidden">
                            <button
                              onClick={() => setExpandedArea(isExpanded ? null : area)}
                              className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Icon className="h-4 w-4 text-primary" />
                                  </div>
                                  <span className="text-sm font-medium text-foreground">{isNb ? labelNb : labelEn}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-semibold tabular-nums ${score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive"}`}>{score}%</span>
                                  {isExpanded
                                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                </div>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${barColor} transition-all duration-500`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </button>

                            {/* Expanded control details */}
                            {isExpanded && areaControls.length > 0 && (
                              <div className="border-t border-border">
                                {areaControls.map((control) => {
                                  const statusIcon = control.status === "implemented"
                                    ? <CheckCircle2 className="h-4 w-4 text-success" />
                                    : control.status === "partial"
                                      ? <AlertTriangle className="h-4 w-4 text-warning" />
                                      : <XCircle className="h-4 w-4 text-destructive" />;

                                  const statusBadgeLabel = control.status === "implemented" ? "Yes"
                                    : control.status === "partial" ? "Partial" : "No";
                                  const statusBadgeClass = control.status === "implemented"
                                    ? "bg-success/10 text-success border-success/20"
                                    : control.status === "partial"
                                      ? "bg-warning/10 text-warning border-warning/20"
                                      : "bg-destructive/10 text-destructive border-destructive/20";

                                  const verificationLabel = control.verificationSource === "third_party_verified"
                                    ? (isNb ? "Verifisert" : "Verified")
                                    : control.verificationSource === "vendor_verified"
                                      ? (isNb ? "Dokumentert" : "Documented")
                                      : control.verificationSource === "customer_asserted"
                                        ? (isNb ? "Dokumentert" : "Documented")
                                        : null;

                                  return (
                                    <div key={control.key} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
                                      <div className="flex items-center gap-3">
                                        {statusIcon}
                                        <span className="text-sm text-foreground">{isNb ? control.labelNb : control.labelEn}</span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <Badge variant="outline" className={`text-[13px] ${statusBadgeClass}`}>
                                          {statusBadgeLabel}
                                        </Badge>
                                        {verificationLabel && <span className="text-[13px] text-muted-foreground">{verificationLabel}</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>






                  {/* ── Sammendrag ── */}
                  <section className="space-y-5">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <h3 className="text-base font-semibold text-foreground">
                        {isNb ? "Sammendrag" : "Summary"}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: String(recognizedFrameworks.length), label: isNb ? "Regelverk" : "Frameworks", color: "" },
                        { value: String(policies.length), label: isNb ? "Retningslinjer" : "Policies", color: "" },
                        { value: String(certsCount), label: isNb ? "Sertifiseringer" : "Certifications", color: "" },
                        { value: dpaOk ? "✓" : "–", label: "DPA", color: dpaOk ? "text-success" : "text-muted-foreground" },
                      ].map((item, i) => (
                        <div key={i} className="text-center py-4 px-2 rounded-xl bg-muted/30 border border-border/50">
                          <p className={`text-xl font-bold ${item.color || "text-foreground"}`}>{item.value}</p>
                          <p className="text-[13px] text-muted-foreground mt-0.5">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="border-t border-border" />

                  {/* ── Kontaktinformasjon (rollebasert, uten personnavn) ── */}
                  {(() => {
                    const a: any = asset || {};
                    const cp: any = companyProfile || {};
                    const generalEmail = a.contact_email;
                    const privacyEmail = a.privacy_contact_email || cp.dpo_email;
                    const securityEmail = a.security_contact_email || cp.ciso_email;
                    const privacyUrl = a.privacy_policy_url;
                    const incidentUrl = a.incident_report_url;
                    const privacyAddress = a.privacy_contact_address;

                    const generalName = a.contact_name || cp.ceo_name;
                    const generalRole = a.contact_role || (cp.ceo_name ? (isNb ? "Daglig leder" : "CEO") : null);
                    const generalSub = [generalName, generalRole].filter(Boolean).join(" · ");

                    const rows = [
                      generalEmail && {
                        label: isNb ? "Generell kontakt" : "General contact",
                        sub: generalSub || undefined,
                        primary: { text: generalEmail, href: `mailto:${generalEmail}` },
                      },
                      privacyEmail && {
                        label: isNb ? "Personvernkontakt" : "Privacy contact",
                        sub: isNb ? "For spørsmål om dine personopplysninger" : "For questions about your personal data",
                        primary: { text: privacyEmail, href: `mailto:${privacyEmail}` },
                      },
                      securityEmail && {
                        label: isNb ? "Sikkerhetskontakt" : "Security contact",
                        sub: isNb ? "For å rapportere sikkerhetsproblemer" : "To report security issues",
                        primary: { text: securityEmail, href: `mailto:${securityEmail}` },
                      },
                      privacyAddress && {
                        label: isNb ? "Postadresse" : "Postal address",
                        block: privacyAddress,
                      },
                    ].filter(Boolean) as any[];

                    if (rows.length === 0) return null;
                    return (
                      <>
                        <section className="rounded-xl border border-border bg-card overflow-hidden">
                          <div className="px-5 py-3.5 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">{isNb ? "Kontaktinformasjon" : "Contact information"}</h3>
                          </div>
                          <div className="divide-y divide-border border-t border-border">
                            {rows.map((r, i) => (
                              <div key={i} className={`px-5 py-3.5 ${r.block ? "" : "flex items-start justify-between gap-6"}`}>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground">{r.label}</p>
                                  {r.sub && <p className="text-xs text-muted-foreground mt-0.5">{r.sub}</p>}
                                  {r.block && <p className="text-xs text-muted-foreground mt-1">{r.block}</p>}
                                </div>
                                {!r.block && r.primary && (
                                  <div className="flex flex-col items-end gap-0.5 shrink-0 text-right">
                                    <a href={r.primary.href} target={r.primary.external ? "_blank" : undefined} rel="noreferrer" className="text-sm text-primary hover:underline">
                                      {r.primary.text}
                                    </a>
                                    {r.secondary && (
                                      <a href={r.secondary.href} target={r.secondary.external ? "_blank" : undefined} rel="noreferrer" className="text-xs text-primary hover:underline">
                                        {r.secondary.text}
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                        <div className="border-t border-border" />
                      </>
                    );
                  })()}


                  {/* ── Dokumentasjon ── */}
                  {(() => {
                    const allDocs = [...policies, ...certs, ...otherDocs];
                    const fmtDate = (d: string) => {
                      if (!d) return "";
                      try {
                        return new Date(d).toLocaleDateString(isNb ? "nb-NO" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
                      } catch { return ""; }
                    };
                    return (
                      <section className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">
                              {isNb ? "Dokumentasjon" : "Documentation"}
                            </h3>
                          </div>
                        </div>
                        {allDocs.length === 0 ? (
                          <div className="px-5 pb-5 pt-1 border-t border-border">
                            <p className="text-xs text-muted-foreground/70 italic">
                              {isNb ? "Ingen publisert." : "None published."}
                            </p>
                          </div>
                        ) : (
                          <div className="border-t border-border divide-y divide-border">
                            {allDocs.map((doc: any) => {
                              const updated = doc.valid_to || doc.created_at;
                              const content = (
                                <>
                                  <FileText className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">
                                      {doc.display_name || doc.file_name}
                                    </p>
                                    {updated && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {isNb ? "Oppdatert" : "Updated"} {fmtDate(updated)}
                                      </p>
                                    )}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                </>
                              );
                              const cls = "w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors text-left";
                              return doc.external_url ? (
                                <a key={doc.id} href={doc.external_url} target="_blank" rel="noreferrer" className={cls}>{content}</a>
                              ) : (
                                <button key={doc.id} onClick={() => setPreviewDoc(doc)} className={cls}>{content}</button>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    );
                  })()}

                  <div className="border-t border-border" />

                  {/* ── Trenger du mer informasjon? ── */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">
                        {isNb ? "Trenger du mer informasjon?" : "Need more information?"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isNb
                          ? "Kontakt oss for spørsmål om sikkerhet, compliance eller databehandling."
                          : "Contact us for questions about security, compliance or data handling."}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 shrink-0 rounded-lg">
                      <MessageSquare className="h-4 w-4" />
                      {isNb ? "Kontakt oss" : "Contact us"}
                    </Button>
                  </div>

                  {/* ── Products & Services — compact link ── */}
                  {services.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <button
                        onClick={() => navigate("/trust-center/products/public")}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Package className="h-4 w-4" />
                        <span>
                          {isNb ? "Produkter og tjenester" : "Products & Services"}
                          <span className="ml-1.5 text-xs">({services.length})</span>
                        </span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* ── Mynder branding footer ── */}
                  <div className="border-t border-border pt-4 mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={mynderLogo} alt="Mynder" className="h-4 opacity-50" />
                    </div>
                    <div className="text-[13px] text-muted-foreground/60">
                      Org.nr 933 036 729 &middot; mynder.io
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Advanced link */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => navigate(`/assets/${asset.id}`)}
              >
                <Settings className="h-3.5 w-3.5" />
                {isNb ? "Avansert redigering" : "Advanced editing"}
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Upgrade to Pro Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              {isNb ? "Oppgrader til Trust Profile Pro" : "Upgrade to Trust Profile Pro"}
            </DialogTitle>
            <DialogDescription>
              {isNb
                ? "Få tilgang til avanserte funksjoner for din Trust Center."
                : "Get access to advanced features for your Trust Center."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Price */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-3xl font-bold text-foreground">990 kr<span className="text-sm font-normal text-muted-foreground"> / {isNb ? "mnd" : "mo"}</span></p>
              <p className="text-xs text-muted-foreground mt-1">{isNb ? "Faktureres årlig. Ingen bindingstid." : "Billed annually. Cancel anytime."}</p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">{isNb ? "Alt i Free, pluss:" : "Everything in Free, plus:"}</p>
              {[
                { icon: Shield, text: isNb ? "Tilpasset Trust Badge med firmanavn og regelverk" : "Custom Trust Badge with company name and regulations" },
                { icon: Eye, text: isNb ? "Tilpasset tema (lys / mørk / auto)" : "Custom theme (light / dark / auto)" },
                { icon: Users, text: isNb ? "Vendor Network synlighet – la kunder finne deg" : "Vendor Network visibility – let customers find you" },
                { icon: Globe, text: isNb ? "Egendefinert Trust Center URL" : "Custom Trust Center URL" },
                { icon: FileText, text: isNb ? "Avansert dokumentdeling med tilgangskontroll" : "Advanced document sharing with access control" },
                { icon: Award, text: isNb ? "Prioritert support og onboarding" : "Priority support and onboarding" },
              ].map(feature => (
                <div key={feature.text} className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <feature.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="space-y-3 pt-2">
              <Button
                className="w-full gap-2 bg-primary hover:bg-primary/90 h-11 text-base"
                onClick={() => {
                  setUpgradeDialogOpen(false);
                  toast.success(isNb ? "Takk for interessen! Vi tar kontakt snart." : "Thanks for your interest! We'll be in touch soon.");
                }}
              >
                <Sparkles className="h-4 w-4" />
                {isNb ? "Oppgrader nå" : "Upgrade now"}
              </Button>
              <p className="text-[13px] text-center text-muted-foreground">
                {isNb
                  ? "Du kan når som helst nedgradere til gratisplanen."
                  : "You can downgrade to the free plan at any time."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish Trust Center Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={(open) => {
        if (!isPublishing) {
          setPublishDialogOpen(open);
          if (!open) setPublishStep("confirm");
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          {publishStep === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Globe className="h-5 w-5 text-primary" />
                  {isNb ? "Publiser din Trust Center" : "Publish your Trust Center"}
                </DialogTitle>
                <DialogDescription>
                  {isNb
                    ? "Når du publiserer, blir din Trust Profile tilgjengelig i Mynder Trust Engine."
                    : "When you publish, your Trust Profile becomes available in the Mynder Trust Engine."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 pt-2">
                {/* What happens */}
                <div className="space-y-3">
                  {[
                    {
                      icon: Globe,
                      title: isNb ? "Tilgjengelig for alle" : "Available to everyone",
                      desc: isNb
                        ? "Din Trust Profile publiseres på din unike URL og blir søkbar i Mynder Trust Engine."
                        : "Your Trust Profile is published at your unique URL and becomes searchable in the Mynder Trust Engine.",
                    },
                    {
                      icon: Eye,
                      title: isNb ? "Se hvem som ser på profilen" : "See who views your profile",
                      desc: isNb
                        ? "Du får innsikt i hvor mange som besøker profilen din – og hvilke organisasjoner som viser interesse."
                        : "You'll get insights on how many people visit your profile – and which organizations show interest.",
                    },
                    {
                      icon: Clock,
                      title: isNb ? "Spar tid for alle parter" : "Save time for everyone",
                      desc: isNb
                        ? "Kunder og leverandører slipper å etterspørre dokumentasjon manuelt. Alt de trenger ligger i din Trust Center – alltid oppdatert."
                        : "Customers and vendors no longer need to manually request documentation. Everything they need is in your Trust Center – always up to date.",
                    },
                    {
                      icon: Shield,
                      title: isNb ? "Bygg tillit proaktivt" : "Build trust proactively",
                      desc: isNb
                        ? "Vis at virksomheten tar sikkerhet og personvern på alvor – uten å vente på at noen spør."
                        : "Show that your organization takes security and privacy seriously – without waiting to be asked.",
                    },
                  ].map(item => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* URL preview */}
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
                  <p className="text-[13px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                    {isNb ? "DIN TRUST CENTER URL" : "YOUR TRUST CENTER URL"}
                  </p>
                  <code className="text-sm font-mono text-foreground">{publicUrl}</code>
                </div>

                {/* CTA */}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setPublishDialogOpen(false)}>
                    {isNb ? "Avbryt" : "Cancel"}
                  </Button>
                  <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90" onClick={handlePublish}>
                    <Share2 className="h-4 w-4" />
                    {isNb ? "Publiser" : "Publish"}
                  </Button>
                </div>
              </div>
            </>
          )}

          {publishStep === "publishing" && (
            <div className="py-10 text-center space-y-4">
              <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {isNb ? "Publiserer din Trust Center..." : "Publishing your Trust Center..."}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isNb ? "Kobler til Mynder Trust Engine" : "Connecting to Mynder Trust Engine"}
                </p>
              </div>
              <Progress value={65} className="h-1.5 max-w-xs mx-auto" />
            </div>
          )}

          {publishStep === "success" && (
            <div className="py-6 text-center space-y-5">
              <div className="h-16 w-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {isNb ? "Trust Center publisert! 🎉" : "Trust Center published! 🎉"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  {isNb
                    ? "Din Trust Profile er nå tilgjengelig i Mynder Trust Engine. Kunder og partnere kan nå se din sikkerhetsprofil – og du sparer alle parter for tid og manuelle forespørsler."
                    : "Your Trust Profile is now available in the Mynder Trust Engine. Customers and partners can now view your security profile – saving everyone time and manual requests."}
                </p>
              </div>

              {/* URL to share */}
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                <code className="text-sm font-mono text-foreground">{publicUrl}</code>
              </div>

              {/* Stats teaser */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">1 247</p>
                  <p className="text-[13px] text-muted-foreground">{isNb ? "Visninger" : "Views"}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">328</p>
                  <p className="text-[13px] text-muted-foreground">{isNb ? "Unike besøkende" : "Unique visitors"}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">42</p>
                  <p className="text-[13px] text-muted-foreground">{isNb ? "Timer spart" : "Hours saved"}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {isNb
                  ? "Du vil motta statistikk om profilvisninger direkte i dashboardet ditt."
                  : "You'll receive profile view statistics directly in your dashboard."}
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
                      <Shield className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {isNb ? "Profilen din ligger nå i Mynder Trust Engine" : "Your profile is now in the Mynder Trust Engine"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isNb
                          ? "Mynders åpne register over verifiserte Trust Profiler. Mynder eier og drifter denne siden."
                          : "Mynder's open register of verified Trust Profiles. Hosted and operated by Mynder."}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => {
                    navigator.clipboard.writeText(`https://${publicUrl}`);
                    toast.success(isNb ? "Lenke kopiert!" : "Link copied!");
                  }}>
                    <Copy className="h-4 w-4" />
                    {isNb ? "Kopier lenke" : "Copy link"}
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => {
                    setPublishDialogOpen(false);
                    setPublishStep("confirm");
                    navigate("/trust-engine");
                  }}>
                    <Globe className="h-4 w-4" />
                    {isNb ? "Åpne Trust Engine" : "Open Trust Engine"}
                  </Button>
                </div>

                {/* Social share */}
                <div className="rounded-lg border border-border p-4 text-left space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    {isNb ? "Del profilen" : "Share the profile"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://${publicUrl}`)}`, "_blank", "noopener,noreferrer")}
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://${publicUrl}`)}`, "_blank", "noopener,noreferrer")}
                    >
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => {
                        const subject = isNb ? "Vår Trust Profile" : "Our Trust Profile";
                        const body = isNb
                          ? `Hei,\n\nDu kan se vår Trust Profile her: https://${publicUrl}\n`
                          : `Hi,\n\nYou can view our Trust Profile here: https://${publicUrl}\n`;
                        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      }}
                    >
                      <Mail className="h-4 w-4" />
                      {isNb ? "E-post" : "Email"}
                    </Button>
                  </div>
                </div>
                <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => {
                  setPublishDialogOpen(false);
                  setPublishStep("confirm");
                  if (asset?.id) navigate(`/trust-engine/profile/${asset.id}`);
                }}>
                  <ExternalLink className="h-4 w-4" />
                  {isNb ? "Se profilen i Trust Engine" : "View profile in Trust Engine"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ContextualHelpPanel
        open={helpOpen}
        onOpenChange={setHelpOpen}
        icon={Shield}
        title={isNb ? "Trust Profile" : "Trust Profile"}
        description={
          isNb
            ? "Trust Profilen er din virksomhets offentlige tillitserklæring. Den samler compliance-dokumentasjon, egenerklæringer og sertifiseringer i en delbar profil som kunder, partnere og myndigheter kan bruke til due diligence."
            : "The Trust Profile is your organization's public trust declaration. It gathers compliance documentation, self-assessments, and certifications into a shareable profile for due diligence by customers, partners, and regulators."
        }
        itemsHeading={isNb ? "De fire kontrollområdene" : "The four control areas"}
        items={[
          {
            icon: Shield,
            title: isNb ? "Styring og ansvar" : "Governance & Accountability",
            description: isNb
              ? "Ledelsesinvolvering, roller, compliance-organisering og internkontroll."
              : "Management involvement, roles, compliance organization, and internal controls.",
          },
          {
            icon: Lock,
            title: isNb ? "Sikkerhet" : "Security",
            description: isNb
              ? "Tilgangsstyring, logging, hendelseshåndtering og driftssikkerhet."
              : "Access control, logging, incident management, and operational security.",
          },
          {
            icon: Globe,
            title: isNb ? "Personvern og datahåndtering" : "Privacy & Data Handling",
            description: isNb
              ? "GDPR-etterlevelse, databehandleravtaler, personvernkonsekvensvurderinger og rettighetsbehandling."
              : "GDPR compliance, data processing agreements, DPIAs, and data subject rights.",
          },
          {
            icon: Layers,
            title: isNb ? "Tredjepartstyring" : "Third-Party & Supply Chain",
            description: isNb
              ? "Leverandørvurdering, underbehandlere, verdikjederisiko og SLA-oppfølging."
              : "Vendor assessment, sub-processors, supply chain risk, and SLA monitoring.",
          },
        ]}
        whyTitle={isNb ? "Hvorfor publisere?" : "Why publish?"}
        whyDescription={
          isNb
            ? "En publisert Trust Profile gjør det enkelt for kunder og partnere å vurdere din organisasjons modenhet uten å be om dokumentasjon manuelt. Det sparer tid og bygger tillit."
            : "A published Trust Profile makes it easy for customers and partners to assess your organization's maturity without requesting documentation manually. It saves time and builds trust."
        }
        actions={[
          {
            icon: Pencil,
            title: isNb ? "Rediger profilen" : "Edit profile",
            description: isNb ? "Oppdater egenerklæringer og selskapsinformasjon" : "Update self-assessments and company information",
            onClick: () => navigate("/trust-center/edit"),
          },
          {
            icon: Share2,
            title: isNb ? "Del profilen" : "Share profile",
            description: isNb ? "Kopier lenke eller del med kunder og partnere" : "Copy link or share with customers and partners",
            onClick: handleCopyLink,
          },
          {
            icon: Eye,
            title: isNb ? "Se offentlig visning" : "View public profile",
            description: isNb ? "Se profilen slik andre ser den" : "See the profile as others see it",
            onClick: () => navigate(`/trust/${asset?.id}`),
          },
        ]}
        laraSuggestions={[
          {
            label: isNb ? "Hvordan forbedrer jeg Trust Score?" : "How do I improve my Trust Score?",
            message: isNb ? "Hvordan kan jeg forbedre Trust Score i min Trust Profile?" : "How can I improve the Trust Score in my Trust Profile?",
          },
          {
            label: isNb ? "Hva bør jeg publisere?" : "What should I publish?",
            message: isNb ? "Hvilke dokumenter og kontroller bør jeg ha på plass før jeg publiserer Trust Profilen?" : "What documents and controls should I have before publishing my Trust Profile?",
          },
          {
            label: isNb ? "Forklar kontrollområdene" : "Explain the control areas",
            message: isNb ? "Forklar de fire kontrollområdene i Trust Profile og hva som vurderes i hvert område" : "Explain the four control areas in Trust Profile and what is assessed in each area",
          },
        ]}
      />

      {/* Demo document preview dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {previewDoc?.display_name || previewDoc?.file_name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 flex-wrap">
              {previewDoc?.status && (
                <Badge variant={previewDoc.status === "verified" ? "default" : "outline"} className="text-[13px]">
                  {previewDoc.status === "verified" ? (isNb ? "Verifisert" : "Verified") : previewDoc.status}
                </Badge>
              )}
              <Badge variant="outline" className="text-[13px] gap-1">
                <Globe className="h-3 w-3" />{isNb ? "Offentlig" : "Public"}
              </Badge>
              {previewDoc?.created_at && (
                <span className="text-[13px] text-muted-foreground">
                  {isNb ? "Opprettet" : "Created"} {new Date(previewDoc.created_at).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-muted/20 p-8">
            {/* Demo paper-like document preview */}
            <div className="mx-auto max-w-2xl bg-background shadow-sm border border-border rounded-md p-10 space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold tracking-wide">{isNb ? "DEMO – DOKUMENTUTDRAG" : "DEMO – DOCUMENT EXCERPT"}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">v1.0</span>
              </div>

              <h1 className="text-2xl font-bold text-foreground">
                {previewDoc?.display_name || previewDoc?.file_name}
              </h1>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {isNb
                  ? "Dette dokumentet beskriver organisasjonens retningslinjer, kontroller og forpliktelser knyttet til informasjonssikkerhet, personvern og leverandørstyring."
                  : "This document describes the organization's policies, controls and commitments related to information security, privacy and vendor governance."}
              </p>

              <div className="space-y-3">
                <h2 className="text-base font-semibold">{isNb ? "1. Formål" : "1. Purpose"}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isNb
                    ? "Sikre at organisasjonen oppfyller relevante krav i ISO 27001, GDPR og andre rammeverk som er aktivert i Trust Profile."
                    : "Ensure that the organization meets relevant requirements in ISO 27001, GDPR and other frameworks activated in the Trust Profile."}
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-base font-semibold">{isNb ? "2. Omfang" : "2. Scope"}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isNb
                    ? "Gjelder for alle ansatte, innleide konsulenter, leverandører og systemer som behandler organisasjonens data."
                    : "Applies to all employees, contractors, vendors and systems processing the organization's data."}
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-base font-semibold">{isNb ? "3. Ansvar" : "3. Responsibilities"}</h2>
                <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
                  <li>{isNb ? "Ledelsen godkjenner og forankrer dokumentet" : "Management approves and endorses the document"}</li>
                  <li>{isNb ? "Sikkerhetsansvarlig vedlikeholder innhold" : "Security lead maintains the content"}</li>
                  <li>{isNb ? "Alle ansatte etterlever retningslinjene" : "All employees comply with the policy"}</li>
                </ul>
              </div>

              <div className="border-t border-border pt-4 mt-6 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{isNb ? "Generert av Mynder for demo-formål" : "Generated by Mynder for demo purposes"}</span>
                <span>{isNb ? "Side 1 av 1" : "Page 1 of 1"}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cryptographic Proof Dialog */}
      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-success" />
              {isNb ? "Kryptografisk bevis" : "Cryptographic proof"}
            </DialogTitle>
            <DialogDescription>
              {isNb
                ? "Denne Trust Profilen er signert digitalt av Mynder Trust Engine. Bevisene under viser at innholdet ikke er endret etter signering."
                : "This Trust Profile is digitally signed by Mynder Trust Engine. The proofs below confirm the content has not been altered since signing."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{isNb ? "Status" : "Status"}</p>
                <p className="text-sm font-semibold text-success flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {isNb ? "Verifisert" : "Verified"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{isNb ? "Algoritme" : "Algorithm"}</p>
                <p className="text-sm font-semibold mt-1">Ed25519</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{isNb ? "Sist signert" : "Last signed"}</p>
                <p className="text-sm font-semibold mt-1">{isNb ? "3. mai 2026" : "May 3, 2026"}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
                <span className="text-xs font-medium">{isNb ? "Innholdshash (SHA-256)" : "Content hash (SHA-256)"}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText("8f4b2c1a9d6e3f7b5a8c2d4e6f1a9b3c5d7e9f1b3a5c7e9d1f3b5a7c9e1d3f5b");
                    toast.success(isNb ? "Kopiert" : "Copied");
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" /> {isNb ? "Kopier" : "Copy"}
                </Button>
              </div>
              <pre className="px-4 py-3 text-[11px] font-mono text-muted-foreground break-all whitespace-pre-wrap">
8f4b2c1a9d6e3f7b5a8c2d4e6f1a9b3c5d7e9f1b3a5c7e9d1f3b5a7c9e1d3f5b
              </pre>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-2 bg-muted/40 border-b border-border">
                <span className="text-xs font-medium">{isNb ? "Signatur" : "Signature"}</span>
              </div>
              <pre className="px-4 py-3 text-[11px] font-mono text-muted-foreground break-all whitespace-pre-wrap">
MEUCIQDx7c2f8a4b9e1d3f5b7a9c2e4d6f8b1a3c5e7d9f2b4a6c8e1d3f5b7a9c2e4d6f8b1a3c5e7d9f2b4a6c8e1d3f5b
              </pre>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                {isNb ? "Utstedt av" : "Issued by"}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <img src={mynderLogo} alt="Mynder" className="h-5 w-auto" />
                <span className="font-medium">Mynder Trust Engine</span>
                <span className="text-muted-foreground/50">·</span>
                <span className="text-xs text-muted-foreground">trust.mynder.no</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isNb
                  ? "Hver publisert versjon får en unik hash og signatur. Mottakere kan verifisere autentisitet via Mynder Trust Engine."
                  : "Each published version receives a unique hash and signature. Recipients can verify authenticity via Mynder Trust Engine."}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setProofDialogOpen(false)}>
                {isNb ? "Lukk" : "Close"}
              </Button>
              <Button onClick={() => window.open("/trust-engine", "_blank")} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                {isNb ? "Åpne i Trust Engine" : "Open in Trust Engine"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default TrustCenterProfile;
