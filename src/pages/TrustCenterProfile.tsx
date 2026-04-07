import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield, Eye, Share2, Settings, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronUp, Clock, MessageSquare, FileText, Award, Globe,
  Lock, Layers, Users, Link2, Code2, Copy, Check, Building2, Info, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";

import type { ControlArea } from "@/lib/trustControlDefinitions";

const AREA_CONFIG: { area: ControlArea; icon: typeof Shield; labelEn: string; labelNb: string }[] = [
  { area: "governance", icon: Shield, labelEn: "Governance & Accountability", labelNb: "Governance & Accountability" },
  { area: "risk_compliance", icon: Lock, labelEn: "Security", labelNb: "Security" },
  { area: "security_posture", icon: Globe, labelEn: "Privacy & Data Handling", labelNb: "Privacy & Data Handling" },
  { area: "supplier_governance", icon: Layers, labelEn: "Third-Party & Supply Chain", labelNb: "Third-Party & Supply Chain" },
];

const TrustCenterProfile = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [activeTab, setActiveTab] = useState<"preview" | "publish">("preview");
  const [expandedArea, setExpandedArea] = useState<ControlArea | null>(null);
  const [publishSubTab, setPublishSubTab] = useState<"link" | "vendor" | "badge">("link");
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: asset, isLoading } = useQuery({
    queryKey: ["self-asset-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("asset_type", "self")
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

  const { data: docsCount = 0 } = useQuery({
    queryKey: ["vendor-documents-count-tc", asset?.id],
    queryFn: async () => {
      const { data } = await supabase.from("vendor_documents").select("id").eq("asset_id", asset!.id);
      return data?.length || 0;
    },
    enabled: !!asset?.id,
  });

  const { data: certsCount = 0 } = useQuery({
    queryKey: ["certs-count-tc", asset?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_documents")
        .select("id")
        .eq("asset_id", asset!.id)
        .eq("document_type", "certification");
      return data?.length || 0;
    },
    enabled: !!asset?.id,
  });

  const evaluation = useTrustControlEvaluation(asset?.id || "");

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
          <main className="flex-1 p-6">
            <div className="text-center py-20 space-y-4">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold">
                {isNb ? "Ingen Trust Profile funnet" : "No Trust Profile found"}
              </h2>
              <Button onClick={() => navigate("/onboarding")}>
                {isNb ? "Start onboarding" : "Start onboarding"}
              </Button>
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
    const { error } = await supabase
      .from("assets")
      .update({ publish_mode: "all" } as any)
      .eq("id", asset!.id);
    if (error) {
      toast.error(isNb ? "Kunne ikke publisere" : "Could not publish");
    } else {
      toast.success(isNb ? "Trust Center publisert!" : "Trust Center published!");
    }
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
    if (n.includes("personopp")) return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-5">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Trust Center</span>
              </div>
              <Badge variant="outline" className="text-xs">Free Plan</Badge>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground">Trust Profile</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isNb
                  ? "Din organisasjons sikkerhets- og compliance-profil slik den vises for kunder og partnere."
                  : "Your organization's security and compliance profile as seen by customers and partners."}
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
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Public URL</p>
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
                          <Button variant="outline" onClick={handlePublish} className="gap-2">
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
                          <Button onClick={handlePublish} className="gap-2 bg-primary hover:bg-primary/90">
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
                  <Card className="p-8 text-center space-y-3">
                    <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50" />
                    <h3 className="text-base font-semibold text-foreground">Vendor Hub</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {isNb
                        ? "Gjør din Trust Profile tilgjengelig i Mynders Vendor Hub slik at potensielle kunder kan finne deg."
                        : "Make your Trust Profile available in Mynder's Vendor Hub so potential customers can find you."}
                    </p>
                    <Badge variant="outline" className="text-xs">{isNb ? "Kommer snart" : "Coming soon"}</Badge>
                  </Card>
                )}

                {/* Website Badge sub-tab */}
                {publishSubTab === "badge" && (
                  <Card className="p-6 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground">
                        {isNb ? "Nettside-badge" : "Website Badge"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isNb
                          ? "Legg til en badge på nettsiden din som lenker til din Trust Profile."
                          : "Add a badge to your website that links directly to your Trust Profile."}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: "shield", preview: <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground shadow-sm"><Shield className="h-3.5 w-3.5 text-primary" />Verified by Mynder</span>, label: isNb ? "Skjold" : "Shield" },
                        { key: "minimal", preview: <span className="text-xs text-muted-foreground">🛡️ Trust Profile on Mynder</span>, label: "Minimal" },
                        { key: "banner", preview: <span className="inline-block px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium">🔒 View our Trust Profile</span>, label: "Banner" },
                      ].map(b => (
                        <button key={b.key} className="rounded-lg border border-border p-4 text-center hover:border-primary/40 transition-all">
                          <div className="flex justify-center mb-2">{b.preview}</div>
                          <p className="text-[10px] text-muted-foreground">{b.label}</p>
                        </button>
                      ))}
                    </div>
                  </Card>
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
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] gap-1">
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
                          <p className="text-sm text-muted-foreground">Digital Trust Profile og samsvarsversikt</p>
                        </div>
                      </div>

                      <Badge variant="outline" className="text-[10px]">
                        {isNb ? "Egenerklæring" : "Self-declared"}
                      </Badge>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {asset.description || (isNb
                          ? `${companyProfile?.name || asset.name} er registrert i Norge og har etablert en digital tillitsprofil for å dokumentere sikkerhet, personvern og samsvar med relevante regelverk.`
                          : `${companyProfile?.name || asset.name} has established a digital trust profile to document security, privacy, and regulatory compliance.`)}
                      </p>

                      {/* Framework badges */}
                      {frameworks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {frameworks.map((fw: any) => (
                            <Badge
                              key={fw.framework_id}
                              variant="outline"
                              className={`text-[10px] font-medium ${frameworkBadgeClass(fw.framework_name)}`}
                            >
                              {fw.framework_name}
                            </Badge>
                          ))}
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
                          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{trustLabel}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground text-center">
                        {trustScore >= 80
                          ? (isNb ? "Godt egnet for de fleste bruksområder" : "Suitable for most use cases")
                          : trustScore >= 50
                            ? (isNb ? "Egnet for standard bruksområder" : "Suitable for standard use cases")
                            : (isNb ? "Begrenset egnethet" : "Limited suitability")}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
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
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                        <p className="text-sm font-medium text-foreground mt-0.5 truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* ── Sikkerhet og kontroller ── */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-base font-semibold text-foreground">
                        {isNb ? "Sikkerhet og kontroller" : "Security and Controls"}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {AREA_CONFIG.map(({ area, icon: Icon, labelEn, labelNb }) => {
                        const score = evaluation?.areaScore(area) ?? 0;
                        const barColor = score >= 75 ? "bg-success" : score >= 50 ? "bg-primary" : "bg-destructive";
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
                                        <Badge variant="outline" className={`text-[10px] ${statusBadgeClass}`}>
                                          {statusBadgeLabel}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">{verificationLabel}</span>
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

                  {/* ── Key Risk Insights ── */}
                  {highRisks.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <h3 className="text-sm font-semibold text-foreground">Key Risk Insights</h3>
                      </div>
                      <div className="space-y-2">
                        {highRisks.slice(0, 5).map(risk => (
                          <div key={risk.id} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive/5 border border-destructive/10">
                            <div className="h-2 w-2 rounded-full bg-destructive shrink-0" />
                            <span className="text-sm text-foreground">{isNb ? risk.titleNb : risk.titleEn}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Last updated */}
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Last updated: {lastUpdated}</span>
                  </div>

                  {/* ── Sammendrag og kontakt ── */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-base font-semibold text-foreground">
                        {isNb ? "Sammendrag og kontakt" : "Summary and Contact"}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3">
                        <p className="text-2xl font-bold text-foreground">{frameworks.length}</p>
                        <p className="text-xs text-muted-foreground">{isNb ? "Regelverk" : "Frameworks"}</p>
                      </div>
                      <div className="text-center p-3">
                        <p className="text-2xl font-bold text-foreground">
                          {evaluation ? `${evaluation.implementedCount}/${evaluation.allControls.length}` : "0/0"}
                        </p>
                        <p className="text-xs text-muted-foreground">{isNb ? "Sikkerhet og kontroller" : "Security & Controls"}</p>
                      </div>
                      <div className="text-center p-3">
                        <p className="text-2xl font-bold text-foreground">{certsCount}</p>
                        <p className="text-xs text-muted-foreground">{isNb ? "Sertifiseringer" : "Certifications"}</p>
                      </div>
                      <div className="text-center p-3">
                        {dpaOk ? (
                          <CheckCircle2 className="h-6 w-6 text-success mx-auto" />
                        ) : (
                          <p className="text-2xl font-bold text-muted-foreground">–</p>
                        )}
                        <p className="text-xs text-muted-foreground">DPA {dpaOk ? "OK" : "–"}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {isNb ? "Trenger du mer informasjon?" : "Need more information?"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isNb
                            ? "Kontakt oss for spørsmål om sikkerhet, compliance eller databehandling."
                            : "Contact us for questions about security, compliance or data handling."}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2 shrink-0">
                        <MessageSquare className="h-4 w-4" />
                        {isNb ? "Kontakt oss" : "Contact us"}
                      </Button>
                    </div>
                  </section>

                  {/* ── Dokumentasjon og bevis ── */}
                  <section>
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                      {isNb ? "DOKUMENTASJON OG BEVIS" : "DOCUMENTATION AND EVIDENCE"}
                    </h3>
                    <div className="space-y-2">
                      {[
                        { icon: FileText, label: isNb ? "Policies" : "Policies", count: docsCount },
                        { icon: Award, label: isNb ? "Sertifiseringer" : "Certifications", count: certsCount },
                        { icon: Globe, label: isNb ? "Datahåndtering" : "Data Handling", count: null },
                      ].map(item => (
                        <button
                          key={item.label}
                          className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{item.label}</span>
                            {item.count !== null && (
                              <Badge variant="secondary" className="text-[10px]">{item.count}</Badge>
                            )}
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </section>
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
    </SidebarProvider>
  );
};

export default TrustCenterProfile;
