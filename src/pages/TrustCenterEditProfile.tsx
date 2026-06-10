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
  Shield, ArrowLeft, Eye, EyeOff, CheckCircle2, AlertTriangle, Link2,
  Copy, Check, Pencil, Upload, Globe, Lock, Layers, Users, BookCheck,
  ChevronDown, ChevronUp, Plus, Building2, Scale, FileText, Award,
  Info, Settings, Package, Settings2, Database, MinusCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import type { ControlArea } from "@/lib/trustControlDefinitions";
import { toast } from "sonner";
import { CompanyInfoForm } from "@/components/company/CompanyInfoForm";
import { frameworkChipClass } from "@/lib/frameworkChipClass";

import { ContactsSection } from "@/components/trust-center/edit/ContactsSection";
import { AIVendorsSection } from "@/components/trust-center/edit/AIVendorsSection";
import { DocumentationSection } from "@/components/trust-center/edit/DocumentationSection";
import { SubprocessorsSection } from "@/components/trust-center/edit/SubprocessorsSection";
import { BrandingSection } from "@/components/trust-center/edit/BrandingSection";
import { PublishStickyBar } from "@/components/trust-center/edit/PublishStickyBar";
import { SavedIndicator } from "@/components/trust-center/edit/SavedIndicator";
import { EditActiveFrameworksDialog } from "@/components/regulations/EditActiveFrameworksDialog";
import { frameworks as frameworkDefs } from "@/lib/frameworkDefinitions";

const AREA_CONFIG: { area: ControlArea; icon: typeof Shield; labelNb: string; labelEn: string }[] = [
  { area: "governance", icon: Shield, labelNb: "Styring", labelEn: "Governance" },
  { area: "operations", icon: Lock, labelNb: "Drift og sikkerhet", labelEn: "Drift og sikkerhet" },
  { area: "privacy", icon: Globe, labelNb: "Personvern og datahåndtering", labelEn: "Privacy & Data Handling" },
  { area: "vendor", icon: Layers, labelNb: "Tredjepart og verdikjede", labelEn: "Third-Party & Supply Chain" },
];

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

  const { data: frameworks = [] } = useQuery({
    queryKey: ["selected-frameworks-edit"],
    queryFn: async () => {
      const { data } = await supabase.from("selected_frameworks").select("framework_id, framework_name").eq("is_selected", true);
      return data || [];
    },
  });


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
              <p className="text-sm text-muted-foreground mt-1">
                {isNb
                  ? "Lara har generert din profil basert på offentlig informasjon. Bekreft eller juster forslagene under, og last opp egne dokumenter."
                  : "Lara has generated your profile from public information. Confirm or adjust the suggestions below, and upload your own documents."}
              </p>
            </div>

            {/* Trust Center URL — flyttet opp */}
            <Card className="p-4 space-y-3 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 text-sm">
                <Link2 className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">{isNb ? "Din Trust Center URL" : "Your Trust Center URL"}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isNb
                  ? "Dette er din offentlige lenke til din Trust Center-profil. Kopier og del med kunder og partnere."
                  : "This is your public link to your Trust Center profile. Copy and share with customers and partners."}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 min-w-0">
                  <code className="text-sm font-mono text-foreground truncate block">{publicUrl}</code>
                </div>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate("/trust-center/profile")}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleCopyUrl}>
                  {copiedUrl ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </Card>

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
            {/* SECTION: Etterlevelse (regelverk + modenhet) */}
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
                      ? "Velg hvilke regelverk som skal vises på profilen. Modenhet beregnes ut fra de samme regelverkene."
                      : "Choose which frameworks appear on the profile. Maturity is calculated from the same frameworks."}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => navigate("/regulations")} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {isNb ? "Legg til" : "Add"}
                  </Button>
                </div>
              </div>


              {/* Subsection 1: Regelverk i scope */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {isNb ? "Regelverk og standarder" : "Frameworks & standards"}
                </h3>

                {frameworks.length === 0 ? (
                  <Card className="p-5 text-center">
                    <p className="text-sm text-muted-foreground italic mb-3">
                      {isNb ? "Ingen regelverk valgt ennå" : "No frameworks selected yet"}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => navigate("/regulations")}>
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
                                  hidden ? "text-muted-foreground/50 line-through" : "text-foreground"
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
                    <div className="px-4 py-2.5 border-t border-border bg-muted/20">
                      <p className="text-xs text-muted-foreground">
                        {isNb ? "Skjulte regelverk teller fortsatt i modenhet, men vises ikke for besøkende." : "Hidden frameworks still count toward maturity but are not shown to visitors."}
                      </p>
                    </div>

                  </Card>
                )}
              </div>

              {/* Subsection 2: Modenhet per kontrollområde */}
              <div id="security" className="space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {isNb ? "Modenhet per kontrollområde" : "Maturity by control area"}
                </h3>

                <div className="space-y-2">
                  {AREA_CONFIG.map(({ area, icon: Icon, labelNb: lNb, labelEn: lEn }) => {
                    const score = evaluation?.areaScore(area) ?? 0;
                    const isExpanded = expandedArea === area;
                    const areaControls = evaluation?.grouped[area] ?? [];

                    return (
                      <Card key={area} className="overflow-hidden">
                        <button
                          onClick={() => setExpandedArea(isExpanded ? null : area)}
                          className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">{isNb ? lNb : lEn}</span>
                              <span className="text-xs text-muted-foreground">· {areaControls.length} {isNb ? "kontroller" : "controls"}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-semibold tabular-nums ${score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive"}`}>{score}%</span>
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </div>
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${score >= 75 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive"}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </button>
                        {isExpanded && (() => {
                          const implementedControls = areaControls.filter(c =>
                            c.status === "implemented" || c.verificationSource === "vendor_verified" || c.verificationSource === "third_party_verified"
                          );
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
                          if (implementedControls.length === 0) {
                            return (
                              <div className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground bg-muted/10">
                                {isNb
                                  ? "Ingen implementerte kontrollpunkter ennå i dette området."
                                  : "No implemented controls yet in this area."}
                              </div>
                            );
                          }
                          return (
                            <div className="border-t border-border bg-muted/10">
                              <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border/60">
                                {isNb
                                  ? `${implementedControls.length} av ${areaControls.length} kontrollpunkter implementert eller verifisert. Velg hvilke som vises på Trust Profile.`
                                  : `${implementedControls.length} of ${areaControls.length} controls implemented or verified. Choose which appear on your Trust Profile.`}
                              </div>
                              <ul className="divide-y divide-border">
                                {implementedControls.map(control => {
                                  const hidden = hiddenControls.includes(control.key);
                                  const verified = control.verificationSource === "vendor_verified" || control.verificationSource === "third_party_verified";
                                  return (
                                    <li key={control.key} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20">
                                      <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${hidden ? "text-muted-foreground/40" : verified ? "text-success" : "text-success/70"}`} />
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${hidden ? "text-muted-foreground/60 line-through" : "text-foreground"}`}>
                                          {isNb ? control.labelNb : control.labelEn}
                                        </p>
                                        {(control as any).descriptionNb && (
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {isNb ? (control as any).descriptionNb : (control as any).descriptionEn}
                                          </p>
                                        )}
                                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                          {verified
                                            ? (isNb ? "Verifisert med dokumentasjon" : "Verified with documentation")
                                            : (isNb ? "Implementert" : "Implemented")}
                                        </span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => toggleControlVisibility(control.key)}
                                        className="gap-1.5 shrink-0 text-muted-foreground hover:text-foreground"
                                      >
                                        {hidden ? (
                                          <><EyeOff className="h-3.5 w-3.5" />{isNb ? "Vis" : "Show"}</>
                                        ) : (
                                          <><Eye className="h-3.5 w-3.5" />{isNb ? "Skjul" : "Hide"}</>
                                        )}
                                      </Button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          );
                        })()}
                      </Card>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Tredjepartsleverandører */}
            <SubprocessorsSection asset={asset} />

            {/* Dokumentasjon (opplastingsflyt) */}
            <DocumentationSection asset={asset} />

            {/* Spacer for sticky bar */}
            <div className="h-24" />
          </div>

          {/* Sticky publish bar */}
          <PublishStickyBar
            readinessPercent={trustScore}
            passedCount={trustScore}
            totalCount={100}
            lastEditedAt={(asset?.metadata as any)?.last_edited_at || asset?.updated_at}
            lastPublishedAt={(asset?.metadata as any)?.last_published_at}
            onPreview={() => navigate("/trust-center/profile")}
            onPublish={async () => {
              if (!asset?.id) return;
              const nowIso = new Date().toISOString();
              const currentMeta = (asset?.metadata || {}) as Record<string, any>;
              const nextMeta = { ...currentMeta, last_published_at: nowIso };
              await supabase.from("assets").update({ metadata: nextMeta as any }).eq("id", asset.id);
              queryClient.invalidateQueries({ queryKey: ["self-asset-edit"] });
              queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
              toast.success(isNb ? "Trust Profile publisert" : "Trust Profile published");
            }}
          />
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
              ? "Navn, org.nr, kontaktperson og bransje må være utfylt for å kunne publisere."
              : "Name, org number, contact person and industry must be filled to publish.",
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
        whyTitle={isNb ? "Readiness-indikatoren" : "The readiness indicator"}
        whyDescription={
          isNb
            ? "Readiness-indikatoren øverst viser deg hvor langt du er fra å kunne publisere. Den sjekker selskapsinformasjon, kontrollområder og rammeverk. Grønn betyr klar for publisering."
            : "The readiness indicator at the top shows how far you are from being able to publish. It checks company information, control areas, and frameworks. Green means ready to publish."
        }
        stepsHeading={isNb ? "Anbefalt rekkefølge" : "Recommended order"}
        steps={[
          { text: isNb ? "Fyll ut selskapsinformasjon (navn, org.nr, kontaktperson)" : "Fill in company info (name, org number, contact)" },
          { text: isNb ? "Beskriv hva virksomheten leverer" : "Describe what your company delivers" },
          { text: isNb ? "Besvar egenerklæringer i alle fire kontrollområder" : "Answer self-assessments in all four control areas" },
          { text: isNb ? "Gå til forhåndsvisning og publiser" : "Go to preview and publish" },
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
    </SidebarProvider>
  );
};

export default TrustCenterEditProfile;
