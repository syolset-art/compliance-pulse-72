import { useState, useMemo, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Shield, ArrowLeft, Eye, CheckCircle2, AlertTriangle, Link2,
  Copy, Check, Pencil, Upload, Globe, Lock, Layers, Users,
  ChevronDown, ChevronUp, Plus, Building2, Scale, FileText, Award,
  Info, Settings, Package,
} from "lucide-react";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import type { ControlArea } from "@/lib/trustControlDefinitions";
import { toast } from "sonner";
import { CompanyInfoForm } from "@/components/company/CompanyInfoForm";
import { PublishingReadiness } from "@/components/trust-center/PublishingReadiness";

const AREA_CONFIG: { area: ControlArea; icon: typeof Shield; labelNb: string; labelEn: string }[] = [
  { area: "governance", icon: Shield, labelNb: "Governance & Accountability", labelEn: "Governance & Accountability" },
  { area: "risk_compliance", icon: Lock, labelNb: "Security", labelEn: "Security" },
  { area: "security_posture", icon: Globe, labelNb: "Privacy & Data Handling", labelEn: "Privacy & Data Handling" },
  { area: "supplier_governance", icon: Layers, labelNb: "Third-Party & Supply Chain", labelEn: "Third-Party & Supply Chain" },
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

  const { data: asset, isLoading } = useQuery({
    queryKey: ["self-asset-edit"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assets").select("*").eq("asset_type", "self").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: companyProfile } = useQuery({
    queryKey: ["company_profile_edit"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_profile").select("*").maybeSingle();
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

  const { data: linkedProducts = [] } = useQuery({
    queryKey: ["linked-products-edit", asset?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("asset_relationships")
        .select("target_asset_id, description, assets!asset_relationships_target_asset_id_fkey(id, name, asset_type)")
        .eq("source_asset_id", asset!.id)
        .eq("relationship_type", "service_of");
      return data || [];
    },
    enabled: !!asset?.id,
  });

  const evaluation = useTrustControlEvaluation(asset?.id || "");

  const slug = useMemo(() => {
    const base = (companyProfile?.name || asset?.name || "")
      .toLowerCase().replace(/[^a-z0-9æøå\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 40);
    const suffix = companyProfile?.org_number ? `-${companyProfile.org_number.replace(/\s/g, "").slice(-4)}` : "";
    return `${base}${suffix}`;
  }, [companyProfile?.name, asset?.name, companyProfile?.org_number]);

  const publicUrl = `https://trust.mynder.com/${slug}`;
  const trustScore = evaluation?.trustScore ?? 0;

  const assetMeta = (asset?.metadata || {}) as Record<string, any>;
  const sectionCompleteness = useMemo(() => {
    const areas: string[] = assetMeta.business_areas || [];
    const companyChecks = [
      !!companyProfile?.name,
      !!companyProfile?.org_number,
      !!companyProfile?.compliance_officer || !!companyProfile?.dpo_name,
      areas.length > 0,
    ];
    return {
      company: { done: companyChecks.filter(Boolean).length, total: companyChecks.length },
      linked: { done: linkedProducts.length > 0 ? 1 : 0, total: 1 },
      regulations: { done: frameworks.length > 0 ? 1 : 0, total: 1 },
    };
  }, [companyProfile, assetMeta, linkedProducts, frameworks]);

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
  const gdprRole: string = meta.gdpr_data_role || "processor";

  const frameworkBadgeClass = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("gdpr")) return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300";
    if (n.includes("personopp")) return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300";
    if (n.includes("iso")) return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:pt-11">
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
              <h1 className="text-2xl font-bold text-foreground">
                {isNb ? "Rediger Trust Profile" : "Edit Trust Profile"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isNb
                  ? "Fyll ut seksjonene for å styrke din tillitsprofil."
                  : "Fill in the sections to strengthen your trust profile."}
              </p>
            </div>

            {/* Readiness Indicator */}
            <PublishingReadiness
              trustScore={trustScore}
              companyProfile={companyProfile}
              frameworks={frameworks}
              linkedProducts={linkedProducts}
              evaluation={evaluation}
            />

            {/* Quick nav tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: Eye, label: isNb ? "Offentlig profil" : "Public profile", anchor: "#public" },
                { icon: Building2, label: isNb ? "Virksomhet" : "Company", anchor: "#company" },
                { icon: Package, label: isNb ? "Koblede profiler" : "Linked profiles", anchor: "#linked" },
                { icon: Shield, label: isNb ? "Sikkerhet" : "Security", anchor: "#security" },
                { icon: Scale, label: isNb ? "Regelverk" : "Regulations", anchor: "#regulations" },
              ].map(tab => (
                <button
                  key={tab.anchor}
                  onClick={() => document.querySelector(tab.anchor)?.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => navigate(`/assets/${asset.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <Settings className="h-3 w-3" />
                {isNb ? "Detaljinnstillinger og basis" : "Detail settings"}
              </button>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* SECTION: Offentlig profil */}
            {/* ═══════════════════════════════════════════ */}
            <section id="public" className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">
                  {isNb ? "Offentlig profil" : "Public Profile"}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {isNb
                  ? "Din offentlige Trust Center-lenke som du kan dele med kunder og partnere."
                  : "Your public Trust Center link that you can share with customers and partners."}
              </p>

              {/* Trust Center URL */}
              <Card className="p-4 space-y-3 border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 text-sm">
                  <Link2 className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">{isNb ? "Din Trust Center URL" : "Your Trust Center URL"}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isNb
                    ? "Dette er din offentlige lenke til din Trust Center-profil."
                    : "This is your public link to your Trust Center profile."}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5">
                    <code className="text-sm font-mono text-foreground">{publicUrl}</code>
                  </div>
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate("/trust-center/profile")}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleCopyUrl}>
                    {copiedUrl ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </Card>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* SECTION: Virksomhet */}
            {/* ═══════════════════════════════════════════ */}
            <section id="company" className="space-y-5">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">
                  {isNb ? "Virksomhet" : "Company"}
                </h2>
                <Badge variant={sectionCompleteness.company.done === sectionCompleteness.company.total ? "action" : "secondary"} className="text-[10px] ml-auto">
                  {sectionCompleteness.company.done}/{sectionCompleteness.company.total}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isNb
                  ? "Grunnleggende informasjon om din virksomhet."
                  : "Basic information about your company."}
              </p>

              <CompanyInfoForm showEditControls />

              {/* Virksomhetsbruksområder */}
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {isNb ? "Virksomhetsbruksområder" : "Business Areas"}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isNb ? "Hvilke områder dekker virksomheten?" : "Which areas does the company cover?"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_AREAS.map(area => {
                    const isSelected = selectedAreas.includes(area);
                    return (
                      <Badge
                        key={area}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer text-xs transition-all ${isSelected ? "bg-primary text-primary-foreground ring-2 ring-primary/20" : "hover:bg-muted"}`}
                        onClick={async () => {
                          const newAreas = isSelected
                            ? selectedAreas.filter((a: string) => a !== area)
                            : [...selectedAreas, area];
                          const newMeta = { ...meta, business_areas: newAreas };
                          await supabase.from("assets").update({ metadata: newMeta }).eq("id", asset.id);
                          queryClient.invalidateQueries({ queryKey: ["self-asset-edit"] });
                          toast.success(isSelected
                            ? (isNb ? `${area} fjernet` : `${area} removed`)
                            : (isNb ? `${area} lagt til` : `${area} added`));
                        }}
                      >
                        {isSelected && <Check className="h-3 w-3 mr-1" />}
                        {area}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {isNb ? "Klikk for å velge eller fjerne kategorier." : "Click to select or remove categories."}
                </p>
              </Card>

              {/* Kontaktperson */}
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {isNb ? "Kontaktperson" : "Contact Person"}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isNb ? "Hvem er hovedkontakt for sikkerhet og etterlevelse?" : "Who is the main contact for security and compliance?"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">{isNb ? "Navn" : "Name"}</label>
                    <Input defaultValue={companyProfile?.compliance_officer || ""} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">E-post</label>
                    <Input defaultValue={companyProfile?.compliance_officer_email || ""} className="text-sm" />
                  </div>
                </div>
              </Card>

              {/* Leverandørprofil */}
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {isNb ? "Leverandørprofil" : "Vendor Profile"}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isNb ? "Hva slags tjenester eller produkter leverer virksomheten?" : "What kind of services or products does the company provide?"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_CATEGORIES.map(cat => {
                    const isSelected = selectedServiceCats.includes(cat.key);
                    return (
                      <Badge
                        key={cat.key}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer text-xs transition-all ${isSelected ? "bg-primary text-primary-foreground ring-2 ring-primary/20" : "hover:bg-muted"}`}
                        onClick={async () => {
                          const newCats = isSelected
                            ? selectedServiceCats.filter((k: string) => k !== cat.key)
                            : [...selectedServiceCats, cat.key];
                          const newMeta = { ...meta, service_categories: newCats };
                          await supabase.from("assets").update({ metadata: newMeta }).eq("id", asset.id);
                          queryClient.invalidateQueries({ queryKey: ["self-asset-edit"] });
                          const label = isNb ? cat.labelNb : cat.labelEn;
                          toast.success(isSelected
                            ? (isNb ? `${label} fjernet` : `${label} removed`)
                            : (isNb ? `${label} lagt til` : `${label} added`));
                        }}
                      >
                        {isSelected && <Check className="h-3 w-3 mr-1" />}
                        {isNb ? cat.labelNb : cat.labelEn}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {isNb ? "Klikk for å velge eller fjerne kategorier." : "Click to select or remove categories."}
                </p>
              </Card>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* SECTION: Koblede profiler */}
            {/* ═══════════════════════════════════════════ */}
            <section id="linked" className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">
                  {isNb ? "Koblede profiler" : "Linked Profiles"}
                </h2>
                <Badge variant={sectionCompleteness.linked.done > 0 ? "action" : "secondary"} className="text-[10px] ml-auto">
                  {sectionCompleteness.linked.done}/{sectionCompleteness.linked.total}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isNb
                  ? "Organisasjonens Trust Profile kobles til produkter dere leverer og leverandører dere bruker."
                  : "Your organization's Trust Profile is linked to your products and vendors."}
              </p>

              {/* GDPR Data Role */}
              <Card className="p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {isNb ? "Din rolle i datahåndtering" : "Your role in data handling"}
                </h3>
                <RadioGroup defaultValue={gdprRole} className="space-y-2">
                  {[
                    { value: "processor", labelNb: "Behandlingsansvarlig", labelEn: "Data Controller", descNb: "Vi bestemmer formål og middel for behandling av personopplysninger.", descEn: "We determine the purpose and means of processing personal data." },
                    { value: "sub_processor", labelNb: "Databehandler", labelEn: "Data Processor", descNb: "Vi behandler personopplysninger på vegne av andre virksomheter.", descEn: "We process personal data on behalf of other organizations." },
                    { value: "both", labelNb: "Begge roller", labelEn: "Both roles", descNb: "Vi har begge roller avhengig av tjeneste eller kundeavtale.", descEn: "We have both roles depending on service or agreement." },
                  ].map(role => (
                    <label
                      key={role.value}
                      className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:border-primary/30 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                    >
                      <RadioGroupItem value={role.value} className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{isNb ? role.labelNb : role.labelEn}</p>
                        <p className="text-xs text-muted-foreground">{isNb ? role.descNb : role.descEn}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </Card>

              {/* Products & Services */}
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    {isNb ? "Produkter og tjenester" : "Products & Services"}
                  </h3>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/trust-center/products")}>
                    <Plus className="h-3 w-3" />
                    {isNb ? "Ny produktprofil" : "New product profile"}
                  </Button>
                </div>

                {linkedProducts.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">{isNb ? "Ingen produktprofiler ennå" : "No product profiles yet"}</p>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/trust-center/products")}>
                      <Plus className="h-3 w-3" />
                      {isNb ? "Opprett din første produktprofil" : "Create your first product profile"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedProducts.map((lp: any) => (
                      <button
                        key={lp.target_asset_id}
                        onClick={() => navigate(`/assets/${lp.target_asset_id}`)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-foreground">{lp.assets?.name || "–"}</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* SECTION: Sikkerhet og kontroller */}
            {/* ═══════════════════════════════════════════ */}
            <section id="security" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">
                    {isNb ? "Sikkerhet og kontroller" : "Security and Controls"}
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">{trustScore}% {isNb ? "oppfylt" : "fulfilled"}</span>
              </div>

              {/* Info box */}
              <Card className="p-4 border-primary/20 bg-primary/5 space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{isNb ? "Hvordan fungerer dette?" : "How does this work?"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isNb
                        ? "For å henest kontrollstatus, sørg for at det er på plass i din virksomhet. Definer din regelverkssamling, last inn dine sertifiseringer og dokumenter."
                        : "To achieve control status, make sure it is in place in your organization. Define your regulations, upload certifications and documents."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isNb
                        ? "Resultatet vises i din Trust Center-profil slik at dine kunder og partnere kan se den."
                        : "The result is shown in your Trust Center profile for your customers and partners to see."}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Control areas */}
              <div className="space-y-2">
                {AREA_CONFIG.map(({ area, icon: Icon, labelNb: lNb, labelEn: lEn }) => {
                  const score = evaluation?.areaScore(area) ?? 0;
                  const isExpanded = expandedArea === area;
                  const areaControls = evaluation?.grouped[area] ?? [];
                  const selfDeclaredCount = areaControls.filter(c => c.verificationSource === "customer_asserted" || c.verificationSource === "ai_inferred").length;

                  return (
                    <Card key={area} className="overflow-hidden">
                      <button
                        onClick={() => setExpandedArea(isExpanded ? null : area)}
                        className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{isNb ? lNb : lEn}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {selfDeclaredCount > 0 && (
                              <Badge variant="outline" className="text-[10px]">
                                {selfDeclaredCount} {isNb ? "egenerklært" : "self-declared"}
                              </Badge>
                            )}
                            <span className={`text-sm font-semibold tabular-nums ${score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive"}`}>{score}%</span>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${score >= 75 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive"}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </button>
                      {isExpanded && areaControls.length > 0 && (
                        <div className="border-t border-border divide-y divide-border">
                          {areaControls.map(control => {
                            const currentStatus = control.status;
                            return (
                              <div key={control.key} className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{isNb ? control.labelNb : control.labelEn}</p>
                                    {(control as any).descriptionNb && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {isNb ? (control as any).descriptionNb : (control as any).descriptionEn}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-[10px] shrink-0">
                                    {isNb ? "Egenerklæring" : "Self-declaration"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  {([
                                    { value: "implemented", labelNb: "Ja", labelEn: "Yes", icon: CheckCircle2, activeClass: "bg-success/10 text-success border-success/30" },
                                    { value: "partial", labelNb: "Delvis", labelEn: "Partial", icon: AlertTriangle, activeClass: "bg-warning/10 text-warning border-warning/30" },
                                    { value: "missing", labelNb: "Nei", labelEn: "No", icon: Shield, activeClass: "bg-destructive/10 text-destructive border-destructive/30" },
                                  ] as const).map(opt => {
                                    const isActive = currentStatus === opt.value;
                                    return (
                                      <button
                                        key={opt.value}
                                        onClick={async () => {
                                          const metaKey = control.key;
                                          const metaValue = opt.value === "implemented" ? "yes" : opt.value === "partial" ? "partial" : "no";
                                          const currentMeta = (asset?.metadata || {}) as Record<string, any>;
                                          const newMeta = { ...currentMeta, [metaKey]: metaValue };
                                          await supabase.from("assets").update({ metadata: newMeta } as any).eq("id", asset!.id);
                                          queryClient.invalidateQueries({ queryKey: ["self-asset-edit"] });
                                          queryClient.invalidateQueries({ queryKey: ["asset-for-trust-eval"] });
                                        }}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                                          isActive ? opt.activeClass : "border-border text-muted-foreground hover:bg-muted/50"
                                        }`}
                                      >
                                        <opt.icon className="h-3.5 w-3.5" />
                                        {isNb ? opt.labelNb : opt.labelEn}
                                      </button>
                                    );
                                  })}
                                </div>
                                <button className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
                                  <Upload className="h-3 w-3" />
                                  {isNb ? "Legg ved dokumentasjon" : "Attach documentation"}
                                  <span className="text-muted-foreground">({isNb ? "valgfritt" : "optional"})</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* SECTION: Regelverk */}
            {/* ═══════════════════════════════════════════ */}
            <section id="regulations" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">
                    {isNb ? "Regelverk" : "Regulations"}
                  </h2>
                  <Badge variant={sectionCompleteness.regulations.done > 0 ? "action" : "secondary"} className="text-[10px]">
                    {sectionCompleteness.regulations.done}/{sectionCompleteness.regulations.total}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground" onClick={() => navigate("/trust-center/regulations")}>
                  {isNb ? "Administrer" : "Manage"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isNb
                  ? "Regelverk og standarder virksomheten etterlever."
                  : "Regulations and standards the organization complies with."}
              </p>
              <div className="flex flex-wrap gap-2">
                {frameworks.length > 0 ? frameworks.map((fw: any) => (
                  <Badge key={fw.framework_id} variant="outline" className={`text-xs font-medium ${frameworkBadgeClass(fw.framework_name)}`}>
                    {fw.framework_name}
                  </Badge>
                )) : (
                  <p className="text-xs text-muted-foreground">{isNb ? "Ingen regelverk valgt ennå." : "No regulations selected yet."}</p>
                )}
              </div>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* SECTION: Dokumentasjon og bevis */}
            {/* ═══════════════════════════════════════════ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  {isNb ? "DOKUMENTASJON OG BEVIS" : "DOCUMENTATION AND EVIDENCE"}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                {isNb
                  ? "Administrer policies, sertifiseringer, databehandling og dokumenter."
                  : "Manage policies, certifications, data handling and documents."}
              </p>
              <div className="space-y-2">
                {[
                  { icon: FileText, label: isNb ? "Retningslinjer" : "Policies", href: "/trust-center/evidence" },
                  { icon: Award, label: isNb ? "Sertifiseringer" : "Certifications", href: "/trust-center/evidence" },
                  { icon: Eye, label: isNb ? "Datahåndtering" : "Data Handling", href: "/trust-center/evidence" },
                  { icon: FileText, label: isNb ? "Dokumenter" : "Documents", href: "/trust-center/evidence" },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.href)}
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
                  </button>
                ))}
              </div>
            </section>

            {/* Spacer */}
            <div className="h-8" />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TrustCenterEditProfile;
