import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Check, CreditCard, FileText,
  CheckCircle2, Shield, Crown, Zap, Star,
  Settings2, Building2,
  LayoutGrid, Server, BookOpen, Briefcase, Users, ShieldCheck, Globe,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { frameworks as allFrameworkDefs, getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
import { EditActiveFrameworksDialog } from "@/components/regulations/EditActiveFrameworksDialog";
import { FrameworkActivationDialog } from "@/components/dialogs/FrameworkActivationDialog";
import { FrameworkPurchaseDialog } from "@/components/dialogs/FrameworkPurchaseDialog";
import { Switch } from "@/components/ui/switch";
import { useSubscription } from "@/hooks/useSubscription";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import {
  PLANS, ORDERED_PLANS, FRAMEWORK_ADDONS, FREE_FRAMEWORKS,
  formatKr, getYearlySavingsKr, planNameToTier, PLAN_TIERS,
  getFrameworkMonthlyPrice,
  CORE_TIERS, DEFAULT_CORE_TIER_ID, getCoreTier, getNextCoreTier,
  VENDOR_TIERS, DEFAULT_VENDOR_TIER_ID, getVendorTier, getNextVendorTier,
  type PlanId, type BillingInterval, type CoreTierId, type VendorTierId,
  TRUST_CENTER_PRICE_KR,
} from "@/lib/planConstants";
import { OrganizationContextBanner } from "@/components/OrganizationContextBanner";
import { ModuleCard } from "@/components/subscriptions/ModuleCard";
import { TermsGateDialog } from "@/components/legal/TermsGateDialog";
import { ModuleInfoDialog } from "@/components/subscriptions/ModuleInfoDialog";
import type { ModuleKey } from "@/lib/moduleInfo";
import { ChangeCoreTierDialog } from "@/components/dialogs/ChangeCoreTierDialog";
import { ConfirmCoreTierChangeDialog } from "@/components/dialogs/ConfirmCoreTierChangeDialog";
import { ChangeVendorTierDialog } from "@/components/dialogs/ChangeVendorTierDialog";
import { ConfirmVendorTierChangeDialog } from "@/components/dialogs/ConfirmVendorTierChangeDialog";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";
import { cn } from "@/lib/utils";
import {
  getModuleStates,
  getDeactivatedModules,
  cancelModule,
  resumeModule,
  activateModule,
  getModuleTier,
  setModuleTier,
  scheduleModuleTier,
  clearScheduledTier,
  formatPeriodEnd,
  formatDateLong,
  getPeriodEnd,
  type ModuleStateMap,
  type CancellationMeta,
} from "@/lib/moduleActivationState";
import { RetireModuleDialog } from "@/components/subscriptions/RetireModuleDialog";
import { ModuleChangeReceiptSheet, type ModuleChangeReceipt } from "@/components/subscriptions/ModuleChangeReceiptSheet";
import { useTerms } from "@/hooks/useTerms";



// Map current legacy tier to new PlanId for highlighting
function tierToPlanId(tierName: string | undefined): PlanId {
  const tier = planNameToTier(tierName);
  if (tier === "free") return "starter";
  if (tier === "enterprise") return "enterprise";
  return "professional";
}

// ─── Plan Card (used in the change-plan dialog) ────────────────────────

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
        <Badge className="absolute -top-3 right-3 bg-emerald-500/10 text-emerald-600 border-emerald-200 text-xs px-2">
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
                <p className="text-xs text-emerald-600 mt-1 font-medium">
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

        <div className="space-y-2 flex-1">
          {plan.features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2">
              <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span className="text-sm text-foreground leading-snug">{feature}</span>
            </div>
          ))}
        </div>

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
  const currentPlanId = tierToPlanId(subscription?.plan?.name);
  const planConfig = PLANS[currentPlanId];

  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [editFrameworksOpen, setEditFrameworksOpen] = useState(false);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [activationFramework, setActivationFramework] = useState<Framework | null>(null);
  const [purchaseFramework, setPurchaseFramework] = useState<Framework | null>(null);
  const [updatingFrameworkId, setUpdatingFrameworkId] = useState<string | null>(null);
  const [deactivatedModules, setDeactivatedModules] = useState<Set<string>>(() => getDeactivatedModules());
  const [moduleStates, setModuleStates] = useState<ModuleStateMap>(() => getModuleStates());
  const [confirmDeactivate, setConfirmDeactivate] = useState<{ id: string; title: string } | null>(null);
  const [coreTierId, setCoreTierId] = useState<CoreTierId>(
    () => (getModuleTier("core") as CoreTierId) ?? DEFAULT_CORE_TIER_ID
  );
  const [changeCoreTierOpen, setChangeCoreTierOpen] = useState(false);
  const [pendingCoreTierId, setPendingCoreTierId] = useState<CoreTierId | null>(null);
  const [vendorTierId, setVendorTierId] = useState<VendorTierId>(
    () => (getModuleTier("vendors") as VendorTierId) ?? DEFAULT_VENDOR_TIER_ID
  );
  const [changeVendorTierOpen, setChangeVendorTierOpen] = useState(false);
  const [pendingVendorTierId, setPendingVendorTierId] = useState<VendorTierId | null>(null);
  const [readMoreKey, setReadMoreKey] = useState<ModuleKey | null>(null);
  const [confirmActivate, setConfirmActivate] = useState<{ id: string; title: string } | null>(null);
  const [vendorTierMode, setVendorTierMode] = useState<"change" | "activate">("change");
  const [receipt, setReceipt] = useState<ModuleChangeReceipt | null>(null);
  const { current: currentTerms } = useTerms();

  const scheduledCore = moduleStates["core"]?.scheduledTierId
    ? { tier: getCoreTier(moduleStates["core"]!.scheduledTierId as CoreTierId), at: moduleStates["core"]!.scheduledAt! }
    : null;
  const scheduledVendor = moduleStates["vendors"]?.scheduledTierId
    ? { tier: getVendorTier(moduleStates["vendors"]!.scheduledTierId as VendorTierId), at: moduleStates["vendors"]!.scheduledAt! }
    : null;

  const undoScheduledTier = (id: string, label: string) => {
    clearScheduledTier(id);
    setModuleStates(getModuleStates());
    toast.success(`Nedgraderingen av ${label} er angret.`);
  };

  const syncModuleState = () => {
    setModuleStates(getModuleStates());
    setDeactivatedModules(getDeactivatedModules());
  };

  const moduleStatusOf = (id: string): "active" | "inactive" | "pending_cancellation" => {
    if (deactivatedModules.has(id)) return "inactive";
    return moduleStates[id]?.status === "pending_cancellation" ? "pending_cancellation" : "active";
  };

  const cancelAtLabelOf = (id: string) =>
    moduleStates[id]?.cancelAt ? formatPeriodEnd(moduleStates[id]?.cancelAt) : undefined;

  const requestDeactivate = (id: string, title: string) => setConfirmDeactivate({ id, title });

  const confirmDeactivation = async (meta: CancellationMeta) => {
    if (!confirmDeactivate) return;
    const { id, title } = confirmDeactivate;
    const cancelAt = cancelModule(id, meta);
    syncModuleState();
    setConfirmDeactivate(null);

    try {
      await supabase.from("module_cancellations").insert({
        module_id: id,
        module_title: title,
        reason: meta.reason,
        reason_note: meta.reasonNote ?? null,
        competitor: meta.competitor ?? null,
        data_choice: meta.dataChoice,
        transfer_email: meta.transferEmail ?? null,
        effective_at: cancelAt,
        retention_until: meta.retentionUntil ?? null,
      });
    } catch (e) {
      console.error("Kunne ikke logge oppsigelsen", e);
    }

    toast(`${title} er sagt opp og er tilgjengelig til ${formatPeriodEnd(cancelAt)}.`, {
      description:
        meta.dataChoice === "transfer"
          ? `Dataene overføres til ${meta.transferEmail}.`
          : meta.dataChoice === "download"
            ? "Eksportlenken er gyldig i 7 dager."
            : `Dataene slettes ${formatDateLong(meta.retentionUntil)}.`,
      action: {
        label: "Angre",
        onClick: () => {
          resumeModule(id);
          syncModuleState();
          toast.success("Oppsigelsen er angret.");
        },
      },
      duration: 10000,
    });
  };


  const undoCancellation = (id: string) => {
    resumeModule(id);
    syncModuleState();
    toast.success("Oppsigelsen er angret. Modulen fortsetter som før.");
  };

  const reactivateModule = (id: string) => {
    activateModule(id);
    syncModuleState();
    toast.success("Modulen er aktivert og er klar til bruk.");
  };
  const requestActivate = (id: string, title: string) => setConfirmActivate({ id, title });


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

  const { data: companyProfile } = useQuery({
    queryKey: ["company-profile-sub"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_profile")
        .select("name, is_msp_partner, domain")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: systemsCount } = useQuery({
    queryKey: ["systems-count-sub"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("systems")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: assetsCount } = useQuery({
    queryKey: ["assets-count-sub"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: vendorCount } = useQuery({
    queryKey: ["vendor-count-sub"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("asset_type", "vendor");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const activeFrameworkIds = useMemo(() => {
    const ids = new Set<string>();
    selectedFrameworks?.forEach((sf: any) => {
      if (sf.is_selected) ids.add(sf.framework_id);
    });
    return ids;
  }, [selectedFrameworks]);

  const activeFrameworks = useMemo(() => {
    return allFrameworkDefs.filter((fw) => activeFrameworkIds.has(fw.id));
  }, [activeFrameworkIds]);

  const activeFrameworkCount = activeFrameworks.length;
  const paidActiveFrameworks = activeFrameworks.filter(
    (fw) => !!FRAMEWORK_ADDONS[fw.id] && !(FREE_FRAMEWORKS as readonly string[]).includes(fw.id)
  );
  const paidFrameworkCount = paidActiveFrameworks.length;
  const frameworkBreakdown = paidActiveFrameworks.map((fw) => ({
    label: FRAMEWORK_ADDONS[fw.id]?.name ?? fw.name ?? fw.id,
    priceKr: getFrameworkMonthlyPrice(fw.id),
  }));
  const frameworkMonthlyPrice = frameworkBreakdown.reduce((sum, item) => sum + item.priceKr, 0);

  const coreTier = getCoreTier(coreTierId);
  const corePrice = coreTier.monthlyPriceKr;
  const vendorTier = getVendorTier(vendorTierId);
  const vendorMonthlyPrice = vendorTier.monthlyPriceKr;
  const assetMonthlyPrice = 690;
  const partnerWorkspaceMonthlyPrice = 990;

  const { mode: workspaceMode, availableModes } = useWorkspaceMode();
  const hasPartnerAccess = !!companyProfile?.is_msp_partner
    || workspaceMode === "partner"
    || availableModes.includes("partner");
  const totalMonthly = useMemo(() => {
    let total = corePrice;
    if (activeFrameworkCount > 0) total += frameworkMonthlyPrice;
    if (!deactivatedModules.has("vendors")) total += vendorMonthlyPrice;
    if (!deactivatedModules.has("assets")) total += assetMonthlyPrice;
    if (!deactivatedModules.has("trust")) total += TRUST_CENTER_PRICE_KR;
    if (hasPartnerAccess && !deactivatedModules.has("partner")) total += partnerWorkspaceMonthlyPrice;
    return total;
  }, [corePrice, activeFrameworkCount, frameworkMonthlyPrice, vendorMonthlyPrice, assetMonthlyPrice, hasPartnerAccess, deactivatedModules]);

  const handleCoreTierSelect = (nextTierId: CoreTierId) => {
    setPendingCoreTierId(nextTierId);
    setChangeCoreTierOpen(false);
  };

  const handleCoreTierConfirm = () => {
    if (!pendingCoreTierId) return;
    const prev = coreTierId;
    const next = pendingCoreTierId;
    const prevTier = getCoreTier(prev);
    const nextTier = getCoreTier(next);
    const isUpgrade = nextTier.monthlyPriceKr >= prevTier.monthlyPriceKr;
    setPendingCoreTierId(null);

    let effectiveAt: string | undefined;
    if (isUpgrade) {
      setCoreTierId(next);
      setModuleTier("core", next);
    } else {
      effectiveAt = scheduleModuleTier("core", next);
    }
    setModuleStates(getModuleStates());

    setReceipt({
      moduleId: "core",
      moduleTitle: "Mynder Core",
      kind: isUpgrade ? "upgrade" : "downgrade",
      fromLabel: prevTier.label,
      toLabel: nextTier.label,
      monthlyPriceKr: nextTier.monthlyPriceKr,
      effectiveAt,
      termsVersion: currentTerms?.version,
      nextSteps: [
        { label: "Gå til Systemer", description: "Se og administrer systemene som teller mot nivået.", onClick: () => navigate("/systems") },
        { label: "Oppdag systemer", description: "La Lara kartlegge systemer automatisk fra Microsoft, Google eller regneark.", onClick: () => navigate("/systems?discover=1") },
        { label: "Se behandlingsprotokoll", description: "Kontroller at nye systemer er dekket i protokollen.", onClick: () => navigate("/protocols") },
      ],
      onUndo: () => {
        if (isUpgrade) {
          setCoreTierId(prev);
          setModuleTier("core", prev);
        } else {
          clearScheduledTier("core");
        }
        setModuleStates(getModuleStates());
        setReceipt(null);
        toast.success("Endringen er angret.");
      },
    });
  };

  const handleVendorTierSelect = (nextTierId: VendorTierId) => {
    setPendingVendorTierId(nextTierId);
    setChangeVendorTierOpen(false);
  };

  const handleVendorTierConfirm = () => {
    if (!pendingVendorTierId) return;
    const prev = vendorTierId;
    const next = pendingVendorTierId;
    const prevTier = getVendorTier(prev);
    const nextTier = getVendorTier(next);
    const isActivation = vendorTierMode === "activate";
    const isUpgrade = nextTier.monthlyPriceKr >= prevTier.monthlyPriceKr;
    setPendingVendorTierId(null);

    let effectiveAt: string | undefined;
    if (isActivation) {
      activateModule("vendors");
      setVendorTierId(next);
      setModuleTier("vendors", next);
      setVendorTierMode("change");
    } else if (isUpgrade) {
      setVendorTierId(next);
      setModuleTier("vendors", next);
    } else {
      effectiveAt = scheduleModuleTier("vendors", next);
    }
    syncModuleState();

    setReceipt({
      moduleId: "vendors",
      moduleTitle: "Leverandørmodul",
      kind: isActivation ? "activation" : isUpgrade ? "upgrade" : "downgrade",
      fromLabel: isActivation ? undefined : prevTier.label,
      toLabel: nextTier.label,
      monthlyPriceKr: nextTier.monthlyPriceKr,
      effectiveAt,
      termsVersion: currentTerms?.version,
      nextSteps: [
        { label: "Gå til Leverandører", description: "Se leverandørene som teller mot nivået.", onClick: () => navigate("/vendors") },
        { label: "Legg til leverandør", description: "Start leverandøronboarding med Lara-analyse.", onClick: () => navigate("/vendors?add=1") },
        { label: "Send spørreskjema", description: "Be leverandørene dokumentere etterlevelsen.", onClick: () => navigate("/vendors?tab=questionnaires") },
      ],
      onUndo: isActivation
        ? undefined
        : () => {
            if (isUpgrade) {
              setVendorTierId(prev);
              setModuleTier("vendors", prev);
            } else {
              clearScheduledTier("vendors");
            }
            syncModuleState();
            setReceipt(null);
            toast.success("Endringen er angret.");
          },
    });
  };

  const activeModuleCount = useMemo(() => {
    let count = 1; // Core always active
    if (activeFrameworkCount > 0) count += 1;
    count += 1; // Vendors
    count += 1; // Assets
    count += 1; // Trust Profile
    if (hasPartnerAccess) count += 1;
    return count;
  }, [activeFrameworkCount, hasPartnerAccess]);

  const handleSelectPlan = (planId: PlanId) => {
    if (planId === "enterprise") {
      toast.info("Ta kontakt med salg på sales@mynder.no for tilbud.");
      return;
    }
    if (planId === currentPlanId) {
      setChangePlanOpen(false);
      return;
    }
    toast.success(`Du har valgt ${PLANS[planId].displayName}-planen!`);
    setChangePlanOpen(false);
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

  const coreLimit = planConfig.limits.systems === -1 ? "ubegrenset" : `${planConfig.limits.systems}`;
  const vendorLimit = planConfig.limits.vendors === -1 ? "ubegrenset" : `${planConfig.limits.vendors}`;
  const assetLimit = planConfig.limits.systems === -1 ? "ubegrenset" : `${planConfig.limits.systems}`;

  const trustProfileUrl = companyProfile?.domain
    ? `https://trust.mynder.no/${companyProfile.domain}`
    : "https://trust.mynder.no";

  return (
    <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
      {!isMobile && <div className="w-64 flex-shrink-0"><Sidebar /></div>}
      {isMobile && <Sidebar />}
      <main className="flex-1 overflow-y-auto pt-11">
        <div className="container max-w-6xl mx-auto p-6 space-y-8 pb-20">

          {/* Hero heading */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Produkter</h1>
                <Badge variant="secondary" className="text-xs">{activeModuleCount} aktive</Badge>
              </div>
              <OrganizationContextBanner />
              <p className="text-sm text-muted-foreground mt-1">
                Administrer produktene dine her
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total månedlig</p>
              <p className="text-xl font-bold text-foreground">{formatKr(totalMonthly)}/mnd</p>
            </div>
          </div>

          {/* Module grid */}
          <section className="grid gap-3 sm:grid-cols-2 items-stretch">

            {(() => {
              const used = systemsCount ?? 0;
              const atCap = used >= coreTier.systemLimit;
              const nextTier = getNextCoreTier(coreTierId);
              const capFooter = atCap && nextTier ? (
                <div className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2">
                  <p className="text-xs text-amber-800">
                    Dere har brukt opp plassen. Neste nivå gir plass til {nextTier.systemLimit} systemer for {formatKr(nextTier.monthlyPriceKr)} per måned.
                  </p>
                </div>
              ) : undefined;
              return (
                <ModuleCard
                  icon={LayoutGrid}
                  title="Mynder Core"
                  description="Grunnmodulen. Oppgaver, avvik, samsvar, behandlingsprotokoll og dokumenter."
                  status={moduleStatusOf("core") === "pending_cancellation" ? "pending_cancellation" : "active"}
                  cancelAtLabel={cancelAtLabelOf("core")}
                  onResume={() => undoCancellation("core")}
                  onDeactivate={() => requestDeactivate("core", "Mynder Core")}
                  deactivateLabel="Avvikle"
                  price={corePrice}
                  priceLabel={coreTier.label}
                  usage={String(used)}
                  usageLimit={String(coreTier.systemLimit)}
                  usageSuffix="systemer"
                  action="change"
                  onClick={() => setChangeCoreTierOpen(true)}
                  accentColor="purple"
                  footer={capFooter}
                  ctaOverride={atCap && nextTier ? { label: "Oppgrader\u00a0", variant: "default" } : undefined}
                  onReadMore={() => setReadMoreKey("core")}
                />
              );
            })()}


            <ModuleCard
              icon={ShieldCheck}
              title="Regelverk"
              description={`${activeFrameworkCount} regelverk aktivert`}
              status={deactivatedModules.has("frameworks") ? "inactive" : moduleStatusOf("frameworks") === "pending_cancellation" ? "pending_cancellation" : activeFrameworkCount > 0 ? "active" : "inactive"}
              cancelAtLabel={cancelAtLabelOf("frameworks")}
              onResume={() => undoCancellation("frameworks")}
              price={deactivatedModules.has("frameworks") ? 0 : frameworkMonthlyPrice}
              priceLabel={paidFrameworkCount > 0 ? `${paidFrameworkCount} betalte regelverk` : "Inkluderte regelverk"}
              usage={String(activeFrameworkCount)}
              usageLimit={String(allFrameworkDefs.length)}
              usageSuffix="aktive"
              action={deactivatedModules.has("frameworks") ? "activate" : "manage"}
              onClick={() => deactivatedModules.has("frameworks") ? requestActivate("frameworks", "Regelverk") : setEditFrameworksOpen(true)}
              onDeactivate={() => requestDeactivate("frameworks", "Regelverk")}
              deactivateLabel="Deaktiver alle regelverk"
              breakdown={deactivatedModules.has("frameworks") ? undefined : frameworkBreakdown}

              accentColor="blue"
              onReadMore={() => setReadMoreKey("frameworks")}
            />

            {(() => {
              const used = vendorCount ?? 0;
              const atCap = used >= vendorTier.vendorLimit;
              const nextTier = getNextVendorTier(vendorTierId);
              const isDeactivated = deactivatedModules.has("vendors");
              const capFooter = !isDeactivated && atCap && nextTier ? (
                <div className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2">
                  <p className="text-xs text-amber-800">
                    Dere har brukt opp plassen. Neste nivå gir plass til {nextTier.vendorLimit} leverandører for {formatKr(nextTier.monthlyPriceKr)} per måned.
                  </p>
                </div>
              ) : undefined;
              return (
                <ModuleCard
                  icon={Briefcase}
                  title="Leverandørmodul"
                  description="TPRM og leverandørvurdering"
                  status={isDeactivated ? "inactive" : moduleStatusOf("vendors")}
                  cancelAtLabel={cancelAtLabelOf("vendors")}
                  onResume={() => undoCancellation("vendors")}
                  price={isDeactivated ? 0 : vendorTier.monthlyPriceKr}
                  priceLabel={isDeactivated || vendorTier.monthlyPriceKr === 0 ? undefined : vendorTier.label}
                  usage={String(used)}
                  usageLimit={String(vendorTier.vendorLimit)}
                  usageSuffix="leverandører"
                  action={isDeactivated ? "activate" : "change"}
                  onClick={() => isDeactivated ? requestActivate("vendors", "Leverandørmodul") : setChangeVendorTierOpen(true)}
                  onDeactivate={() => requestDeactivate("vendors", "Leverandørmodul")}

                  accentColor="amber"
                  footer={capFooter}
                  ctaOverride={!isDeactivated && atCap && nextTier ? { label: "Oppgrader\u00a0", variant: "default" } : undefined}
                  onReadMore={() => setReadMoreKey("vendors")}
                />
              );
            })()}

            <ModuleCard
              icon={Server}
              title="Assets"
              description="System- og eiendelsregister"
              status={deactivatedModules.has("assets") ? "inactive" : moduleStatusOf("assets")}
              cancelAtLabel={cancelAtLabelOf("assets")}
              onResume={() => undoCancellation("assets")}
              price={deactivatedModules.has("assets") ? 0 : assetMonthlyPrice}

              usage={String(assetsCount ?? 0)}
              usageLimit={assetLimit}
              usageSuffix="eiendeler"
              action={deactivatedModules.has("assets") ? "activate" : "open"}
              onClick={() => deactivatedModules.has("assets") ? requestActivate("assets", "Assets") : navigate("/assets")}
              onDeactivate={() => requestDeactivate("assets", "Assets")}
              accentColor="emerald"
              onReadMore={() => setReadMoreKey("assets")}
            />

            <ModuleCard
              icon={Globe}
              title="Trust Center"
              description="Del dokumentasjonen én gang — gjenbruk mot kunder og leverandører"
              status={deactivatedModules.has("trust") ? "inactive" : moduleStatusOf("trust")}
              cancelAtLabel={cancelAtLabelOf("trust")}
              onResume={() => undoCancellation("trust")}
              price={deactivatedModules.has("trust") ? 0 : TRUST_CENTER_PRICE_KR}
              priceLabel={deactivatedModules.has("trust") ? "Ikke aktivert" : "Trust Profile og deling"}
              action={deactivatedModules.has("trust") ? "activate" : "open"}
              onClick={() =>
                deactivatedModules.has("trust")
                  ? requestActivate("trust", "Trust Center")
                  : window.open(trustProfileUrl, "_blank", "noopener,noreferrer")
              }
              onDeactivate={() => requestDeactivate("trust", "Trust Center")}
              accentColor="rose"
              onReadMore={() => setReadMoreKey("trust")}
            />


            <ModuleCard
              icon={Users}
              title="Partner Workspace"
              description="For MSP-er og samarbeidspartnere"
              status={deactivatedModules.has("partner") ? "inactive" : hasPartnerAccess ? moduleStatusOf("partner") : "inactive"}
              cancelAtLabel={cancelAtLabelOf("partner")}
              onResume={() => undoCancellation("partner")}
              price={!deactivatedModules.has("partner") && hasPartnerAccess ? partnerWorkspaceMonthlyPrice : 0}
              priceLabel={hasPartnerAccess && !deactivatedModules.has("partner") ? undefined : "Kontakt salg for aktivering"}

              action={deactivatedModules.has("partner") ? "activate" : hasPartnerAccess ? "open" : "activate"}
              onClick={() => {
                if (deactivatedModules.has("partner")) return requestActivate("partner", "Partner Workspace");
                return hasPartnerAccess ? navigate("/msp") : toast.info("Ta kontakt med salg på sales@mynder.no for å aktivere Partner Workspace.");
              }}
              onDeactivate={hasPartnerAccess ? () => requestDeactivate("partner", "Partner Workspace") : undefined}
              accentColor="slate"
              onReadMore={() => setReadMoreKey("partner")}
            />
          </section>

          <ModuleInfoDialog moduleKey={readMoreKey} onOpenChange={(open) => !open && setReadMoreKey(null)} />

          <TermsGateDialog
            open={!!confirmActivate}
            onOpenChange={(open) => !open && setConfirmActivate(null)}
            title={`Aktiver ${confirmActivate?.title ?? "modul"}`}
            description="Aktiveringen trer i kraft umiddelbart og faktureres fra neste periode."
            context="module_activation"
            contextRef={confirmActivate?.id}
            onConfirmed={() => {
              if (confirmActivate) reactivateModule(confirmActivate.id);
              setConfirmActivate(null);
            }}
          />

          {/* Payment method */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Betalingsmetode</h2>
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Kort / Stripe Link</span>
                  </div>
                  <Switch
                    checked={paymentMethod === "card"}
                    onCheckedChange={(checked) => setPaymentMethod(checked ? "card" : "invoice")}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Faktura</span>
                  </div>
                  <Switch
                    checked={paymentMethod === "invoice"}
                    onCheckedChange={(checked) => setPaymentMethod(checked ? "invoice" : "card")}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Included note */}
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
        </div>
      </main>

      {/* Change plan dialog */}
      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Endre plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
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
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[12px] px-1.5">
                    Spar 2 mnd
                  </Badge>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
          </div>
        </DialogContent>
      </Dialog>

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

      <ChangeCoreTierDialog
        open={changeCoreTierOpen}
        onOpenChange={setChangeCoreTierOpen}
        currentTierId={coreTierId}
        usedSystems={systemsCount ?? 0}
        onConfirm={handleCoreTierSelect}
      />
      <ConfirmCoreTierChangeDialog
        open={!!pendingCoreTierId}
        onOpenChange={(open) => { if (!open) setPendingCoreTierId(null); }}
        currentTierId={coreTierId}
        nextTierId={pendingCoreTierId}
        onConfirm={handleCoreTierConfirm}
      />

      <ChangeVendorTierDialog
        open={changeVendorTierOpen}
        onOpenChange={setChangeVendorTierOpen}
        currentTierId={vendorTierId}
        usedVendors={vendorCount ?? 0}
        onConfirm={handleVendorTierSelect}
      />
      <ConfirmVendorTierChangeDialog
        open={!!pendingVendorTierId}
        onOpenChange={(open) => { if (!open) setPendingVendorTierId(null); }}
        currentTierId={vendorTierId}
        nextTierId={pendingVendorTierId}
        onConfirm={handleVendorTierConfirm}
      />



      <RetireModuleDialog
        open={!!confirmDeactivate}
        onOpenChange={(open) => { if (!open) setConfirmDeactivate(null); }}
        moduleId={confirmDeactivate?.id ?? null}
        moduleTitle={confirmDeactivate?.title ?? ""}
        effectiveAt={getPeriodEnd().toISOString()}
        onConfirm={confirmDeactivation}
      />

    </div>
  );
}
