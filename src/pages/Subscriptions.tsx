import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Check, CreditCard, FileText, ArrowRight,
  CheckCircle2, Shield, Cpu, Truck,
  ChevronDown, ChevronUp, Star, Zap, Package,
  Calendar, TrendingUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { frameworks as allFrameworkDefs, getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
import { EditActiveFrameworksDialog } from "@/components/regulations/EditActiveFrameworksDialog";
import { FrameworkActivationDialog } from "@/components/dialogs/FrameworkActivationDialog";
import { FrameworkPurchaseDialog } from "@/components/dialogs/FrameworkPurchaseDialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useSubscription } from "@/hooks/useSubscription";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActivatedServices } from "@/hooks/useActivatedServices";
import { toast } from "sonner";
import {
  PLAN_TIERS, ORDERED_TIERS, MODULES, FRAMEWORK_ADDONS, FREE_FRAMEWORKS,
  CREDIT_PACKAGES, formatKr,
  type PlanTier, type ModuleId,
} from "@/lib/planConstants";
import { Settings2 } from "lucide-react";
import { OrganizationContextBanner } from "@/components/OrganizationContextBanner";

// ─── Plan Comparison Cards ──────────────────────────────────────────

const PLAN_FEATURES: Record<PlanTier, string[]> = {
  free: [
    "Trust Center (alle undermenyer)",
    "GDPR + ISO 27001 regelverk",
    "10 credits/mnd",
    "Synlig i Mynder Trust Engine",
  ],
  basis: [
    "Alt i Gratis +",
    "100 credits/mnd",
    "Velg komponenter fritt",
    "Prioritert onboarding",
  ],
  premium: [
    "Alt i Basis +",
    "300 credits/mnd",
    "Prioritert support",
    "Avansert rapportering",
  ],
  enterprise: [],
};

const PLAN_ICONS: Record<PlanTier, typeof Cpu> = {
  free: Shield,
  basis: Cpu,
  premium: Truck,
  enterprise: Star,
};

function PlanCard({ tier, currentTier }: { tier: PlanTier; currentTier: PlanTier }) {
  const plan = PLAN_TIERS[tier];
  const isCurrent = tier === currentTier;
  const isUpgrade = ORDERED_TIERS.indexOf(tier) > ORDERED_TIERS.indexOf(currentTier);
  const Icon = PLAN_ICONS[tier];
  const features = PLAN_FEATURES[tier];
  const { activateService } = useActivatedServices();

  const handleUpgrade = () => {
    // Activate corresponding modules for the plan
    if (tier === "basis" || tier === "premium") {
      activateService("module-systems", "user");
    }
    if (tier === "premium") {
      activateService("module-vendors", "user");
    }
    toast.success(`Oppgradert til ${plan.displayName}!`);
  };

  if (tier === "enterprise") return null;

  return (
    <Card className={`relative transition-all ${
      isCurrent ? "border-primary ring-1 ring-primary/20" : "border-border"
    } ${tier === "premium" ? "bg-primary/[0.02]" : ""}`}>
      {tier === "premium" && (
        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[13px] px-3">
          Mest populær
        </Badge>
      )}
      {isCurrent && (
        <Badge className="absolute -top-2.5 right-3 bg-success/10 text-success border-success/20 text-[13px] px-2">
          Nåværende
        </Badge>
      )}
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
            isCurrent ? "bg-primary/10" : "bg-muted"
          }`}>
            <Icon className={`h-4.5 w-4.5 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">{plan.displayName}</h3>
            <p className="text-[13px] text-muted-foreground leading-snug">{plan.description}</p>
          </div>
        </div>

        <div>
          {plan.monthly > 0 ? (
            <>
              <span className="text-2xl font-bold text-foreground">{formatKr(plan.monthly)}</span>
              <span className="text-sm text-muted-foreground">/mnd</span>
            </>
          ) : (
            <span className="text-2xl font-bold text-foreground">Gratis</span>
          )}
        </div>

        <div className="space-y-2">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2">
              <Check className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${i === 0 && tier !== "free" ? "text-primary" : "text-success"}`} />
              <span className={`text-xs leading-tight ${i === 0 && tier !== "free" ? "font-semibold text-foreground" : "text-foreground"}`}>
                {feature}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span><strong className="text-foreground">{plan.monthlyCredits}</strong> credits/mnd inkludert</span>
        </div>

        {isUpgrade ? (
          <Button className="w-full gap-2" onClick={handleUpgrade}>
            <Sparkles className="h-3.5 w-3.5" />
            Oppgrader til {plan.displayName}
          </Button>
        ) : isCurrent ? (
          <Button variant="outline" className="w-full gap-2" disabled>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Aktiv plan
          </Button>
        ) : (
          <Button variant="ghost" className="w-full" disabled>
            Inkludert i din plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Hero Status Banner ──────────────────────────────────────────────

function PlanStatusBanner() {
  const { currentTier, subscription } = useSubscription();
  const { balance, monthlyAllowance, percentRemaining, isLow, isExhausted, recentTransactions } = useCredits();
  const tierConfig = PLAN_TIERS[currentTier];

  const periodEnd = subscription?.current_period_end;
  const daysLeft = periodEnd
    ? Math.max(0, Math.ceil((new Date(periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const barColor = isExhausted ? "bg-destructive" : isLow ? "bg-warning" : "bg-primary";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Current Plan Card */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nåværende plan</p>
                <h3 className="text-lg font-bold text-foreground">{tierConfig.displayName}</h3>
              </div>
            </div>
            <Badge className="bg-success/10 text-success border-success/20 text-[13px]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Aktiv
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Credits inkludert</p>
                <p className="text-sm font-semibold text-foreground">{tierConfig.monthlyCredits}/mnd</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Fornyes</p>
                <p className="text-sm font-semibold text-foreground">
                  {daysLeft !== null ? `om ${daysLeft} dager` : "—"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credits Overview Card */}
      <Card className={isExhausted ? "border-destructive/30 bg-destructive/[0.03]" : isLow ? "border-warning/30 bg-warning/[0.03]" : "border-border"}>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isExhausted ? "bg-destructive/10" : isLow ? "bg-warning/10" : "bg-primary/10"}`}>
                <Zap className={`h-4 w-4 ${isExhausted ? "text-destructive" : isLow ? "text-warning" : "text-primary"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Credits tilgjengelig</p>
                <h3 className={`text-lg font-bold ${isExhausted ? "text-destructive" : isLow ? "text-warning" : "text-foreground"}`}>
                  {balance} <span className="text-sm font-normal text-muted-foreground">av {monthlyAllowance}</span>
                </h3>
              </div>
            </div>
            {isExhausted && (
              <Badge variant="destructive" className="text-[13px]">Oppbrukt</Badge>
            )}
            {isLow && !isExhausted && (
              <Badge className="bg-warning/10 text-warning border-warning/20 text-[13px]">Lite igjen</Badge>
            )}
          </div>

          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.max(percentRemaining, 2)}%` }}
            />
          </div>
          <p className="text-[13px] text-muted-foreground">
            {percentRemaining}% gjenstår av månedlige credits
          </p>

          <div className="flex gap-2">
            <Button size="sm" variant={isExhausted ? "default" : "outline"} className="flex-1 gap-1.5 text-xs" asChild>
              <a href="#credits-section">
                <Sparkles className="h-3 w-3" />
                Kjøp credits
              </a>
            </Button>
            <Button size="sm" variant="ghost" className="text-xs gap-1.5" asChild>
              <a href="#credits-section">
                <TrendingUp className="h-3 w-3" />
                Historikk
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Credits Section (Purchase & History) ────────────────────────────

function CreditsSection() {
  const { balance, monthlyAllowance, percentRemaining, isLow, isExhausted, recentTransactions, purchaseCredits, isPurchasing } = useCredits();
  const [showPackages, setShowPackages] = useState(false);

  return (
    <div className="space-y-3" id="credits-section">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">Kjøp ekstra credits</h3>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => setShowPackages(!showPackages)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {showPackages ? "Skjul pakker" : "Vis pakker"}
            </Button>
          </div>

          {showPackages && (
            <div className="grid grid-cols-3 gap-3">
              {CREDIT_PACKAGES.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`relative cursor-pointer transition-all hover:border-primary/40 ${pkg.popular ? "border-primary ring-1 ring-primary/20" : ""}`}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[13px] px-2">
                      Populær
                    </Badge>
                  )}
                  <CardContent className="p-3 text-center space-y-2">
                    <p className="text-sm font-bold text-foreground">{pkg.name}</p>
                    <p className="text-lg font-bold text-primary">{pkg.credits}</p>
                    <p className="text-[13px] text-muted-foreground">credits</p>
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

// ─── Main Page ───────────────────────────────────────────────────────

export default function Subscriptions() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { addons, activateAddon, currentTier } = useSubscription();
  const { isServiceActive, activateService } = useActivatedServices();

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [editFrameworksOpen, setEditFrameworksOpen] = useState(false);
  const [activationFramework, setActivationFramework] = useState<Framework | null>(null);
  const [purchaseFramework, setPurchaseFramework] = useState<Framework | null>(null);
  const [updatingFrameworkId, setUpdatingFrameworkId] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("recommended");

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

  const displayTiers: PlanTier[] = ["free", "basis", "premium"];

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
              Velg pakken som passer din virksomhet — betal kun for det du bruker.
            </p>
          </div>

          {/* ── STATUS BANNER ── */}
          <PlanStatusBanner />

          {/* ── PLAN COMPARISON ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Velg din pakke</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayTiers.map((tier) => (
                <PlanCard key={tier} tier={tier} currentTier={currentTier} />
              ))}
            </div>

            {/* Enterprise */}
            <Card className="border-dashed">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-foreground">Enterprise</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Skreddersydd volum, dedikert kontaktperson, integrasjoner og SLA.
                  </p>
                </div>
                <Button variant="outline" size="sm">Kontakt salg</Button>
              </CardContent>
            </Card>

            {/* Credits explanation */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-start gap-3">
                <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Hva er credits?</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Credits brukes når Mynder utfører AI-drevet arbeid for deg — som analyse av regelverk, klassifisering av dokumenter, risikovurderinger og rapportgenerering.
                    En liten bedrift med få systemer bruker færre credits enn en større virksomhet med mange lover, leverandører og systemer å holde oversikt over.
                    Du kan alltid kjøpe ekstra credits hvis du trenger mer.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── KOMPONENTER ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Komponenter</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Valgfrie tillegg som trekker credits basert på bruk</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["systems", "vendors"] as ModuleId[]).map((modId) => {
                const mod = MODULES[modId];
                const serviceKey = modId === "systems" ? "module-systems" : "module-vendors";
                const active = isServiceActive(serviceKey);
                const ModIcon = modId === "systems" ? Cpu : Truck;

                return (
                  <Card key={modId} className={`transition-all ${active ? "border-primary/30 bg-primary/[0.02]" : "border-border"}`}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${active ? "bg-primary/10" : "bg-muted"}`}>
                          <ModIcon className={`h-4.5 w-4.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground text-sm">{mod.displayName}</h3>
                          <p className="text-xs text-muted-foreground">{mod.description}</p>
                        </div>
                        {active && (
                          <Badge variant="outline" className="border-success/30 text-success text-[13px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Aktiv
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {mod.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-success shrink-0" />
                            <span className="text-xs text-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {!active && (
                        <Button
                          className="w-full gap-2"
                          size="sm"
                          onClick={() => {
                            activateService(serviceKey, "user");
                            toast.success(`${mod.displayName} aktivert! Komponenten trekker credits basert på din bruk.`);
                          }}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Aktiver {mod.displayName}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground text-center italic">
              Liten bedrift? Færre credits. Stor virksomhet? Mynders agenter skalerer med deg — du betaler kun for det du bruker.
            </p>
          </section>

          {/* ── CREDITS OVERVIEW ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Credits</h2>
            </div>
            <CreditsSection />
          </section>

          {/* ── REGELVERK ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Regelverk</h2>
              <Badge variant="secondary" className="text-[13px]">
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
                <Badge variant="outline" className="text-[13px] ml-1">{recommended.filter(fw => activeFrameworkIds.has(fw.id)).length}/{recommended.length}</Badge>
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
                    <div key={fw.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${isActive ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"}`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {CatIcon && <div className={`p-1.5 rounded-md ${cat?.bgColor}`}><CatIcon className={`h-3.5 w-3.5 ${cat?.color}`} /></div>}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-foreground">{fw.name}</span>
                            {isFree && <Badge className="bg-success/10 text-success border-0 text-[13px]">Inkludert</Badge>}
                            {hasPaidAddon && !isFree && <span className="text-[13px] text-muted-foreground font-medium">{formatKr(price)}/år</span>}
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
                <Badge variant="outline" className="text-[13px] ml-1">{optional.filter(fw => activeFrameworkIds.has(fw.id)).length}/{optional.length}</Badge>
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
                    <div key={fw.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${isActive ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"}`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {CatIcon && <div className={`p-1.5 rounded-md ${cat?.bgColor}`}><CatIcon className={`h-3.5 w-3.5 ${cat?.color}`} /></div>}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-foreground">{fw.name}</span>
                            {hasPaidAddon && price > 0 && <span className="text-[13px] text-muted-foreground font-medium">{formatKr(price)}/år</span>}
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
