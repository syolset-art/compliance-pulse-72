import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Check, CreditCard, FileText, ArrowRight,
  CheckCircle2, Loader2, Shield, Cpu, Truck,
  ChevronDown, ChevronUp, Star, Zap, Package,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { frameworks as allFrameworkDefs, getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
import { EditActiveFrameworksDialog } from "@/components/regulations/EditActiveFrameworksDialog";
import { FrameworkActivationDialog } from "@/components/dialogs/FrameworkActivationDialog";
import { FrameworkPurchaseDialog } from "@/components/dialogs/FrameworkPurchaseDialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSubscription } from "@/hooks/useSubscription";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActivatedServices } from "@/hooks/useActivatedServices";
import { toast } from "sonner";
import {
  MODULES, FRAMEWORK_ADDONS, FREE_FRAMEWORKS, CREDIT_PACKAGES,
  FREE_INCLUSIONS, formatKr, getModulePrice, getModuleAnnualSavingsKr,
  type ModuleId, type BillingInterval,
} from "@/lib/planConstants";
import { Settings2 } from "lucide-react";

const MODULE_ICONS: Record<ModuleId, typeof Cpu> = {
  systems: Cpu,
  vendors: Truck,
};

// ─── Credits Section ─────────────────────────────────────────────────

function CreditsSection() {
  const { balance, percentRemaining, isLow, isExhausted, recentTransactions, purchaseCredits, isPurchasing } = useCredits();
  const [showPackages, setShowPackages] = useState(false);

  const barColor = isExhausted ? "bg-destructive" : isLow ? "bg-warning" : "bg-primary";

  return (
    <div className="space-y-3">
      <Card className={isExhausted ? "border-destructive/30 bg-destructive/[0.03]" : isLow ? "border-warning/30 bg-warning/[0.03]" : "border-border"}>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isExhausted ? "bg-destructive/10" : isLow ? "bg-warning/10" : "bg-primary/10"}`}>
                <Zap className={`h-5 w-5 ${isExhausted ? "text-destructive" : isLow ? "text-warning" : "text-primary"}`} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Credits</h3>
                <p className="text-sm text-muted-foreground">
                  Brukes til AI-analyse, dokumentklassifisering og risikovurdering
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${isExhausted ? "text-destructive" : isLow ? "text-warning" : "text-foreground"}`}>
                {balance}
              </p>
              <p className="text-xs text-muted-foreground">tilgjengelig</p>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.max(percentRemaining, 2)}%` }}
            />
          </div>

          {/* Buy credits button */}
          <Button
            variant={isExhausted ? "default" : "outline"}
            size="sm"
            className="w-full gap-2"
            onClick={() => setShowPackages(!showPackages)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Kjøp credits
          </Button>

          {/* Credit packages */}
          {showPackages && (
            <div className="grid grid-cols-3 gap-3 pt-2">
              {CREDIT_PACKAGES.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`relative cursor-pointer transition-all hover:border-primary/40 ${pkg.popular ? "border-primary ring-1 ring-primary/20" : ""}`}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] px-2">
                      Populær
                    </Badge>
                  )}
                  <CardContent className="p-3 text-center space-y-2">
                    <p className="text-sm font-bold text-foreground">{pkg.name}</p>
                    <p className="text-lg font-bold text-primary">{pkg.credits}</p>
                    <p className="text-[10px] text-muted-foreground">credits</p>
                    <p className="text-sm font-semibold text-foreground">{formatKr(pkg.priceKr)}</p>
                    <Button
                      size="sm"
                      variant={pkg.popular ? "default" : "outline"}
                      className="w-full text-xs"
                      onClick={() => purchaseCredits(pkg.id)}
                      disabled={isPurchasing}
                    >
                      Kjøp
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {recentTransactions.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-medium text-muted-foreground">Siste transaksjoner</p>
              {recentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[60%]">{tx.description || tx.transaction_type}</span>
                  <span className={tx.amount < 0 ? "text-destructive font-medium" : "text-success font-medium"}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Module Card ─────────────────────────────────────────────────────

function ModuleCard({ moduleId, billingInterval }: { moduleId: ModuleId; billingInterval: BillingInterval }) {
  const mod = MODULES[moduleId];
  const Icon = MODULE_ICONS[moduleId];
  const { isServiceActive, activateService } = useActivatedServices();
  const isActive = isServiceActive(`module-${moduleId}`);
  const price = getModulePrice(moduleId, billingInterval);

  const handleToggle = () => {
    if (!isActive) {
      activateService(`module-${moduleId}`, "user");
      toast.success(`${mod.displayName} aktivert! +${mod.bonusCredits} credits/mnd.`);
    } else {
      // For demo, we don't deactivate
      toast.info("Kontakt support for å deaktivere pakken.");
    }
  };

  return (
    <Card className={`transition-all ${isActive ? "border-primary/30 bg-primary/[0.02]" : "border-border"}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isActive ? "bg-primary/10" : "bg-muted"}`}>
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{mod.displayName}</h3>
                {isActive && (
                  <Badge className="bg-success/10 text-success border-0 text-[10px]">Aktiv</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-foreground">{formatKr(price)}</p>
            <p className="text-[10px] text-muted-foreground">{billingInterval === "yearly" ? "/år" : "/mnd"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {mod.features.map((feature) => (
            <div key={feature} className="flex items-start gap-1.5">
              <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" />
              <span className="text-[11px] text-foreground leading-tight">{feature}</span>
            </div>
          ))}
        </div>

        {!isActive ? (
          <Button className="w-full gap-2" onClick={handleToggle}>
            <Sparkles className="h-3.5 w-3.5" />
            Aktiver {mod.displayName}
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Pakken er aktiv — grenser fjernet, +{mod.bonusCredits} credits/mnd</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function Subscriptions() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { addons, activateAddon } = useSubscription();
  const { isServiceActive } = useActivatedServices();

  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Framework management state
  const [editFrameworksOpen, setEditFrameworksOpen] = useState(false);
  const [activationFramework, setActivationFramework] = useState<Framework | null>(null);
  const [purchaseFramework, setPurchaseFramework] = useState<Framework | null>(null);
  const [updatingFrameworkId, setUpdatingFrameworkId] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("recommended");

  // Fetch selected_frameworks from DB
  const { data: selectedFrameworks, refetch: refetchFrameworks } = useQuery({
    queryKey: ["selected-frameworks-sub"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("selected_frameworks")
        .select("*")
        .order("framework_name");
      if (error) throw error;
      return data || [];
    },
  });

  const activeFrameworkIds = useMemo(() => {
    const ids = new Set<string>();
    selectedFrameworks?.forEach((sf: any) => {
      if (sf.is_selected) ids.add(sf.framework_id);
    });
    return ids;
  }, [selectedFrameworks]);

  // Group frameworks
  const { mandatory, recommended, optional } = useMemo(() => {
    const m: Framework[] = [];
    const r: Framework[] = [];
    const o: Framework[] = [];
    allFrameworkDefs.forEach((fw) => {
      if (fw.isMandatory) m.push(fw);
      else if (fw.isRecommended) r.push(fw);
      else o.push(fw);
    });
    return { mandatory: m, recommended: r, optional: o };
  }, []);

  const handleToggleFramework = async (frameworkId: string, currentlyActive: boolean) => {
    const fw = allFrameworkDefs.find((f) => f.id === frameworkId);
    if (!fw) return;
    if (!currentlyActive) {
      setPurchaseFramework(fw);
      return;
    }
    await executeToggleFramework(frameworkId, currentlyActive);
  };

  const executeToggleFramework = async (frameworkId: string, currentlyActive: boolean) => {
    setUpdatingFrameworkId(frameworkId);
    try {
      const existing = selectedFrameworks?.find((sf: any) => sf.framework_id === frameworkId);
      const fw = allFrameworkDefs.find((f) => f.id === frameworkId);
      if (!fw) return;

      if (existing) {
        await supabase
          .from("selected_frameworks")
          .update({ is_selected: !currentlyActive })
          .eq("id", existing.id);
      } else {
        await supabase.from("selected_frameworks").insert({
          framework_id: fw.id,
          framework_name: fw.name,
          category: fw.category,
          is_mandatory: fw.isMandatory || false,
          is_recommended: fw.isRecommended || false,
          is_selected: true,
        });
      }

      if (!currentlyActive && FRAMEWORK_ADDONS[frameworkId]) {
        activateAddon(frameworkId);
      }

      await refetchFrameworks();
      if (!currentlyActive) {
        setActivationFramework(fw);
      }
    } finally {
      setUpdatingFrameworkId(null);
    }
  };

  const handlePurchaseConfirm = async () => {
    if (!purchaseFramework) return;
    const fw = purchaseFramework;
    setPurchaseFramework(null);
    await executeToggleFramework(fw.id, false);
  };

  const activeFrameworkAddons = addons?.filter(
    (a) => a.status === "active" && !FREE_FRAMEWORKS.includes(a.domain_id as any)
  ) || [];

  const isPaidAddon = (fwId: string) => !!FRAMEWORK_ADDONS[fwId];
  const getAddonPrice = (fwId: string) => FRAMEWORK_ADDONS[fwId]?.yearlyPriceKr || 0;

  const activeCount = activeFrameworkIds.size;
  const totalCount = allFrameworkDefs.length;

  // Summary calculations
  const systemsActive = isServiceActive("module-systems");
  const vendorsActive = isServiceActive("module-vendors");
  const totalModuleCost =
    (systemsActive ? getModulePrice("systems", billingInterval) : 0) +
    (vendorsActive ? getModulePrice("vendors", billingInterval) : 0);
  const totalFrameworkCost = activeFrameworkAddons.length * 50000;
  const hasAnyCost = systemsActive || vendorsActive || activeFrameworkAddons.length > 0;

  return (
    <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
      {!isMobile && <div className="w-64 flex-shrink-0"><Sidebar /></div>}
      {isMobile && <Sidebar />}
      <main className="flex-1 overflow-y-auto pt-11">
        <div className="container max-w-4xl mx-auto p-6 space-y-10 pb-20">

          {/* Hero heading */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Abonnement og Credits</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kjøp credits og aktiver pakker etter behov — betal kun for det du bruker.
            </p>
          </div>

          {/* ── CREDITS OVERVIEW ── */}
          <CreditsSection />

          {/* ── GRUNNPAKKE ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-success/10 text-success text-xs font-bold">✓</span>
              <h2 className="text-lg font-semibold text-foreground">Grunnpakke</h2>
              <Badge className="bg-success/10 text-success border-0 text-[10px]">Gratis</Badge>
            </div>

            <Card className="border-success/30 bg-success/[0.03]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      <span className="font-semibold text-foreground">Aktiv — Trust Center + Grunnleggende compliance</span>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1">
                      {FREE_INCLUSIONS.map((item) => (
                        <div key={item} className="flex items-center gap-1.5 text-xs text-foreground">
                          <Check className="h-3 w-3 text-success shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => navigate("/trust-center/profile")}
                  >
                    Gå til Trust Center
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ── PAKKER ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Pakker</h2>
              <Badge variant="secondary" className="text-[10px]">Valgfritt</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Aktiver pakker for å fjerne grenser og få ekstra credits. Betal månedlig eller årlig.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center gap-3">
              <span className={`text-sm ${billingInterval === "monthly" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                Månedlig
              </span>
              <Switch
                checked={billingInterval === "yearly"}
                onCheckedChange={(checked) => setBillingInterval(checked ? "yearly" : "monthly")}
              />
              <span className={`text-sm ${billingInterval === "yearly" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                Årlig
              </span>
              {billingInterval === "yearly" && (
                <Badge variant="secondary" className="text-[10px] bg-success/10 text-success border-0">
                  Spar 2 mnd
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModuleCard moduleId="systems" billingInterval={billingInterval} />
              <ModuleCard moduleId="vendors" billingInterval={billingInterval} />
            </div>

            {/* Enterprise */}
            <Card className="border-dashed">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-foreground">Enterprise</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ubegrenset alt, dedikert kontaktperson, tilpassede integrasjoner og SLA.
                  </p>
                </div>
                <Button variant="outline" size="sm">Kontakt salg</Button>
              </CardContent>
            </Card>
          </section>

          {/* ── REGELVERK ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Regelverk</h2>
              <Badge variant="secondary" className="text-[10px]">
                {activeCount} av {totalCount} aktive
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              GDPR og ISO 27001 er inkludert gratis. Andre regelverk aktiveres som tillegg.
            </p>

            {/* Obligatoriske */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inkludert — alltid gratis</h3>
              <div className="flex flex-wrap gap-2">
                {mandatory.map((fw) => (
                  <div
                    key={fw.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-success/20 bg-success/[0.04]"
                  >
                    <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                    <span className="text-xs font-medium text-foreground">{fw.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Anbefalt */}
            <Collapsible
              open={expandedGroup === "recommended"}
              onOpenChange={(open) => setExpandedGroup(open ? "recommended" : null)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full group">
                <Star className="h-3.5 w-3.5 text-primary shrink-0" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Anbefalt for din virksomhet
                </h3>
                <Badge variant="outline" className="text-[9px] ml-1">{recommended.filter(fw => activeFrameworkIds.has(fw.id)).length}/{recommended.length}</Badge>
                <span className="ml-auto">
                  {expandedGroup === "recommended" ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {recommended.map((fw) => {
                  const isActive = activeFrameworkIds.has(fw.id);
                  const hasPaidAddon = isPaidAddon(fw.id);
                  const price = hasPaidAddon ? getAddonPrice(fw.id) : 0;
                  const isFree = FREE_FRAMEWORKS.includes(fw.id as any);
                  const cat = getCategoryById(fw.category);
                  const CatIcon = cat?.icon;

                  return (
                    <div
                      key={fw.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                        isActive ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {CatIcon && (
                          <div className={`p-1.5 rounded-md ${cat?.bgColor}`}>
                            <CatIcon className={`h-3.5 w-3.5 ${cat?.color}`} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-foreground">{fw.name}</span>
                            {isFree && <Badge className="bg-success/10 text-success border-0 text-[9px]">Inkludert</Badge>}
                            {hasPaidAddon && !isFree && (
                              <span className="text-[10px] text-muted-foreground font-medium">{formatKr(price)}/år</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => handleToggleFramework(fw.id, isActive)}
                        disabled={updatingFrameworkId === fw.id}
                      />
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>

            {/* Valgfrie */}
            <Collapsible
              open={expandedGroup === "optional"}
              onOpenChange={(open) => setExpandedGroup(open ? "optional" : null)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full group">
                <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Valgfrie tillegg
                </h3>
                <Badge variant="outline" className="text-[9px] ml-1">{optional.filter(fw => activeFrameworkIds.has(fw.id)).length}/{optional.length}</Badge>
                <span className="ml-auto">
                  {expandedGroup === "optional" ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {optional.map((fw) => {
                  const isActive = activeFrameworkIds.has(fw.id);
                  const hasPaidAddon = isPaidAddon(fw.id);
                  const price = hasPaidAddon ? getAddonPrice(fw.id) : 0;
                  const cat = getCategoryById(fw.category);
                  const CatIcon = cat?.icon;

                  return (
                    <div
                      key={fw.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                        isActive ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {CatIcon && (
                          <div className={`p-1.5 rounded-md ${cat?.bgColor}`}>
                            <CatIcon className={`h-3.5 w-3.5 ${cat?.color}`} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-foreground">{fw.name}</span>
                            {hasPaidAddon && price > 0 && (
                              <span className="text-[10px] text-muted-foreground font-medium">{formatKr(price)}/år</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => handleToggleFramework(fw.id, isActive)}
                        disabled={updatingFrameworkId === fw.id}
                      />
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>

            <div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={() => setEditFrameworksOpen(true)}
              >
                <Settings2 className="h-3.5 w-3.5" />
                Administrer alle regelverk
              </Button>
            </div>
          </section>

          {/* ── OPPSUMMERING ── */}
          {hasAnyCost && (
            <section className="space-y-3">
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Oppsummering</h3>
                <div className="space-y-1.5">
                  {systemsActive && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mynder Core</span>
                      <span className="text-foreground font-medium">
                        {formatKr(getModulePrice("systems", billingInterval))}
                        {billingInterval === "yearly" ? "/år" : "/mnd"}
                      </span>
                    </div>
                  )}
                  {vendorsActive && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Leverandørstyring</span>
                      <span className="text-foreground font-medium">
                        {formatKr(getModulePrice("vendors", billingInterval))}
                        {billingInterval === "yearly" ? "/år" : "/mnd"}
                      </span>
                    </div>
                  )}
                  {activeFrameworkAddons.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {activeFrameworkAddons.length} regelverk-tillegg
                      </span>
                      <span className="text-foreground font-medium">{formatKr(totalFrameworkCost)}/år</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-foreground">Totalt pakker</span>
                  <span className="text-foreground">
                    {formatKr(totalModuleCost)}{billingInterval === "yearly" ? "/år" : "/mnd"}
                    {totalFrameworkCost > 0 ? ` + ${formatKr(totalFrameworkCost)}/år` : ""}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* ── BETALINGSMETODE ── */}
          <section className="space-y-3">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Betalingsmetode</h3>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="card" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">Kort / Stripe Link</span>
                      <p className="text-xs text-muted-foreground">Umiddelbar betaling</p>
                    </div>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === "invoice" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="invoice" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">Faktura</span>
                      <p className="text-xs text-muted-foreground">30 dagers betalingsfrist</p>
                    </div>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </label>
                </RadioGroup>
              </CardContent>
            </Card>
          </section>

          {/* Framework dialogs */}
          <EditActiveFrameworksDialog
            open={editFrameworksOpen}
            onOpenChange={setEditFrameworksOpen}
            activeFrameworkIds={activeFrameworkIds}
            onToggle={handleToggleFramework}
            updatingId={updatingFrameworkId}
          />
          <FrameworkPurchaseDialog
            open={!!purchaseFramework}
            onOpenChange={(open) => { if (!open) setPurchaseFramework(null); }}
            framework={purchaseFramework}
            onConfirm={handlePurchaseConfirm}
            isLoading={!!updatingFrameworkId}
          />
          <FrameworkActivationDialog
            open={!!activationFramework}
            onOpenChange={(open) => { if (!open) setActivationFramework(null); }}
            framework={activationFramework}
          />
        </div>
      </main>
    </div>
  );
}
