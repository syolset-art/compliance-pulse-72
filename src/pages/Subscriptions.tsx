import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Check, CreditCard, FileText, ArrowRight,
  CheckCircle2, Building2, Loader2, Shield, Cpu, Truck,
  Globe, Bot, ClipboardList, FolderKanban, Settings2,
  ChevronDown, ChevronUp, Star, Info, Zap,
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
import {
  MODULES, FRAMEWORK_ADDONS, FREE_FRAMEWORKS,
  FREE_INCLUSIONS, formatKr, getModulePrice, getModuleAnnualSavingsKr,
  type ModuleId, type ModuleTier, type BillingInterval,
} from "@/lib/planConstants";

const MODULE_ICONS: Record<ModuleId, typeof Cpu> = {
  systems: Cpu,
  vendors: Truck,
};

function CreditsSection() {
  const { balance, monthlyAllowance, percentRemaining, isLow, isExhausted, isUnlimited, recentTransactions } = useCredits();

  if (isUnlimited) {
    return (
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Credits</h3>
              <p className="text-sm text-muted-foreground">Enterprise — ubegrenset credits</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const barColor = isExhausted ? "bg-destructive" : isLow ? "bg-warning" : "bg-primary";

  return (
    <Card className={isExhausted ? "border-destructive/30 bg-destructive/[0.03]" : isLow ? "border-warning/30 bg-warning/[0.03]" : "border-border"}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isExhausted ? "bg-destructive/10" : isLow ? "bg-warning/10" : "bg-primary/10"}`}>
              <Zap className={`h-5 w-5 ${isExhausted ? "text-destructive" : isLow ? "text-warning" : "text-primary"}`} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Credits</h3>
              <p className="text-sm text-muted-foreground">
                Brukes til Lara-analyse, dokumentklassifisering og risikovurdering
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${isExhausted ? "text-destructive" : isLow ? "text-warning" : "text-foreground"}`}>
              {balance}
            </p>
            <p className="text-xs text-muted-foreground">av {monthlyAllowance} denne måneden</p>
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.max(percentRemaining, 2)}%` }}
          />
        </div>
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
  );
}

export default function Subscriptions() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { billingInterval: currentInterval, addons, activateAddon, isActivatingAddon, selectedCoreAtOnboarding, selectedRegistriesAtOnboarding, needsUpgrade, currentTier, maxSystems, maxVendors } = useSubscription();

  const [billingInterval, setBillingInterval] = useState<BillingInterval>(currentInterval);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep] = useState<"confirm" | "processing" | "success">("confirm");

  const [selectedModule, setSelectedModule] = useState<ModuleId | null>(null);
  const [selectedModuleTier, setSelectedModuleTier] = useState<ModuleTier>("basis");

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

    // If activating, show purchase/confirm dialog first
    if (!currentlyActive) {
      setPurchaseFramework(fw);
      return;
    }

    // Deactivating — proceed directly
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

      // If activating a paid addon, also write to domain_addons
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

  const systemsActive = localStorage.getItem("system_premium_activated") === "true";
  const systemsTier = (localStorage.getItem("system_premium_tier") || "basis") as ModuleTier;
  const vendorsActive = localStorage.getItem("vendor_premium_activated") === "true";
  const vendorsTier = (localStorage.getItem("vendor_premium_tier") || "basis") as ModuleTier;

  const activeFrameworkAddons = addons?.filter(
    (a) => a.status === "active" && !FREE_FRAMEWORKS.includes(a.domain_id as any)
  ) || [];

  const handleSelectModule = (moduleId: ModuleId, tier: ModuleTier) => {
    setSelectedModule(moduleId);
    setSelectedModuleTier(tier);
    setStep("confirm");
    setShowConfirm(true);
  };

  const handleConfirmPayment = () => {
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      if (selectedModule === "systems") {
        localStorage.setItem("system_premium_activated", "true");
        localStorage.setItem("system_premium_tier", selectedModuleTier);
      } else if (selectedModule === "vendors") {
        localStorage.setItem("vendor_premium_activated", "true");
        localStorage.setItem("vendor_premium_tier", selectedModuleTier);
      }
    }, 2000);
  };

  const frameworkAddonList = Object.values(FRAMEWORK_ADDONS).filter(
    (a, i, arr) => arr.findIndex((b) => b.name === a.name) === i
  );

  // Total cost calculation
  const getTotalMonthlyCost = () => {
    let total = 0;
    if (systemsActive) total += MODULES.systems.tiers[systemsTier][billingInterval === "yearly" ? "yearly" : "monthly"];
    if (vendorsActive) total += MODULES.vendors.tiers[vendorsTier][billingInterval === "yearly" ? "yearly" : "monthly"];
    return total;
  };

  const totalFrameworkCost = activeFrameworkAddons.length * 50000;
  const hasAnyCost = systemsActive || vendorsActive || activeFrameworkAddons.length > 0;

  const activeCount = activeFrameworkIds.size;
  const totalCount = allFrameworkDefs.length;

  // Helper to check if a framework is a paid addon
  const isPaidAddon = (fwId: string) => !!FRAMEWORK_ADDONS[fwId];
  const getAddonPrice = (fwId: string) => FRAMEWORK_ADDONS[fwId]?.yearlyPriceKr || 0;

  return (
    <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
      {!isMobile && <div className="w-64 flex-shrink-0"><Sidebar /></div>}
      {isMobile && <Sidebar />}
      <main className="flex-1 overflow-y-auto pt-11">
        <div className="container max-w-4xl mx-auto p-6 space-y-10 pb-20">

          {/* Hero heading */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Abonnement</h1>
          </div>

          {/* ── CREDITS OVERVIEW ── */}
          <CreditsSection />

          {/* ── STEG 1: TRUST CENTER ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-success/10 text-success text-xs font-bold">1</span>
              <h2 className="text-lg font-semibold text-foreground">Trust Center</h2>
              <Badge className="bg-success/10 text-success border-0 text-[10px]">Gratis</Badge>
            </div>

            <Card className="border-success/30 bg-success/[0.03]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      <span className="font-semibold text-foreground">Aktiv — Shareable Trust Profile</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Din offentlige compliance-profil som du kan dele med kunder og partnere for due diligence.
                    </p>
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

          {/* ── STEG 2: DINE REGELVERK ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
              <h2 className="text-lg font-semibold text-foreground">Dine regelverk</h2>
              <Badge variant="secondary" className="text-[10px]">
                {activeCount} av {totalCount} aktive
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground pl-10">
              Basert på din virksomhetsprofil har vi gruppert regelverkene etter hva som er obligatorisk, anbefalt og valgfritt.
            </p>

            {/* ── Obligatoriske (inkludert) ── */}
            <div className="pl-10 space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Obligatoriske — alltid inkludert</h3>
              <div className="flex flex-wrap gap-2">
                {mandatory.map((fw) => {
                  const cat = getCategoryById(fw.category);
                  return (
                    <div
                      key={fw.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-success/20 bg-success/[0.04]"
                    >
                      <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                      <span className="text-xs font-medium text-foreground">{fw.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Anbefalt for din virksomhet ── */}
            <Collapsible
              open={expandedGroup === "recommended"}
              onOpenChange={(open) => setExpandedGroup(open ? "recommended" : null)}
              className="pl-10"
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
                            {isFree && (
                              <Badge className="bg-success/10 text-success border-0 text-[9px]">Inkludert</Badge>
                            )}
                            {hasPaidAddon && !isFree && (
                              <span className="text-[10px] text-muted-foreground font-medium">{formatKr(price)}/år</span>
                            )}
                          </div>
                          {fw.triggerQuestion && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{fw.triggerQuestion}</p>
                          )}
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

            {/* ── Valgfrie tillegg ── */}
            <Collapsible
              open={expandedGroup === "optional"}
              onOpenChange={(open) => setExpandedGroup(open ? "optional" : null)}
              className="pl-10"
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
                          {fw.triggerQuestion && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{fw.triggerQuestion}</p>
                          )}
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

            {/* Administrer alle regelverk */}
            <div className="pl-10">
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

          {/* ── STEG 3: MYNDER CORE ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
              <h2 className="text-lg font-semibold text-foreground">Mynder Core</h2>
            </div>

            {/* Contextual intro */}
            <div className="ml-10 rounded-lg border bg-primary/[0.03] border-primary/10 p-4 space-y-2">
              <p className="text-sm text-foreground font-medium">
                {(selectedCoreAtOnboarding || selectedRegistriesAtOnboarding)
                  ? "Du har tilgang til Mynder Core — oppgrader for å øke kapasiteten"
                  : "Mynder Core er kjerneplattformen som inkluderer systemer, arbeidsområder, oppgaver og compliance-oversikt"}
              </p>
              <p className="text-xs text-muted-foreground">
                {needsUpgrade("systems")
                  ? `Gratis-planen inkluderer inntil ${maxSystems} systemer. Oppgrader for flere.`
                  : "Full tilgang med ditt nåværende abonnement."}
              </p>
            </div>

            {/* Billing toggle */}
            <div className="flex items-center gap-3 ml-10">
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

            {/* Mynder Core (systems) tier cards */}
            {(() => {
              const mod = MODULES.systems;
              const Icon = MODULE_ICONS.systems;
              const isActive = systemsActive;
              const activeTier = systemsTier;

              return (
                <div className="space-y-3 ml-10">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{mod.displayName}</h3>
                    {isActive && (
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                        {activeTier === "premium" ? "Premium" : "Basis"} aktiv
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{mod.description}</p>

                  <div className="grid grid-cols-2 gap-3">
                    {(["basis", "premium"] as ModuleTier[]).map((tier) => {
                      const config = mod.tiers[tier];
                      const price = getModulePrice("systems", tier, billingInterval);
                      const isCurrent = isActive && activeTier === tier;
                      const isRecommended = tier === "premium";

                      return (
                        <Card
                          key={tier}
                          className={`relative ${
                            isCurrent
                              ? "border-primary ring-2 ring-primary/20"
                              : isRecommended
                              ? "border-primary/40"
                              : ""
                          }`}
                        >
                          {isRecommended && !isCurrent && (
                            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] px-2">
                              Anbefalt
                            </Badge>
                          )}
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-foreground">
                                {tier === "basis" ? "Basis" : "Premium"}
                              </span>
                              {isCurrent && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                            </div>

                            <div>
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-xl font-bold text-foreground">{formatKr(price)}</span>
                                <span className="text-xs text-muted-foreground">
                                  {billingInterval === "yearly" ? "/år" : "/mnd"}
                                </span>
                              </div>
                              {billingInterval === "yearly" && (
                                <p className="text-[10px] text-success mt-0.5">
                                  Spar {formatKr(getModuleAnnualSavingsKr("systems", tier))}/år
                                </p>
                              )}
                            </div>

                            <Separator />

                            <div className="space-y-1.5">
                              {config.features.map((feature) => (
                                <div key={feature} className="flex items-start gap-1.5">
                                  <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                                  <span className="text-[11px] text-foreground leading-tight">{feature}</span>
                                </div>
                              ))}
                            </div>

                            {isCurrent ? (
                              <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                                Aktiv
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="w-full text-xs gap-1.5"
                                variant={isRecommended ? "default" : "outline"}
                                onClick={() => handleSelectModule("systems", tier)}
                              >
                                <Sparkles className="h-3 w-3" />
                                Velg {tier === "basis" ? "Basis" : "Premium"}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Enterprise */}
            <Card className="border-dashed ml-10">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-foreground">Enterprise</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ubegrenset systemer og leverandører, dedikert kontaktperson, tilpassede integrasjoner og SLA.
                  </p>
                </div>
                <Button variant="outline" size="sm">Kontakt salg</Button>
              </CardContent>
            </Card>
          </section>

          {/* ── STEG 4: TILLEGGSMODULER ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
              <h2 className="text-lg font-semibold text-foreground">Tilleggsmoduler</h2>
              <Badge variant="secondary" className="text-[10px]">Valgfritt</Badge>
            </div>

            <p className="text-xs text-muted-foreground ml-10">
              Utvid plattformen med tilleggsmoduler som kan aktiveres uavhengig av Mynder Core.
            </p>

            {/* Vendor module */}
            {(() => {
              const mod = MODULES.vendors;
              const Icon = MODULE_ICONS.vendors;
              const isActive = vendorsActive;
              const activeTier = vendorsTier;

              return (
                <div className="space-y-3 ml-10">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{mod.displayName}</h3>
                    {isActive && (
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                        {activeTier === "premium" ? "Premium" : "Basis"} aktiv
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{mod.description}</p>

                  <div className="grid grid-cols-2 gap-3">
                    {(["basis", "premium"] as ModuleTier[]).map((tier) => {
                      const config = mod.tiers[tier];
                      const price = getModulePrice("vendors", tier, billingInterval);
                      const isCurrent = isActive && activeTier === tier;
                      const isRecommended = tier === "premium";

                      return (
                        <Card
                          key={tier}
                          className={`relative ${
                            isCurrent
                              ? "border-primary ring-2 ring-primary/20"
                              : isRecommended
                              ? "border-primary/40"
                              : ""
                          }`}
                        >
                          {isRecommended && !isCurrent && (
                            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] px-2">
                              Anbefalt
                            </Badge>
                          )}
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-foreground">
                                {tier === "basis" ? "Basis" : "Premium"}
                              </span>
                              {isCurrent && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                            </div>

                            <div>
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-xl font-bold text-foreground">{formatKr(price)}</span>
                                <span className="text-xs text-muted-foreground">
                                  {billingInterval === "yearly" ? "/år" : "/mnd"}
                                </span>
                              </div>
                              {billingInterval === "yearly" && (
                                <p className="text-[10px] text-success mt-0.5">
                                  Spar {formatKr(getModuleAnnualSavingsKr("vendors", tier))}/år
                                </p>
                              )}
                            </div>

                            <Separator />

                            <div className="space-y-1.5">
                              {config.features.map((feature) => (
                                <div key={feature} className="flex items-start gap-1.5">
                                  <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                                  <span className="text-[11px] text-foreground leading-tight">{feature}</span>
                                </div>
                              ))}
                            </div>

                            {isCurrent ? (
                              <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                                Aktiv
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="w-full text-xs gap-1.5"
                                variant={isRecommended ? "default" : "outline"}
                                onClick={() => handleSelectModule("vendors", tier)}
                              >
                                <Sparkles className="h-3 w-3" />
                                Velg {tier === "basis" ? "Basis" : "Premium"}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
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
                      <span className="text-muted-foreground">
                        Mynder Core ({systemsTier === "premium" ? "Premium" : "Basis"})
                      </span>
                      <span className="text-foreground font-medium">
                        {formatKr(MODULES.systems.tiers[systemsTier][billingInterval === "yearly" ? "yearly" : "monthly"])}
                        {billingInterval === "yearly" ? "/år" : "/mnd"}
                      </span>
                    </div>
                  )}
                  {vendorsActive && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Leverandør-tillegg ({vendorsTier === "premium" ? "Premium" : "Basis"})
                      </span>
                      <span className="text-foreground font-medium">
                        {formatKr(MODULES.vendors.tiers[vendorsTier][billingInterval === "yearly" ? "yearly" : "monthly"])}
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
                  <span className="text-foreground">Totalt moduler</span>
                  <span className="text-foreground">
                    {formatKr(getTotalMonthlyCost())}{billingInterval === "yearly" ? "/år" : "/mnd"}
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

          {/* Confirmation dialog */}
          <Dialog open={showConfirm} onOpenChange={(open) => { if (!open && step !== "processing") setShowConfirm(false); }}>
            <DialogContent className="sm:max-w-md">
              {step === "confirm" && selectedModule && (
                <>
                  <DialogHeader>
                    <DialogTitle>Bekreft aktivering</DialogTitle>
                    <DialogDescription>Gjennomgå bestillingen din.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Modul</span>
                      <span className="font-medium text-foreground">{MODULES[selectedModule].displayName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nivå</span>
                      <span className="font-medium text-foreground">{selectedModuleTier === "premium" ? "Premium" : "Basis"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pris</span>
                      <span className="font-medium text-foreground">
                        {formatKr(getModulePrice(selectedModule, selectedModuleTier, billingInterval))}
                        {billingInterval === "yearly" ? "/år" : "/mnd"}
                      </span>
                    </div>
                    {billingInterval === "yearly" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Besparelse</span>
                        <span className="font-medium text-success">
                          {formatKr(getModuleAnnualSavingsKr(selectedModule, selectedModuleTier))}/år
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kapasitet</span>
                      <span className="font-medium text-foreground">
                        Inntil {MODULES[selectedModule].tiers[selectedModuleTier].maxItems} {selectedModule === "systems" ? "systemer" : "leverandører"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Avbryt</Button>
                    <Button className="flex-1" onClick={handleConfirmPayment}>
                      {paymentMethod === "card" ? "Betal nå" : "Send faktura"}
                    </Button>
                  </div>
                </>
              )}

              {step === "processing" && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Behandler betaling…</p>
                </div>
              )}

              {step === "success" && selectedModule && (
                <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Aktivering vellykket!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {paymentMethod === "card"
                        ? `${MODULES[selectedModule].displayName} (${selectedModuleTier === "premium" ? "Premium" : "Basis"}) er nå aktiv.`
                        : "Fakturaen er sendt. Modulen aktiveres når betalingen er mottatt."}
                    </p>
                  </div>
                  <Button className="mt-2" onClick={() => setShowConfirm(false)}>Lukk</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

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
