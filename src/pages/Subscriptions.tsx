import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Check, CreditCard, FileText, ArrowRight,
  CheckCircle2, Shield, Crown, Zap, Star,
  ChevronDown, ChevronUp, Settings2, Building2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { frameworks as allFrameworkDefs, getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
import { EditActiveFrameworksDialog } from "@/components/regulations/EditActiveFrameworksDialog";
import { FrameworkActivationDialog } from "@/components/dialogs/FrameworkActivationDialog";
import { FrameworkPurchaseDialog } from "@/components/dialogs/FrameworkPurchaseDialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useSubscription } from "@/hooks/useSubscription";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import {
  PLANS, ORDERED_PLANS, FRAMEWORK_ADDONS, FREE_FRAMEWORKS,
  formatKr, getYearlySavingsKr, planNameToTier, PLAN_TIERS,
  type PlanId, type BillingInterval,
} from "@/lib/planConstants";
import { OrganizationContextBanner } from "@/components/OrganizationContextBanner";
import { cn } from "@/lib/utils";

// Map current legacy tier to new PlanId for highlighting
function tierToPlanId(tierName: string | undefined): PlanId {
  const tier = planNameToTier(tierName);
  if (tier === "free") return "starter";
  if (tier === "enterprise") return "enterprise";
  return "professional";
}

// ─── Plan Card ───────────────────────────────────────────────────────

function PlanCard({
  plan,
  currentPlanId,
  interval,
  onSelect,
}: {
  plan: typeof PLANS[PlanId];
  currentPlanId: PlanId;
  interval: BillingInterval;
  onSelect: (planId: PlanId) => void;
}) {
  const isCurrent = plan.id === currentPlanId;
  const isContact = plan.monthlyPriceKr === -1;
  const price = interval === "yearly" ? plan.yearlyPriceKr : plan.monthlyPriceKr;
  const savings = getYearlySavingsKr(plan.id);

  const Icon = plan.id === "starter" ? Shield : plan.id === "professional" ? Crown : Star;

  return (
    <Card
      className={cn(
        "relative transition-all flex flex-col",
        plan.popular && "border-primary ring-1 ring-primary/30 shadow-lg scale-[1.02]",
        !plan.popular && isCurrent && "border-primary/50 ring-1 ring-primary/20",
        !plan.popular && !isCurrent && "border-border"
      )}
    >
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-0.5">
          <Star className="h-3 w-3 mr-1 fill-current" />
          Mest populær
        </Badge>
      )}
      {isCurrent && (
        <Badge className="absolute -top-3 right-3 bg-success/10 text-success border-success/20 text-xs px-2">
          Nåværende plan
        </Badge>
      )}

      <CardContent className="p-6 space-y-5 flex-1 flex flex-col">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center",
            plan.popular ? "bg-primary/10" : "bg-muted"
          )}>
            <Icon className={cn("h-5 w-5", plan.popular ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">{plan.displayName}</h3>
            <p className="text-xs text-muted-foreground">{plan.tagline}</p>
          </div>
        </div>

        {/* Price */}
        <div className="min-h-[64px]">
          {isContact ? (
            <div>
              <span className="text-3xl font-bold text-foreground">Ta kontakt</span>
              <p className="text-xs text-muted-foreground mt-1">Skreddersydd pris</p>
            </div>
          ) : price === 0 ? (
            <div>
              <span className="text-3xl font-bold text-foreground">Gratis</span>
              <p className="text-xs text-muted-foreground mt-1">Ingen kortinformasjon</p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{formatKr(price)}</span>
                <span className="text-sm text-muted-foreground">
                  /{interval === "yearly" ? "år" : "mnd"}
                </span>
              </div>
              {interval === "yearly" && savings > 0 && (
                <p className="text-xs text-success mt-1 font-medium">
                  Spar {formatKr(savings)} per år
                </p>
              )}
              {interval === "monthly" && (
                <p className="text-xs text-muted-foreground mt-1">
                  eller {formatKr(plan.yearlyPriceKr)}/år
                </p>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-2 flex-1">
          {plan.features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2">
              <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span className="text-sm text-foreground leading-snug">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {isCurrent ? (
          <Button variant="outline" className="w-full gap-2" disabled>
            <CheckCircle2 className="h-4 w-4" />
            Aktiv plan
          </Button>
        ) : isContact ? (
          <Button variant="outline" className="w-full gap-2" onClick={() => onSelect(plan.id)}>
            <Building2 className="h-4 w-4" />
            {plan.ctaLabel}
          </Button>
        ) : (
          <Button
            className={cn("w-full gap-2", plan.popular && "shadow-md")}
            variant={plan.popular ? "default" : "outline"}
            onClick={() => onSelect(plan.id)}
          >
            <Sparkles className="h-4 w-4" />
            {plan.ctaLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function Subscriptions() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { addons, activateAddon, currentTier, subscription } = useSubscription();
  const tierConfig = PLAN_TIERS[currentTier];

  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [editFrameworksOpen, setEditFrameworksOpen] = useState(false);
  const [activationFramework, setActivationFramework] = useState<Framework | null>(null);
  const [purchaseFramework, setPurchaseFramework] = useState<Framework | null>(null);
  const [updatingFrameworkId, setUpdatingFrameworkId] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("recommended");

  const currentPlanId = tierToPlanId(subscription?.plan?.name);

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

  const handleSelectPlan = (planId: PlanId) => {
    if (planId === "enterprise") {
      toast.info("Ta kontakt med salg på sales@mynder.no for tilbud.");
      return;
    }
    if (planId === currentPlanId) return;
    toast.success(`Du har valgt ${PLANS[planId].displayName}-planen!`);
  };

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
        await supabase.from("selected_frameworks").update({ is_selected: !currentlyActive }).eq("id", existing.id);
      } else {
        await supabase.from("selected_frameworks").insert({
          framework_id: fw.id, framework_name: fw.name, category: fw.category,
          is_mandatory: fw.isMandatory || false, is_recommended: fw.isRecommended || false, is_selected: true,
        });
      }
      if (!currentlyActive && FRAMEWORK_ADDONS[frameworkId]) activateAddon(frameworkId);
      await refetchFrameworks();
      if (!currentlyActive) setActivationFramework(fw);
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

  const isPaidAddon = (fwId: string) => !!FRAMEWORK_ADDONS[fwId];
  const getAddonPrice = (fwId: string) => FRAMEWORK_ADDONS[fwId]?.yearlyPriceKr || 0;
  const activeCount = activeFrameworkIds.size;
  const totalCount = allFrameworkDefs.length;

  return (
    <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
      {!isMobile && <div className="w-64 flex-shrink-0"><Sidebar /></div>}
      {isMobile && <Sidebar />}
      <main className="flex-1 overflow-y-auto pt-11">
        <div className="container max-w-5xl mx-auto p-6 space-y-10 pb-20">

          {/* Hero heading */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Abonnement</h1>
            <OrganizationContextBanner />
            <p className="text-sm text-muted-foreground mt-1">
              Velg planen som passer din virksomhet — forutsigbar månedspris uten skjulte kostnader.
            </p>
          </div>

          {/* ── CURRENT PLAN BANNER ── */}
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nåværende plan</p>
                  <h3 className="text-lg font-bold text-foreground">{tierConfig.displayName}</h3>
                </div>
              </div>
              <Badge className="bg-success/10 text-success border-success/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Aktiv
              </Badge>
            </CardContent>
          </Card>

          {/* ── BILLING INTERVAL TOGGLE ── */}
          <div className="flex justify-center">
            <div className="inline-flex items-center bg-muted rounded-full p-1 border border-border">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={cn(
                  "px-5 py-1.5 text-sm font-medium rounded-full transition-all",
                  billingInterval === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Månedlig
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={cn(
                  "px-5 py-1.5 text-sm font-medium rounded-full transition-all flex items-center gap-2",
                  billingInterval === "yearly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Årlig
                <Badge className="bg-success/10 text-success border-0 text-[11px] px-1.5">
                  Spar 2 mnd
                </Badge>
              </button>
            </div>
          </div>

          {/* ── PLAN CARDS ── */}
          <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {ORDERED_PLANS.map((planId) => (
                <PlanCard
                  key={planId}
                  plan={PLANS[planId]}
                  currentPlanId={currentPlanId}
                  interval={billingInterval}
                  onSelect={handleSelectPlan}
                />
              ))}
            </div>

            {/* Plan info note */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-start gap-3">
                <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Alt AI-arbeid er inkludert</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Lara, slette-agenten og alle AI-drevne analyser er inkludert i planen din. Du betaler én forutsigbar pris hver måned — ingen telling av credits eller overraskelser på fakturaen.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── REGELVERK (TILLEGG) ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Regelverk — tillegg</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  GDPR og ISO 27001 er alltid inkludert. Andre regelverk legges til som tillegg.
                </p>
              </div>
              <Badge variant="secondary" className="text-xs ml-auto">
                {activeCount} av {totalCount} aktive
              </Badge>
            </div>

            {/* Inkludert */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inkludert — alltid gratis</h3>
              <div className="flex flex-wrap gap-2">
                {mandatory.map((fw) => (
                  <div key={fw.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-success/20 bg-success/[0.04]">
                    <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                    <span className="text-xs font-medium text-foreground">{fw.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Anbefalt */}
            <Collapsible open={expandedGroup === "recommended"} onOpenChange={(open) => setExpandedGroup(open ? "recommended" : null)}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full group">
                <Star className="h-3.5 w-3.5 text-primary shrink-0" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Anbefalt for din virksomhet</h3>
                <Badge variant="outline" className="text-xs ml-1">{recommended.filter(fw => activeFrameworkIds.has(fw.id)).length}/{recommended.length}</Badge>
                <span className="ml-auto">
                  {expandedGroup === "recommended" ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {recommended.map((fw) => {
                  const isActive = activeFrameworkIds.has(fw.id);
                  const hasPaidAddon = isPaidAddon(fw.id);
                  const price = hasPaidAddon ? getAddonPrice(fw.id) : 0;
                  const isFree = (FREE_FRAMEWORKS as readonly string[]).includes(fw.id);
                  const cat = getCategoryById(fw.category);
                  const CatIcon = cat?.icon;
                  return (
                    <div key={fw.id} className={cn(
                      "flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors",
                      isActive ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
                    )}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {CatIcon && <div className={`p-1.5 rounded-md ${cat?.bgColor}`}><CatIcon className={`h-3.5 w-3.5 ${cat?.color}`} /></div>}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-foreground">{fw.name}</span>
                            {isFree && <Badge className="bg-success/10 text-success border-0 text-xs">Inkludert</Badge>}
                            {hasPaidAddon && !isFree && <span className="text-xs text-muted-foreground font-medium">{formatKr(price)}/år</span>}
                          </div>
                        </div>
                      </div>
                      <Switch checked={isActive} onCheckedChange={() => handleToggleFramework(fw.id, isActive)} disabled={updatingFrameworkId === fw.id} />
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>

            {/* Valgfrie */}
            <Collapsible open={expandedGroup === "optional"} onOpenChange={(open) => setExpandedGroup(open ? "optional" : null)}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full group">
                <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valgfrie tillegg</h3>
                <Badge variant="outline" className="text-xs ml-1">{optional.filter(fw => activeFrameworkIds.has(fw.id)).length}/{optional.length}</Badge>
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
                    <div key={fw.id} className={cn(
                      "flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors",
                      isActive ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
                    )}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {CatIcon && <div className={`p-1.5 rounded-md ${cat?.bgColor}`}><CatIcon className={`h-3.5 w-3.5 ${cat?.color}`} /></div>}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-foreground">{fw.name}</span>
                            {hasPaidAddon && price > 0 && <span className="text-xs text-muted-foreground font-medium">{formatKr(price)}/år</span>}
                          </div>
                        </div>
                      </div>
                      <Switch checked={isActive} onCheckedChange={() => handleToggleFramework(fw.id, isActive)} disabled={updatingFrameworkId === fw.id} />
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>

            <div>
              <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setEditFrameworksOpen(true)}>
                <Settings2 className="h-3.5 w-3.5" />
                Administrer alle regelverk
              </Button>
            </div>
          </section>

          {/* ── BETALINGSMETODE ── */}
          <section className="space-y-3">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Betalingsmetode</h3>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                  <label className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border"
                  )}>
                    <RadioGroupItem value="card" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">Kort / Stripe Link</span>
                      <p className="text-xs text-muted-foreground">Umiddelbar betaling</p>
                    </div>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </label>
                  <label className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    paymentMethod === "invoice" ? "border-primary bg-primary/5" : "border-border"
                  )}>
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
            open={editFrameworksOpen} onOpenChange={setEditFrameworksOpen}
            activeFrameworkIds={activeFrameworkIds} onToggle={handleToggleFramework} updatingId={updatingFrameworkId}
          />
          <FrameworkPurchaseDialog
            open={!!purchaseFramework} onOpenChange={(open) => { if (!open) setPurchaseFramework(null); }}
            framework={purchaseFramework} onConfirm={handlePurchaseConfirm} isLoading={!!updatingFrameworkId}
          />
          <FrameworkActivationDialog
            open={!!activationFramework} onOpenChange={(open) => { if (!open) setActivationFramework(null); }}
            framework={activationFramework}
          />
        </div>
      </main>
    </div>
  );
}
