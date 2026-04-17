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
  Shield, Eye, Share2, Settings, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronUp, Clock, MessageSquare, FileText, Award, Globe,
  Lock, Layers, Users, Link2, Code2, Copy, Check, Building2, Info, Pencil,
  Sparkles, Zap, Server, Package, ArrowRight,
} from "lucide-react";
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
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishStep, setPublishStep] = useState<"confirm" | "publishing" | "success">("confirm");
  const [isPublishing, setIsPublishing] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
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
        .select("framework_id, framework_name")
        .eq("is_selected", true);
      if (error) return [];
      return data || [];
    },
  });

  const { data: vendorDocs = [] } = useQuery({
    queryKey: ["vendor-documents-tc", asset?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_documents")
        .select("id, document_type, file_name, status, created_at, expiry_date, visibility")
        .eq("asset_id", asset!.id)
        .eq("visibility", "published");
      return data || [];
    },
    enabled: !!asset?.id,
  });

  const policies = vendorDocs.filter((d: any) => d.document_type !== "certification");
  const certs = vendorDocs.filter((d: any) => d.document_type === "certification");
  const docsCount = policies.length;
  const certsCount = certs.length;

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
    // Simulate a brief processing delay
    await new Promise(r => setTimeout(r, 2000));
    const { error } = await supabase
      .from("assets")
      .update({ publish_mode: "all" } as any)
      .eq("id", asset!.id);
    setIsPublishing(false);
    if (error) {
      toast.error(isNb ? "Kunne ikke publisere" : "Could not publish");
      setPublishDialogOpen(false);
      setPublishStep("confirm");
    } else {
      setPublishStep("success");
    }
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
    if (n.includes("gdpr")) return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300";
    if (n.includes("nis2")) return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300";
    if (n.includes("iso")) return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300";
    if (n.includes("soc")) return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300";
    if (n.includes("personopp")) return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300";
    if (n.includes("dora")) return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300";
    if (n.includes("ai") || n.includes("ki-forordning")) return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300";
    if (n.includes("cra")) return "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300";
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
        <Card className="overflow-hidden">
          {/* Powered by header */}
          <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Powered by Mynder Trust Center</span>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 text-[13px] gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </Badge>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Company Header */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Shield className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-foreground">{companyProfile?.name || asset.name}</h2>
                    <p className="text-sm text-muted-foreground">Shareable compliance profile for due diligence</p>
                  </div>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-[13px] cursor-help">
                      {isNb ? "Egenerklæring" : "Self-declared"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[220px]">
                      {isNb ? "Selverklæring og compliance-dokumentasjon" : "Self-declared compliance documentation"}
                    </p>
                  </TooltipContent>
                </Tooltip>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{isNb ? "Profilvisninger: " : "Profile views: "}<span className="font-semibold text-foreground">—</span></span>
                </div>

                {recognizedFrameworks.length > 0 && (
                  <div className="space-y-3">
                    {standardFrameworks.length > 0 && (
                      <div>
                        <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                          {isNb ? "Standarder og sertifiseringer" : "Standards & Certifications"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {standardFrameworks.map((fw: any) => (
                            <Badge key={fw.framework_id} variant="outline" className={`text-[13px] font-medium ${frameworkBadgeClass(fw.framework_name)}`}>
                              {fw.framework_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {regulationFrameworks.length > 0 && (
                      <div>
                        <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                          {isNb ? "Regulatorisk dekning" : "Regulatory Coverage"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {regulationFrameworks.map((fw: any) => (
                            <Badge key={fw.framework_id} variant="outline" className={`text-[13px] font-medium ${frameworkBadgeClass(fw.framework_name)}`}>
                              {fw.framework_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Trust Score Gauge */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="relative flex items-center justify-center">
                  <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                    <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <circle cx="64" cy="64" r={radius} fill="none" stroke={strokeColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{ transition: "stroke-dasharray 0.6s ease" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold tabular-nums ${trustColor}`}>{trustScore}</span>
                    <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{trustLabel}</span>
                  </div>
                </div>
                <p className="text-[13px] text-muted-foreground text-center">
                  {trustScore >= 80 ? (isNb ? "Godt egnet for de fleste bruksområder" : "Suitable for most use cases") : trustScore >= 50 ? (isNb ? "Egnet for standard bruksområder" : "Suitable for standard use cases") : (isNb ? "Begrenset egnethet" : "Limited suitability")}
                </p>
                <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{isNb ? "Sist oppdatert:" : "Last updated:"} {lastUpdated}</span>
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

            {/* Metadata stripe */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border border-border">
              {[
                { label: "ORG.NR", value: companyProfile?.org_number || "–" },
                { label: isNb ? "BRANSJE" : "INDUSTRY", value: companyProfile?.industry || "–" },
                { label: isNb ? "KATEGORI" : "CATEGORY", value: asset.vendor_category || asset.category || "–" },
                { label: isNb ? "NETTSIDE" : "WEBSITE", value: companyProfile?.domain || "–" },
              ].map(item => (
                <div key={item.label} className="bg-card px-4 py-3">
                  <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-medium text-foreground mt-0.5 truncate">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Control areas */}
            <section>
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
                  { value: evaluation ? `${evaluation.implementedCount + evaluation.partialCount}/${evaluation.allControls.length}` : "0/0", label: isNb ? "Modenhet per kontrollområde" : "Maturity by control areas", color: "text-warning" },
                  { value: String(certsCount), label: isNb ? "Sertifiseringer" : "Certifications", color: "" },
                  { value: dpaOk ? "✓" : "–", label: dpaOk ? "DPA OK" : "DPA", color: dpaOk ? "text-success" : "" },
                ].map((item, i) => (
                  <div key={i} className="text-center py-4 px-2 rounded-xl bg-muted/30 border border-border/50">
                    <p className={`text-xl font-bold ${item.color || "text-foreground"}`}>{item.value}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Documentation */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {isNb ? "DOKUMENTASJON OG BEVIS" : "DOCUMENTATION AND EVIDENCE"}
              </h3>
              <div className="space-y-2.5">
                {[
                  { key: "policies", icon: FileText, label: "Policies", count: docsCount, color: "text-primary", items: policies },
                  { key: "certs", icon: Award, label: isNb ? "Sertifiseringer" : "Certifications", count: certsCount, color: "text-purple-500", items: certs },
                  { key: "datahandling", icon: Eye, label: isNb ? "Datahåndtering" : "Data handling", count: 0, color: "text-primary", items: [] as any[] },
                  { key: "documents", icon: FileText, label: isNb ? "Dokumenter" : "Documents", count: 0, color: "text-primary", items: [] as any[] },
                ].map(item => (
                  <div key={item.key}>
                    <button
                      onClick={() => setExpandedDoc(expandedDoc === item.key ? null : item.key)}
                      className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl border border-border hover:bg-muted/40 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        {item.count > 0 && <Badge variant="secondary" className="text-[13px] rounded-full px-2 font-semibold">{item.count}</Badge>}
                      </div>
                      {expandedDoc === item.key ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedDoc === item.key && (
                      <div className="mt-1.5 ml-5 space-y-1">
                        {item.items.length === 0 ? (
                          <p className="text-xs text-muted-foreground px-4 py-3">{isNb ? "Ingen registrert ennå" : "None registered yet"}</p>
                        ) : (
                          item.items.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-muted/30 border border-border/50">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs font-medium text-foreground truncate">{doc.file_name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {doc.status && <Badge variant={doc.status === "verified" ? "default" : "outline"} className="text-[13px]">{doc.status === "verified" ? (isNb ? "Verifisert" : "Verified") : doc.status}</Badge>}
                                {doc.expiry_date && <span className="text-[13px] text-muted-foreground">{isNb ? "Utløper" : "Expires"} {new Date(doc.expiry_date).toLocaleDateString()}</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

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
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "preview"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                onClick={() => navigate("/trust-center/edit")}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="h-4 w-4" />
                {isNb ? "Rediger" : "Edit"}
              </button>
              <button
                onClick={() => setActiveTab("publish")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "publish"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Share2 className="h-4 w-4" />
                Share & Publish
              </button>
            </div>

            {activeTab === "publish" ? (
              <div className="space-y-5">
                {/* Sub-tabs */}
                <div className="flex border-b border-border">
                  {([
                    { key: "link" as const, icon: Link2, label: isNb ? "Del lenke" : "Share Link" },
                    { key: "vendor" as const, icon: Building2, label: "Vendor Hub" },
                    { key: "badge" as const, icon: Code2, label: isNb ? "Nettside-badge" : "Website Badge" },
                  ] as const).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setPublishSubTab(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        publishSubTab === tab.key
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
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
                            {isNb ? "Oppdater publisering" : "Update publishing"}
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
                            {isNb ? "Publiser Trust Center" : "Publish Trust Center"}
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
                    {/* Badge tiers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Free Badge */}
                      <Card className="p-5 border-primary ring-1 ring-primary/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">Free Badge</h3>
                            <p className="text-xs text-muted-foreground">{isNb ? "Inkludert i ditt abonnement" : "Included in your plan"}</p>
                          </div>
                          <Badge variant="outline" className="text-[13px] border-primary/40 text-primary">Current</Badge>
                        </div>
                        <div className="flex justify-center py-5">
                          <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-[hsl(280,50%,75%)] text-white text-sm font-semibold shadow-lg shadow-primary/25 ring-1 ring-primary/20">
                            <Shield className="h-4.5 w-4.5 drop-shadow-sm" />
                            Mynder Verified
                            <CheckCircle2 className="h-3.5 w-3.5 opacity-80" />
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
                      <Card className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">Pro Badge</h3>
                            <p className="text-xs text-muted-foreground">{isNb ? "Full tilpasning" : "Full customization"}</p>
                          </div>
                          <Badge variant="outline" className="text-[13px] gap-1">
                            <Settings className="h-3 w-3" />
                            Pro
                          </Badge>
                        </div>
                        <div className="flex justify-center py-4">
                          <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-[hsl(280,50%,75%)]/5 p-4 space-y-2.5 min-w-[220px] shadow-md shadow-primary/10">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-[hsl(280,50%,75%)] flex items-center justify-center shadow-sm">
                                <Shield className="h-3.5 w-3.5 text-white" />
                              </div>
                              <div>
                                <span className="text-sm font-bold text-foreground">Trust Profile</span>
                                <p className="text-[13px] text-primary font-medium">Verified by Mynder</p>
                              </div>
                            </div>
                            {recognizedFrameworks.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1 border-t border-primary/10">
                                {recognizedFrameworks.slice(0, 3).map((fw: any, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-[13px] bg-primary/10 text-primary border-0">{fw.framework_name}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {[
                            isNb ? "Standard og detaljerte stiler" : "Standard and detailed styles",
                            isNb ? "Tilpasset tema (lys / mørk / auto)" : "Custom theme (light / dark / auto)",
                            isNb ? "Vis regelverk og compliance-info" : "Show regulations & compliance info",
                            isNb ? "Firmanavn på badge" : "Company name on badge",
                          ].map(item => (
                            <div key={item} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                        <Button className="w-full gap-2 bg-primary hover:bg-primary/90" onClick={() => setUpgradeDialogOpen(true)}>
                          <Sparkles className="h-4 w-4" />
                          {isNb ? "Oppgrader for å tilpasse badge" : "Upgrade to customize badge"}
                        </Button>
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
                  </div>
                )}
              </div>
            ) : (
              /* ── PREVIEW TAB ── */
              <Card className="overflow-hidden">
                {/* Powered by header */}
                <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium">Powered by Mynder Trust Center</span>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 text-[13px] gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                  {/* ── Company Header ── */}
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Shield className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-xl font-bold text-foreground">{companyProfile?.name || asset.name}</h2>
                          <p className="text-sm text-muted-foreground">Shareable compliance profile for due diligence</p>
                        </div>
                      </div>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-[13px] cursor-help">
                            {isNb ? "Egenerklæring" : "Self-declared"}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-[220px]">
                            {isNb
                              ? "Selverklæring og compliance-dokumentasjon"
                              : "Self-declared compliance documentation"}
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>
                          {isNb ? "Profilvisninger: " : "Profile views: "}
                          <span className="font-semibold text-foreground">—</span>
                        </span>
                      </div>

                      {/* Framework badges — split into Standards & Regulations */}
                      {recognizedFrameworks.length > 0 && (
                        <div className="space-y-3">
                          {standardFrameworks.length > 0 && (
                            <div>
                              <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                {isNb ? "Standarder og sertifiseringer" : "Standards & Certifications"}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {standardFrameworks.map((fw: any) => (
                                  <Badge
                                    key={fw.framework_id}
                                    variant="outline"
                                    className={`text-[13px] font-medium ${frameworkBadgeClass(fw.framework_name)}`}
                                  >
                                    {fw.framework_name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {regulationFrameworks.length > 0 && (
                            <div>
                              <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                {isNb ? "Regulatorisk dekning" : "Regulatory Coverage"}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {regulationFrameworks.map((fw: any) => (
                                  <Badge
                                    key={fw.framework_id}
                                    variant="outline"
                                    className={`text-[13px] font-medium ${frameworkBadgeClass(fw.framework_name)}`}
                                  >
                                    {fw.framework_name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
                          <span className={`text-4xl font-bold tabular-nums ${trustColor}`}>{trustScore}</span>
                          <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{trustLabel}</span>
                        </div>
                      </div>
                      <p className="text-[13px] text-muted-foreground text-center">
                        {trustScore >= 80
                          ? (isNb ? "Godt egnet for de fleste bruksområder" : "Suitable for most use cases")
                          : trustScore >= 50
                            ? (isNb ? "Egnet for standard bruksområder" : "Suitable for standard use cases")
                            : (isNb ? "Begrenset egnethet" : "Limited suitability")}
                      </p>
                      <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{isNb ? "Sist oppdatert:" : "Last updated:"} {lastUpdated}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata stripe */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border border-border">
                    {[
                      { label: "ORG.NR", value: companyProfile?.org_number || "–" },
                      { label: isNb ? "BRANSJE" : "INDUSTRY", value: companyProfile?.industry || "–" },
                      { label: isNb ? "KATEGORI" : "CATEGORY", value: asset.vendor_category || asset.category || "–" },
                      { label: isNb ? "NETTSIDE" : "WEBSITE", value: companyProfile?.domain || "–" },
                    ].map(item => (
                      <div key={item.label} className="bg-card px-4 py-3">
                        <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                        <p className="text-sm font-medium text-foreground mt-0.5 truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>

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
                                        : (isNb ? "Egenerklæring" : "Self-declared");

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
                                        <span className="text-[13px] text-muted-foreground">{verificationLabel}</span>
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
                        { value: evaluation ? `${evaluation.implementedCount + evaluation.partialCount}/${evaluation.allControls.length}` : "0/0", label: isNb ? "Modenhet per kontrollområde" : "Maturity by control areas", color: "text-warning" },
                        { value: String(certsCount), label: isNb ? "Sertifiseringer" : "Certifications", color: "" },
                        { value: dpaOk ? "✓" : "–", label: dpaOk ? "DPA OK" : "DPA", color: dpaOk ? "text-success" : "" },
                      ].map((item, i) => (
                        <div key={i} className="text-center py-4 px-2 rounded-xl bg-muted/30 border border-border/50">
                          <p className={`text-xl font-bold ${item.color || "text-foreground"}`}>{item.value}</p>
                          <p className="text-[13px] text-muted-foreground mt-0.5">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="border-t border-border" />

                  {/* ── Dokumentasjon og bevis ── */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {isNb ? "DOKUMENTASJON OG BEVIS" : "DOCUMENTATION AND EVIDENCE"}
                    </h3>
                    <div className="space-y-2.5">
                      {[
                        { key: "policies", icon: FileText, label: isNb ? "Policies" : "Policies", count: docsCount, color: "text-primary", items: policies },
                        { key: "certs", icon: Award, label: isNb ? "Sertifiseringer" : "Certifications", count: certsCount, color: "text-purple-500", items: certs },
                        { key: "datahandling", icon: Eye, label: isNb ? "Datahåndtering" : "Data handling", count: 0, color: "text-primary", items: [] as any[] },
                        { key: "documents", icon: FileText, label: isNb ? "Dokumenter" : "Documents", count: 0, color: "text-primary", items: [] as any[] },
                      ].map(item => (
                        <div key={item.key}>
                          <button
                            onClick={() => setExpandedDoc(expandedDoc === item.key ? null : item.key)}
                            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl border border-border hover:bg-muted/40 hover:border-border/80 transition-all text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className={`h-4 w-4 ${item.color}`} />
                              <span className="text-sm font-medium text-foreground">{item.label}</span>
                              {item.count > 0 && (
                                <Badge variant="secondary" className="text-[13px] rounded-full px-2 font-semibold">{item.count}</Badge>
                              )}
                            </div>
                            {expandedDoc === item.key ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            )}
                          </button>
                          {expandedDoc === item.key && (
                            <div className="mt-1.5 ml-5 space-y-1">
                              {item.items.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-4 py-3">
                                  {isNb ? "Ingen registrert ennå" : "None registered yet"}
                                </p>
                              ) : (
                                item.items.map((doc: any) => (
                                  <div key={doc.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-muted/30 border border-border/50">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                      <span className="text-xs font-medium text-foreground truncate">{doc.file_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {doc.status && (
                                        <Badge
                                          variant={doc.status === "verified" ? "default" : "outline"}
                                          className="text-[13px]"
                                        >
                                          {doc.status === "verified" ? (isNb ? "Verifisert" : "Verified") : doc.status}
                                        </Badge>
                                      )}
                                      {doc.expiry_date && (
                                        <span className="text-[13px] text-muted-foreground">
                                          {isNb ? "Utløper" : "Expires"} {new Date(doc.expiry_date).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

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
                    {isNb ? "Publiser nå" : "Publish now"}
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
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-[13px] text-muted-foreground">{isNb ? "Visninger" : "Views"}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-[13px] text-muted-foreground">{isNb ? "Unike besøkende" : "Unique visitors"}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">∞</p>
                  <p className="text-[13px] text-muted-foreground">{isNb ? "Timer spart" : "Hours saved"}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {isNb
                  ? "Du vil motta statistikk om profilvisninger direkte i dashboardet ditt."
                  : "You'll receive profile view statistics directly in your dashboard."}
              </p>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => {
                  navigator.clipboard.writeText(`https://${publicUrl}`);
                  toast.success(isNb ? "Lenke kopiert!" : "Link copied!");
                }}>
                  <Copy className="h-4 w-4" />
                  {isNb ? "Kopier lenke" : "Copy link"}
                </Button>
                <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90" onClick={() => {
                  setPublishDialogOpen(false);
                  setPublishStep("confirm");
                }}>
                  <CheckCircle2 className="h-4 w-4" />
                  {isNb ? "Ferdig" : "Done"}
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
    </SidebarProvider>
  );
};

export default TrustCenterProfile;
