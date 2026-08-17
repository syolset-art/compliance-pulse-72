import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePageHelpListener } from "@/hooks/usePageHelpListener";
import { ContextualHelpPanel } from "@/components/shared/ContextualHelpPanel";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


import {
  Shield, ArrowLeft, Eye, EyeOff, CheckCircle2, AlertTriangle, XCircle, Link2,
  Copy, Check, Pencil, Upload, Globe, Lock, Layers, Users, BookCheck,
  ChevronDown, ChevronUp, Plus, Building2, Scale, FileText, Award,
  Info, Settings, Package, Settings2, Database, MinusCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import type { ControlArea } from "@/lib/trustControlDefinitions";
import { CONTROL_AREAS } from "@/lib/controlAreas";
import { toast } from "sonner";
import { CompanyInfoForm } from "@/components/company/CompanyInfoForm";
import { frameworkChipClass } from "@/lib/frameworkChipClass";

import { ContactsSection } from "@/components/trust-center/edit/ContactsSection";
import { AIVendorsSection } from "@/components/trust-center/edit/AIVendorsSection";

import { ResourcesSection } from "@/components/trust-center/edit/ResourcesSection";
import { SubprocessorsSection } from "@/components/trust-center/edit/SubprocessorsSection";
import { BrandingSection } from "@/components/trust-center/edit/BrandingSection";
import { SavedIndicator } from "@/components/trust-center/edit/SavedIndicator";
import { EditActiveFrameworksDialog } from "@/components/regulations/EditActiveFrameworksDialog";
import { frameworks as frameworkDefs } from "@/lib/frameworkDefinitions";

const AREA_CONFIG: { area: ControlArea; icon: typeof Shield; labelNb: string; labelEn: string }[] =
  CONTROL_AREAS.map((a) => ({
    area: a.key as ControlArea,
    icon: a.icon as typeof Shield,
    labelNb: a.labelNb,
    labelEn: a.labelEn,
  }));

const AREA_DEMO_FLOOR: Record<string, number> = {
  governance: 78,
  operations: 62,
  identityAccess: 71,
  privacy: 55,
  vendor: 28,
};

const scoreLabel = (score: number, isNb: boolean) =>
  score >= 67 ? (isNb ? "Høy" : "High")
  : score >= 35 ? (isNb ? "Middels" : "Medium")
  : (isNb ? "Lav" : "Low");
const scoreTone = (score: number) =>
  score >= 67 ? { text: "text-success", bg: "bg-success" }
  : score >= 35 ? { text: "text-warning", bg: "bg-warning" }
  : { text: "text-destructive", bg: "bg-destructive" };

const BUSINESS_AREAS = [
  "Kommunikasjon", "HR og personell", "Sikkerhet", "Økonomi og regnskap", "Drift og IT",
  "Salg og markedsføring", "Juridisk og compliance", "Kundeservice", "Lagring og backup", "Utdanning",
];

const SERVICE_CATEGORIES = [
  { key: "saas", labelNb: "SaaS / Skybasert programvare", labelEn: "SaaS / Cloud Software" },
  { key: "digital", labelNb: "Digitale tjenester", labelEn: "Digital Services" },
  { key: "consulting", labelNb: "Konsulent / Rådgivning", labelEn: "Consulting / Advisory" },
  { key: "infra", labelNb: "Infrastruktur / Hosting", labelEn: "Infrastructure / Hosting" },
];

const TrustCenterEditProfile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [expandedArea, setExpandedArea] = useState<ControlArea | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  
  const setHelpOpenCb = useCallback((v: boolean) => setHelpOpen(v), []);
  usePageHelpListener(setHelpOpenCb);

  const { data: asset, isLoading } = useQuery({
    queryKey: ["self-asset-edit"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assets").select("*").eq("asset_type", "self").order("updated_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: companyProfile } = useQuery({
    queryKey: ["company_profile_edit"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_profile").select("*").order("updated_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: allFrameworkRows = [] } = useQuery({
    queryKey: ["selected-frameworks-edit"],
    queryFn: async () => {
      const { data } = await supabase.from("selected_frameworks").select("*");
      return data || [];
    },
  });
  const frameworks = useMemo(
    () => allFrameworkRows.filter((r: any) => r.is_selected),
    [allFrameworkRows]
  );
  const activeFrameworkIds = useMemo(
    () => new Set<string>(frameworks.map((r: any) => r.framework_id)),
    [frameworks]
  );
  const [showFrameworksSheet, setShowFrameworksSheet] = useState(false);
  const [updatingFrameworkId, setUpdatingFrameworkId] = useState<string | null>(null);

  const handleToggleFramework = async (frameworkId: string, currentlyActive: boolean) => {
    const existing = allFrameworkRows.find((f: any) => f.framework_id === frameworkId);
    setUpdatingFrameworkId(frameworkId);
    try {
      if (existing) {
        const { error } = await supabase
          .from("selected_frameworks")
          .update({ is_selected: !currentlyActive })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const fw = frameworkDefs.find((f) => f.id === frameworkId);
        if (!fw) return;
        const { error } = await supabase.from("selected_frameworks").insert({
          framework_id: fw.id,
          framework_name: fw.name,
          category: fw.category,
          is_mandatory: fw.isMandatory || false,
          is_recommended: fw.isRecommended || false,
          is_selected: true,
        });
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["selected-frameworks-edit"] });
      toast.success(
        !currentlyActive
          ? isNb ? "Regelverk aktivert" : "Framework activated"
          : isNb ? "Regelverk fjernet" : "Framework removed"
      );
    } catch (e) {
      console.error(e);
      toast.error(isNb ? "Kunne ikke oppdatere" : "Could not update");
    } finally {
      setUpdatingFrameworkId(null);
    }
  };


  const evaluation = useTrustControlEvaluation(asset?.id || "");

  const assetMeta = (asset?.metadata || {}) as Record<string, any>;
  const selectedAreasEarly: string[] = assetMeta.business_areas || [];
  const selectedServiceCatsEarly: string[] = assetMeta.service_categories || [];


  const slug = useMemo(() => {
    const base = (companyProfile?.name || asset?.name || "")
      .toLowerCase().replace(/[^a-z0-9æøå\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 40);
    const suffix = companyProfile?.org_number ? `-${companyProfile.org_number.replace(/\s/g, "").slice(-4)}` : "";
    return `${base}${suffix}`;
  }, [companyProfile?.name, asset?.name, companyProfile?.org_number]);

  const publicUrl = `https://trust.mynder.com/${slug}`;
  const trustScore = evaluation?.trustScore ?? 0;

  const assetMeta2 = (asset?.metadata || {}) as Record<string, any>;
  const sectionCompleteness = useMemo(() => {
    const areas: string[] = assetMeta2.business_areas || [];
    const companyChecks = [
      !!companyProfile?.name,
      !!companyProfile?.org_number,
      !!companyProfile?.compliance_officer || !!companyProfile?.dpo_name,
      areas.length > 0,
    ];
    return {
      company: { done: companyChecks.filter(Boolean).length, total: companyChecks.length },
      regulations: { done: frameworks.length > 0 ? 1 : 0, total: 1 },
    };
  }, [companyProfile, assetMeta2, frameworks]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedUrl(true);
    toast.success(isNb ? "Lenke kopiert" : "Link copied");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (isLoading) {
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

  if (!asset) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 p-6 text-center py-20">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">{isNb ? "Ingen Trust Profile funnet" : "No Trust Profile found"}</h2>
            <Button className="mt-4" onClick={() => navigate("/onboarding")}>Start onboarding</Button>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const meta = (asset?.metadata || {}) as Record<string, any>;
  const selectedAreas: string[] = meta.business_areas || [];
  const selectedServiceCats: string[] = meta.service_categories || [];
  
  const customServiceType: string = meta.custom_service_type || "";
  const serviceDescription: string = meta.service_description || "";




  const frameworkBadgeClass = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("gdpr")) return "bg-primary/10 text-primary border-primary/20 dark:bg-primary/30 dark:text-primary";
    if (n.includes("personopp")) return "bg-primary/10 text-primary border-primary/20 dark:bg-primary/30 dark:text-primary";
    if (n.includes("iso")) return "bg-status-closed/10 text-status-closed border-status-closed/20 dark:bg-status-closed/30 dark:text-status-closed";
    return "bg-muted text-muted-foreground border-border";
  };

  const isStandard = (name: string) => {
    const n = name.toLowerCase();
    return n.includes("iso") || n.includes("soc");
  };

  const hiddenFrameworkIds: string[] = Array.isArray(meta.hidden_framework_ids) ? meta.hidden_framework_ids : [];

  const toggleFrameworkVisibility = async (frameworkId: string) => {
    if (!asset?.id) return;
    const currentMeta = (asset?.metadata || {}) as Record<string, any>;
    const current: string[] = Array.isArray(currentMeta.hidden_framework_ids) ? currentMeta.hidden_framework_ids : [];
    const next = current.includes(frameworkId)
      ? current.filter((id) => id !== frameworkId)
      : [...current, frameworkId];
    const newMeta = { ...currentMeta, hidden_framework_ids: next };
    await supabase.from("assets").update({ metadata: newMeta } as any).eq("id", asset.id);
    queryClient.invalidateQueries({ queryKey: ["self-asset-edit"] });
    queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-11">
          <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            {/* Page Header */}
            <div>
              <button
                onClick={() => navigate("/trust-center/profile")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Trust Profile
              </button>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">
                  {isNb ? "Rediger Trust Profile" : "Edit Trust Profile"}
                </h1>
                <SavedIndicator lastEditedAt={(asset?.metadata as any)?.last_edited_at || asset?.updated_at} />
              </div>
            </div>


            {/* ═══════════════════════════════════════════ */}
            {/* SECTION: Virksomhet */}
            {/* ═══════════════════════════════════════════ */}
            <section id="company" className="space-y-5">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">
                  {isNb ? "Virksomhet" : "Company"}
                </h2>
                <Badge variant={sectionCompleteness.company.done === sectionCompleteness.company.total ? "action" : "secondary"} className="text-sm ml-auto">
                  {sectionCompleteness.company.done}/{sectionCompleteness.company.total}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isNb
                  ? "Grunnleggende informasjon om din virksomhet."
                  : "Basic information about your company."}
              </p>

              <CompanyInfoForm defaultEditing showEditControls hidePartner />

            </section>

            {/* Profilbanner / cover */}
            <BrandingSection asset={asset} />

            {/* Kontaktinformasjon */}
            <ContactsSection asset={asset} />


            {/* ═══════════════════════════════════════════ */}
            {/* SECTION: Modenhet per kontrollområde         */}
            {/* ═══════════════════════════════════════════ */}
            <section id="security" className="space-y-5">
              <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <h2 className="text-base font-semibold text-foreground">
                      {isNb ? "Modenhet per kontrollområde" : "Maturity by control area"}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    {isNb
                      ? "Egenerklæringer og verifiserte kontroller fordelt på de fem kontrollområdene som utgjør din Trust Score."
                      : "Self-assessments and verified controls across the five control areas that make up your Trust Score."}
                  </p>
                </div>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className="text-sm text-muted-foreground">Trust Score</span>
                  <span className={`text-lg font-bold tabular-nums ${trustScore >= 75 ? "text-success" : trustScore >= 50 ? "text-warning" : "text-destructive"}`}>{trustScore}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AREA_CONFIG.map(({ area, icon: Icon, labelNb: lNb, labelEn: lEn }) => {
                  const rawScore = evaluation?.areaScore(area) ?? 0;
                  const score = Math.max(rawScore, AREA_DEMO_FLOOR[area] ?? 0);
                  const tone = scoreTone(score);
                  const label = scoreLabel(score, isNb);
                  const isExpanded = expandedArea === area;
                  const areaControls = evaluation?.grouped[area] ?? [];
                  const hiddenControls: string[] = (asset?.metadata as any)?.hidden_controls ?? [];
                  const toggleControlVisibility = async (key: string) => {
                    const currentMeta = (asset?.metadata || {}) as Record<string, any>;
                    const current: string[] = currentMeta.hidden_controls ?? [];
                    const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
                    const newMeta = { ...currentMeta, hidden_controls: next };
                    await supabase.from("assets").update({ metadata: newMeta } as any).eq("id", asset!.id);
                    queryClient.invalidateQueries({ queryKey: ["self-asset-edit"] });
                    queryClient.invalidateQueries({ queryKey: ["asset-for-trust-eval"] });
                  };

                  return (
                    <div key={area} className="rounded-lg border border-border overflow-hidden bg-card">
                      <button
                        onClick={() => setExpandedArea(isExpanded ? null : area)}
                        className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{isNb ? lNb : lEn}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold uppercase tracking-wide ${tone.text}`}>{label}</span>
                            {isExpanded
                              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${tone.bg} transition-all duration-500`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </button>

                      {isExpanded && areaControls.length > 0 && (
                        <div className="border-t border-border">
                          {areaControls.map((control) => {
                            const hidden = hiddenControls.includes(control.key);
                            const statusIcon = control.status === "implemented"
                              ? <CheckCircle2 className={`h-4 w-4 ${hidden ? "text-muted-foreground/40" : "text-success"}`} />
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
                              <div key={control.key} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0 group">
                                <div className="flex items-center gap-3 min-w-0">
                                  {statusIcon}
                                  <span className={`text-sm ${hidden ? "text-muted-foreground/60 line-through" : "text-foreground"}`}>
                                    {isNb ? control.labelNb : control.labelEn}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge variant="outline" className={`text-sm ${statusBadgeClass}`}>
                                    {statusBadgeLabel}
                                  </Badge>
                                  {verificationLabel && <span className="text-sm text-muted-foreground">{verificationLabel}</span>}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => toggleControlVisibility(control.key)}
                                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    {hidden ? (
                                      <><EyeOff className="h-3 w-3 mr-1" />{isNb ? "Vis" : "Show"}</>
                                    ) : (
                                      <><Eye className="h-3 w-3 mr-1" />{isNb ? "Skjul" : "Hide"}</>
                                    )}
                                  </Button>
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

            {/* ═══════════════════════════════════════════ */}
            {/* SECTION: Etterlevelse (regelverk)            */}
            {/* ═══════════════════════════════════════════ */}
            <section id="frameworks-scope" className="space-y-5">
              <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    <h2 className="text-base font-semibold text-foreground">
                      {isNb ? "Etterlevelse" : "Compliance"}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    {isNb
                      ? "Velg hvilke regelverk som skal med i modenhets beregningen og synlig profilen."
                      : "Choose which frameworks are included in the maturity calculation and visible on the profile."}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setShowFrameworksSheet(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {isNb ? "Legg til" : "Add"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {isNb ? "Regelverk og standarder" : "Frameworks & standards"}
                </h3>

                {frameworks.length === 0 ? (
                  <Card className="p-5 text-center">
                    <p className="text-sm text-muted-foreground italic mb-3">
                      {isNb ? "Ingen regelverk valgt ennå" : "No frameworks selected yet"}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setShowFrameworksSheet(true)}>
                      {isNb ? "Gå til Regelverk" : "Go to Frameworks"}
                    </Button>
                  </Card>
                ) : (
                  <Card className="overflow-hidden">
                    <ul className="divide-y divide-border">
                      {frameworks.map((fw: any) => {
                        const standard = isStandard(fw.framework_name);
                        const Icon = standard ? BookCheck : Scale;
                        const hidden = hiddenFrameworkIds.includes(fw.framework_id);
                        return (
                          <li 
                            key={fw.framework_id} 
                            className={cn(
                              "flex items-center justify-between gap-3 px-4 py-3 transition-colors",
                              hidden ? "bg-muted/40" : "hover:bg-muted/30"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                hidden ? "bg-muted" : "bg-primary/10"
                              )}>
                                <Icon className={cn(
                                  "h-4 w-4",
                                  hidden ? "text-muted-foreground/40" : "text-primary"
                                )} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className={cn(
                                  "text-sm font-medium truncate",
                                  hidden ? "text-muted-foreground/70" : "text-foreground"
                                )}>
                                  {fw.framework_name}
                                </span>
                                <span className={cn(
                                  "text-xs",
                                  hidden ? "text-muted-foreground/40" : "text-muted-foreground"
                                )}>
                                  {standard ? (isNb ? "Standard" : "Standard") : (isNb ? "Regelverk" : "Regulation")}
                                  {hidden && (
                                    <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground/60">
                                      <EyeOff className="h-3 w-3" />
                                      {isNb ? "Skjult på profilen" : "Hidden from profile"}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={hidden ? "secondary" : "ghost"}
                              onClick={() => toggleFrameworkVisibility(fw.framework_id)}
                              className={cn(
                                "gap-1.5 shrink-0",
                                hidden 
                                  ? "text-foreground hover:text-foreground bg-background border border-border shadow-sm" 
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {hidden ? (
                                <>
                                  <Eye className="h-3.5 w-3.5" />
                                  {isNb ? "Vis" : "Show"}
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3.5 w-3.5" />
                                  {isNb ? "Skjul" : "Hide"}
                                </>
                              )}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                )}
              </div>
            </section>


            {/* Ressurser (sertifikater, policyer, retningslinjer) */}
            <ResourcesSection asset={asset} />

            {/* Tredjepartsleverandører */}
            <SubprocessorsSection asset={asset} />


            {/* Powered By Mynder — footer ingress */}
            <div className="border-t border-border pt-6 pb-2 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Powered By Mynder
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isNb
                  ? "Trust Profile er virksomhetens gjenbrukbare Trust Center – en ny måte å utveksle compliance-informasjon på. Vis modenhet i etterlevelse av regelverk, implementert eller verifisert, og gjør det enklere for både deg å bevise og kundene dine å kontrollere."
                  : "Trust Profile is your company's reusable Trust Center — a new way to exchange compliance information. Show maturity in regulatory compliance, implemented or verified, and make it easier for both you to prove and your customers to verify."}
              </p>
            </div>

          </div>
        </main>
      </div>

      <ContextualHelpPanel
        open={helpOpen}
        onOpenChange={setHelpOpen}
        icon={Pencil}
        title={isNb ? "Rediger Trust Profile" : "Edit Trust Profile"}
        description={
          isNb
            ? "Her fyller du ut egenerklæringer for de fire kontrollområdene som utgjør din Trust Score. Jo mer komplett profilen er, desto høyere tillit kan kunder og partnere ha til organisasjonen din."
            : "Here you fill in self-assessments for the four control areas that make up your Trust Score. The more complete the profile, the more trust customers and partners can place in your organization."
        }
        itemsHeading={isNb ? "Hva påvirker Trust Score?" : "What affects Trust Score?"}
        items={[
          {
            icon: Building2,
            title: isNb ? "Selskapsinformasjon" : "Company information",
            description: isNb
              ? "Navn, org.nr, kontaktperson og bransje må være utfylt for en komplett profil."
              : "Name, org number, contact person and industry must be filled for a complete profile.",
          },
          {
            icon: Shield,
            title: isNb ? "Kontrollområder" : "Control areas",
            description: isNb
              ? "Hver egenerklæring i de fire områdene bidrar direkte til Trust Score."
              : "Each self-assessment in the four areas directly contributes to the Trust Score.",
          },
          {
            icon: Scale,
            title: isNb ? "Regelverk" : "Regulations",
            description: isNb
              ? "Valgte rammeverk (GDPR, ISO 27001, NIS2) vises i profilen og styrker tilliten."
              : "Selected frameworks (GDPR, ISO 27001, NIS2) are shown in the profile and strengthen trust.",
          },
          {
            icon: FileText,
            title: isNb ? "Dokumentasjon" : "Documentation",
            description: isNb
              ? "Opplastede policyer og sertifiseringer gir tyngde til egenerklæringene."
              : "Uploaded policies and certifications add weight to the self-assessments.",
          },
        ]}
        whyTitle={isNb ? "Profilkompletthet" : "Profile completeness"}
        whyDescription={
          isNb
            ? "Indikatoren øverst viser deg hvor komplett profilen din er. Den sjekker selskapsinformasjon, kontrollområder og rammeverk. Grønn betyr godt utfylt."
            : "The indicator at the top shows how complete your profile is. It checks company information, control areas, and frameworks. Green means well completed."
        }
        stepsHeading={isNb ? "Anbefalt rekkefølge" : "Recommended order"}
        steps={[
          { text: isNb ? "Fyll ut selskapsinformasjon (navn, org.nr, kontaktperson)" : "Fill in company info (name, org number, contact)" },
          { text: isNb ? "Beskriv hva virksomheten leverer" : "Describe what your company delivers" },
          { text: isNb ? "Besvar egenerklæringer i alle fire kontrollområder" : "Answer self-assessments in all four control areas" },
          { text: isNb ? "Gå til forhåndsvisning" : "Go to preview" },
        ]}
        actions={[
          {
            icon: Eye,
            title: isNb ? "Forhåndsvis profilen" : "Preview profile",
            description: isNb ? "Se hvordan profilen ser ut for andre" : "See how the profile looks to others",
            onClick: () => navigate("/trust-center/profile"),
          },
          {
            icon: Settings,
            title: isNb ? "Detaljinnstillinger" : "Detail settings",
            description: isNb ? "Avanserte innstillinger og basisdata" : "Advanced settings and base data",
            onClick: () => navigate(`/assets/${asset?.id}`),
          },
        ]}
        laraSuggestions={[
          {
            label: isNb ? "Hjelp meg med kontrollområdene" : "Help me with control areas",
            message: isNb ? "Hjelp meg å forstå og fylle ut egenerklæringene i de fire kontrollområdene i Trust Profile" : "Help me understand and fill in the self-assessments in the four Trust Profile control areas",
          },
          {
            label: isNb ? "Hva trengs for å publisere?" : "What's needed to publish?",
            message: isNb ? "Hva må jeg ha på plass for å kunne publisere Trust Profilen min?" : "What do I need to have in place to publish my Trust Profile?",
          },
          {
            label: isNb ? "Forbedre Trust Score" : "Improve Trust Score",
            message: isNb ? "Gi meg konkrete tips for å forbedre Trust Score i min profil" : "Give me concrete tips to improve the Trust Score in my profile",
          },
        ]}
      />
      <EditActiveFrameworksDialog
        open={showFrameworksSheet}
        onOpenChange={setShowFrameworksSheet}
        activeFrameworkIds={activeFrameworkIds}
        onToggle={handleToggleFramework}
        updatingId={updatingFrameworkId}
      />
    </SidebarProvider>
  );
};

export default TrustCenterEditProfile;
