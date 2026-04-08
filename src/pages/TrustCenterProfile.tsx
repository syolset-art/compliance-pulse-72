import { useState } from "react";
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
  Sparkles, Zap, Server, Package, ArrowRight,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";

import type { ControlArea } from "@/lib/trustControlDefinitions";

const AREA_CONFIG: { area: ControlArea; icon: typeof Shield; labelEn: string; labelNb: string }[] = [
  { area: "governance", icon: Shield, labelEn: "Governance & Accountability", labelNb: "Governance & Accountability" },
  { area: "risk_compliance", icon: Lock, labelEn: "Security", labelNb: "Security" },
  { area: "security_posture", icon: Globe, labelEn: "Privacy & Data Handling", labelNb: "Privacy & Data Handling" },
  { area: "supplier_governance", icon: Layers, labelEn: "Third-Party & Supply Chain", labelNb: "Third-Party & Supply Chain" },
];

const TrustCenterProfile = ({ assetId: propAssetId }: { assetId?: string }) => {
  const navigate = useNavigate();
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
                  : (isNb
                    ? "Din organisasjons sikkerhets- og compliance-profil slik den vises for kunder og partnere."
                    : "Your organization's security and compliance profile as seen by customers and partners.")}
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
                          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Current</Badge>
                        </div>
                        <div className="flex justify-center py-4">
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground shadow-sm">
                            <Shield className="h-4 w-4 text-primary" />
                            Mynder Verified
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
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Settings className="h-3 w-3" />
                            Pro
                          </Badge>
                        </div>
                        <div className="flex justify-center py-3">
                          <div className="rounded-lg border border-border bg-background p-4 space-y-2 min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold text-foreground">Trust Profile</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Verified by Mynder</p>
                            <div className="flex flex-wrap gap-1">
                              {(frameworks.length > 0 ? frameworks.slice(0, 3) : [{ framework_name: "GDPR" }, { framework_name: "Personopplysningsloven" }, { framework_name: "ISO 27001" }]).map((fw: any, i: number) => (
                                <Badge key={i} variant="secondary" className="text-[9px]">{fw.framework_name}</Badge>
                              ))}
                            </div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

                  {/* ── Products & Services link ── */}
                  {services.length > 0 && (
                    <section>
                      <div
                        className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate("/trust-center/products")}
                      >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {isNb ? "Produkter og tjenester" : "Products & Services"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isNb
                              ? `${services.length} ${services.length === 1 ? "profil" : "profiler"} tilgjengelig`
                              : `${services.length} ${services.length === 1 ? "profile" : "profiles"} available`}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </section>
                  )}

                  {/* Last updated */}
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Last updated: {lastUpdated}</span>
                  </div>

                  {/* ── Sammendrag og kontakt ── */}
                  <section className="space-y-5">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <h3 className="text-base font-semibold text-foreground">
                        {isNb ? "Sammendrag og kontakt" : "Summary and Contact"}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: String(frameworks.length), label: isNb ? "Regelverk" : "Frameworks", color: "" },
                        { value: evaluation ? `${evaluation.implementedCount + evaluation.partialCount}/${evaluation.allControls.length}` : "0/0", label: isNb ? "Sikkerhet og kontroller" : "Security & Controls", color: "text-warning" },
                        { value: String(certsCount), label: isNb ? "Sertifiseringer" : "Certifications", color: "" },
                        { value: dpaOk ? "✓" : "–", label: dpaOk ? "DPA OK" : "DPA", color: dpaOk ? "text-success" : "" },
                      ].map((item, i) => (
                        <div key={i} className="text-center py-4 px-2 rounded-xl bg-muted/30 border border-border/50">
                          <p className={`text-xl font-bold ${item.color || "text-foreground"}`}>{item.value}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{item.label}</p>
                        </div>
                      ))}
                    </div>

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
                  </section>

                  <div className="border-t border-border" />

                  {/* ── Dokumentasjon og bevis ── */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {isNb ? "DOKUMENTASJON OG BEVIS" : "DOCUMENTATION AND EVIDENCE"}
                    </h3>
                    <div className="space-y-2.5">
                      {[
                        { icon: FileText, label: isNb ? "Policies" : "Policies", count: docsCount, color: "text-primary" },
                        { icon: Award, label: isNb ? "Sertifiseringer" : "Certifications", count: certsCount, color: "text-purple-500" },
                        { icon: Globe, label: isNb ? "Datahåndtering" : "Data Handling", count: null, color: "text-muted-foreground" },
                        { icon: FileText, label: isNb ? "Dokumenter" : "Documents", count: null, color: "text-muted-foreground" },
                      ].map(item => (
                        <button
                          key={item.label}
                          className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl border border-border hover:bg-muted/40 hover:border-border/80 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                            <span className="text-sm font-medium text-foreground">{item.label}</span>
                            {item.count !== null && item.count > 0 && (
                              <Badge variant="secondary" className="text-[10px] rounded-full px-2 font-semibold">{item.count}</Badge>
                            )}
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
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
              <p className="text-[11px] text-center text-muted-foreground">
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
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
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
                  <p className="text-[10px] text-muted-foreground">{isNb ? "Visninger" : "Views"}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-[10px] text-muted-foreground">{isNb ? "Unike besøkende" : "Unique visitors"}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">∞</p>
                  <p className="text-[10px] text-muted-foreground">{isNb ? "Timer spart" : "Hours saved"}</p>
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
    </SidebarProvider>
  );
};

export default TrustCenterProfile;
