import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Package, ChevronDown, Check, Plus } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";
import { formatPeriodEnd, formatDateLong } from "@/lib/moduleActivationState";
import { supabase } from "@/integrations/supabase/client";
import {
  CUSTOMER_MODULES_EVENT,
  activateCustomerModule,
  clearCustomerScheduledTier,
  getCustomerModuleState,
  getCustomerModuleTier,
  getCustomerUsage,
  requiredCoreTierId,
  requiredVendorTierId,
  scheduleCustomerModuleTier,
  setCustomerModuleTier,
  syncCustomerModules,
} from "@/lib/customerModuleState";
import {
  DEFAULT_CORE_TIER_ID,
  DEFAULT_VENDOR_TIER_ID,
  TRUST_CENTER_V2,
  getCoreTier,
  getVendorTier,
  type CoreTierId,
  type VendorTierId,
} from "@/lib/planConstants";

import { ChangeCoreTierDialog } from "@/components/dialogs/ChangeCoreTierDialog";
import { ConfirmCoreTierChangeDialog } from "@/components/dialogs/ConfirmCoreTierChangeDialog";
import { ChangeVendorTierDialog } from "@/components/dialogs/ChangeVendorTierDialog";
import { ConfirmVendorTierChangeDialog } from "@/components/dialogs/ConfirmVendorTierChangeDialog";
import {
  ModuleChangeReceiptSheet,
  type ModuleChangeReceipt,
} from "@/components/subscriptions/ModuleChangeReceiptSheet";
import type { FrameworkRecommendation } from "@/lib/regulationRecommender";
import { ModuleCard } from "@/components/subscriptions/ModuleCard";
import {
  ActivateRecommendationsDialog,
  type ActivatableItem,
} from "./ActivateRecommendationsDialog";
import { EnterCustomerContextDialog } from "./EnterCustomerContextDialog";
import { usePostActivationPrompt } from "@/hooks/usePostActivationPrompt";

import {
  TRUST_CENTER_NEXT_STEP,
  TRUST_CENTER_STATUS_LABEL,
  trustCenterStatusFor,
} from "@/lib/trustCenterStatus";

import type { CustomerEntryTarget } from "@/lib/customerEntryRoutes";
import { MSPCreateOfferDialog } from "./MSPCreateOfferDialog";
import { CustomerModulesTab } from "./CustomerModulesTab";
import { MSPMaturityServiceMatrix } from "./MSPMaturityServiceMatrix";

interface Props {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  activeFrameworkIds: string[];
  recommended?: FrameworkRecommendation[];
  confirmed?: FrameworkRecommendation[];
  /** Navigerer til «Leveranser»-fanen. */
  onOpenDeliveries?: () => void;
  onUpdate?: () => void;
}

/** Produktene partneren kan aktivere hos kunden. */
interface ProductDef {
  key: string;
  moduleKey?: string;
  title: string;
  description: string;
  /** Hva som telles mot nivået (faktisk antall hentes fra registeret). */
  usageSuffix?: string;
}

const PRODUCTS: ProductDef[] = [
  {
    key: "core",
    moduleKey: "core",
    title: "Mynder Core",
    description: "Grunnmodulen. Oppgaver, avvik, samsvar, behandlingsprotokoll og dokumenter.",
    usageSuffix: "systemer",
  },
  {
    key: "vendor",
    moduleKey: "vendors",
    title: "Leverandørmodul",
    description: "TPRM og leverandørvurdering.",
    usageSuffix: "leverandører",
  },
  {
    key: "assets",
    moduleKey: "assets",
    title: "Eiendeler",
    description: "System- og eiendelsregister.",
  },
  {
    key: "trust",
    moduleKey: "trust",
    title: "Trust Center",
    description: "Del dokumentasjonen én gang og gjenbruk den mot kunder og leverandører.",
  },
];

const FLAT_PRICE: Record<string, number> = { assets: 690, trust: 490 };


/** Månedspris per aktivert regelverk. */
const FRAMEWORK_PRICE = 490;



export function CustomerServicesAndProductsTab({
  customerId,
  customerName,
  customerEmail,
  activeFrameworkIds,
  recommended = [],
  confirmed = [],
  onOpenDeliveries,
  onUpdate,
}: Props) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    window.addEventListener(CUSTOMER_MODULES_EVENT, refresh);
    return () => {
      window.removeEventListener(CUSTOMER_MODULES_EVENT, refresh);
    };
  }, []);


  const { promptOrToast } = usePostActivationPrompt();
  const [showAll, setShowAll] = useState(false);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [activateItems, setActivateItems] = useState<ActivatableItem[] | null>(null);
  const [enterItems, setEnterItems] = useState<CustomerEntryTarget[] | null>(null);
  const [offerItems, setOfferItems] = useState<{ label: string; hours: number }[] | null>(null);

  // Nivåflyt (samme som i Innstillinger > Produkter)

  const [coreTierOpen, setCoreTierOpen] = useState(false);
  const [pendingCoreTierId, setPendingCoreTierId] = useState<CoreTierId | null>(null);
  const [vendorTierOpen, setVendorTierOpen] = useState(false);
  const [vendorTierMode, setVendorTierMode] = useState<"change" | "activate">("change");
  const [pendingVendorTierId, setPendingVendorTierId] = useState<VendorTierId | null>(null);
  const [receipt, setReceipt] = useState<ModuleChangeReceipt | null>(null);

  // Forbruk hører til kunden — ikke partnerens eget register.
  const usage = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => getCustomerUsage(customerId, customerName),
    [customerId, customerName, tick],
  );
  const usedVendors = usage.vendors;
  const usedSystems = usage.systems;

  // Kundens `active_modules` i databasen er fasit for hva som er aktivert.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("msp_customers" as any)
        .select("active_modules")
        .eq("id", customerId)
        .maybeSingle();
      if (cancelled) return;
      const modules: string[] = ((data as any)?.active_modules || []).filter(Boolean);
      syncCustomerModules(customerId, modules, usage);
      setTick((n) => n + 1);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  // Nivå løftes til det minste nivået som rommer faktisk bruk (aldri «26 av 5»).
  const coreTierId = useMemo(() => {
    const stored = (getCustomerModuleTier(customerId, "core") as CoreTierId) ?? DEFAULT_CORE_TIER_ID;
    const required = requiredCoreTierId(usedSystems);
    return getCoreTier(required).systemLimit > getCoreTier(stored).systemLimit ? required : stored;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, usedSystems, tick]);

  const vendorTierId = useMemo(() => {
    const stored = (getCustomerModuleTier(customerId, "vendors") as VendorTierId) ?? DEFAULT_VENDOR_TIER_ID;
    const required = requiredVendorTierId(usedVendors);
    return getVendorTier(required).vendorLimit > getVendorTier(stored).vendorLimit ? required : stored;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, usedVendors, tick]);


  const products = useMemo(
    () =>
      PRODUCTS.map((p) => {
        const stateKey = p.moduleKey ?? p.key;
        const state = getCustomerModuleState(customerId, stateKey);
        const isCore = p.moduleKey === "core";
        const isVendors = p.moduleKey === "vendors";
        const tier = isCore
          ? getCoreTier(coreTierId)
          : isVendors
            ? getVendorTier(vendorTierId)
            : null;
        const scheduledTier = state.scheduledTierId
          ? isCore
            ? getCoreTier(state.scheduledTierId as CoreTierId)
            : isVendors
              ? getVendorTier(state.scheduledTierId as VendorTierId)
              : null
          : null;
        return {
          ...p,
          stateKey,
          status: state.status,
          cancelAt: state.cancelAt,
          tierLabel: tier?.label,
          scheduled:
            scheduledTier && state.scheduledAt
              ? { tierLabel: scheduledTier.label, at: state.scheduledAt }
              : null,
          used: isCore ? usedSystems : isVendors ? usedVendors : undefined,
          limit:
            tier && "systemLimit" in tier
              ? tier.systemLimit
              : tier && "vendorLimit" in tier
                ? tier.vendorLimit
                : undefined,
          price: tier ? tier.monthlyPriceKr : (FLAT_PRICE[p.key] ?? 0),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick, customerId, usedVendors, usedSystems, coreTierId, vendorTierId],
  );


  const activeSet = useMemo(() => new Set(activeFrameworkIds), [activeFrameworkIds]);

  const activeFrameworks = useMemo(
    () =>
      activeFrameworkIds.map((id) => ({
        id,
        name: ALL_FRAMEWORKS.find((f) => f.id === id)?.name || id,
      })),
    [activeFrameworkIds],
  );

  const recommendedFrameworks = useMemo(() => {
    const seen = new Set<string>();
    return [...confirmed, ...recommended]
      .filter((r) => {
        const id = r.frameworkId;
        if (!id || activeSet.has(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((r) => ({
        id: r.frameworkId,
        name: ALL_FRAMEWORKS.find((f) => f.id === r.frameworkId)?.name || r.label || r.frameworkId,
      }));
  }, [recommended, confirmed, activeSet]);

  const activeProductCount = products.filter((p) => p.status !== "inactive").length;

  const toggleFramework = (id: string) =>
    setSelectedFrameworks((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );

  const activateSelectedFrameworks = () => {
    setActivateItems(
      selectedFrameworks.map((id) => ({
        id,
        label: ALL_FRAMEWORKS.find((f) => f.id === id)?.name || id,
        kind: "framework" as const,
        activatable: true,
        frameworkId: id,
        price: 490,
      })),
    );
  };

  const activateProduct = (p: (typeof products)[number]) => {
    if (p.key === "trust") {
      toast.info("Trust Center er planlagt i v2", {
        description: "Dette produktet skal ikke implementeres i prototype.",
      });
      return;
    }

    setActivateItems([
      {
        id: p.key,
        label: p.title,
        kind: "module",
        activatable: true,
        moduleKey: p.moduleKey ?? p.key,
        price: p.price,
      },
    ]);
  };

  const commitCoreTier = () => {
    if (!pendingCoreTierId) return;
    const prevTier = getCoreTier(coreTierId);
    const nextTier = getCoreTier(pendingCoreTierId);
    const isUpgrade = nextTier.monthlyPriceKr >= prevTier.monthlyPriceKr;
    let effectiveAt: string | undefined;
    if (isUpgrade) setCustomerModuleTier(customerId, "core", pendingCoreTierId);
    else effectiveAt = scheduleCustomerModuleTier(customerId, "core", pendingCoreTierId);
    setPendingCoreTierId(null);
    setTick((n) => n + 1);
    setReceipt({
      moduleId: "core",
      moduleTitle: "Mynder Core",
      kind: isUpgrade ? "upgrade" : "downgrade",
      fromLabel: prevTier.label,
      toLabel: nextTier.label,
      monthlyPriceKr: nextTier.monthlyPriceKr,
      effectiveAt,
      nextSteps: [
        {
          label: "Gå inn i kundens profil",
          description: "Jobb med systemene som teller mot nivået.",
          onClick: () => setEnterItems([{ id: "core", kind: "module", label: "Mynder Core", moduleKey: "core" }]),
        },
        {
          label: "Lag tilbud på oppsett",
          description: "Tilby kunden hjelp med kartlegging og oppsett.",
          onClick: () => setOfferItems([{ label: "Oppsett av Mynder Core", hours: 8 }]),
        },
      ],
      onUndo: () => {
        if (isUpgrade) setCustomerModuleTier(customerId, "core", coreTierId);
        else clearCustomerScheduledTier(customerId, "core");
        setTick((n) => n + 1);
        setReceipt(null);
        toast.success("Endringen er angret.");
      },
    });
    onUpdate?.();
  };

  const commitVendorTier = () => {
    if (!pendingVendorTierId) return;
    const prevTier = getVendorTier(vendorTierId);
    const nextTier = getVendorTier(pendingVendorTierId);
    const isActivation = vendorTierMode === "activate";
    const isUpgrade = nextTier.monthlyPriceKr >= prevTier.monthlyPriceKr;
    let effectiveAt: string | undefined;
    if (isActivation) {
      activateCustomerModule(customerId, "vendors", pendingVendorTierId);
      setCustomerModuleTier(customerId, "vendors", pendingVendorTierId);
      setVendorTierMode("change");
    } else if (isUpgrade) {
      setCustomerModuleTier(customerId, "vendors", pendingVendorTierId);
    } else {
      effectiveAt = scheduleCustomerModuleTier(customerId, "vendors", pendingVendorTierId);
    }
    setPendingVendorTierId(null);
    setTick((n) => n + 1);
    setEnterItems([{ id: "vendors", kind: "module", label: "Leverandørmodul", moduleKey: "vendors" }]);
    toast.success(
      isActivation
        ? `Leverandørmodul aktivert hos ${customerName}`
        : effectiveAt
          ? `Nivå endres til ${nextTier.label} ${effectiveAt}`
          : `Nivå endret til ${nextTier.label}`,
    );
    onUpdate?.();
  };

  const frameworkFooter =
    recommendedFrameworks.length > 0 ? (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">Anbefalt:</span>
        {recommendedFrameworks.map((f) => {
          const selected = selectedFrameworks.includes(f.id);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => toggleFramework(f.id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {selected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {f.name}
            </button>
          );
        })}
        {selectedFrameworks.length > 0 && (
          <Button size="sm" className="h-7 text-xs ml-auto" onClick={activateSelectedFrameworks}>
            Aktiver ({selectedFrameworks.length})
          </Button>
        )}
      </div>
    ) : undefined;

  return (
    <div className="space-y-5">
      {/* ── 1. Produkter og regelverk ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Produkter og regelverk</h2>
          <span className="text-xs text-muted-foreground">
            {activeProductCount + (activeFrameworks.length > 0 ? 1 : 0)} av {products.length + 1} aktivert
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ModuleCard
            icon={Shield}
            title="Regelverk"
            description="Regelverkene kunden etterlever, med krav og dokumentasjonskrav."
            status={activeFrameworks.length > 0 ? "active" : "inactive"}
            price={activeFrameworks.length * FRAMEWORK_PRICE}
            priceLabel={
              activeFrameworks.length > 0 ? `${activeFrameworks.length} aktive regelverk` : undefined
            }
            usage={String(activeFrameworks.length)}
            usageLimit={String(ALL_FRAMEWORKS.length)}
            usageSuffix="aktive"
            breakdown={
              activeFrameworks.length > 0
                ? activeFrameworks.map((f) => ({ label: f.name, priceKr: FRAMEWORK_PRICE }))
                : undefined
            }
            action={activeFrameworks.length > 0 ? "manage" : "activate"}
            onClick={() => {
              if (recommendedFrameworks.length > 0 && selectedFrameworks.length === 0) {
                setSelectedFrameworks(recommendedFrameworks.map((f) => f.id));
                return;
              }
              if (selectedFrameworks.length > 0) activateSelectedFrameworks();
              else onUpdate?.();
            }}
            footer={frameworkFooter}
          />

          {products.map((p) => {
            const isTrust = p.key === "trust";
            const trustStatus = isTrust
              ? trustCenterStatusFor(customerId, p.status !== "inactive")
              : null;
            return (
              <ModuleCard
                key={p.key}
                title={p.title}
                description={p.description}
                status={p.status}
                price={p.price}
                priceLabel={isTrust ? undefined : p.tierLabel}
                usage={p.used != null ? String(p.used) : undefined}
                usageSuffix={p.usageSuffix}
                usageLimit={p.limit != null ? String(p.limit) : undefined}
                cancelAtLabel={p.cancelAt ? formatPeriodEnd(p.cancelAt) : undefined}
                scheduledChange={
                  p.scheduled
                    ? {
                        tierLabel: p.scheduled.tierLabel,
                        atLabel: formatDateLong(p.scheduled.at),
                        onUndo: () => {
                          clearCustomerScheduledTier(customerId, p.stateKey);
                          toast.success("Nedgraderingen er angret.");
                        },
                      }
                    : undefined
                }
                action={
                  isTrust
                    ? "none"
                    : p.status === "inactive"
                      ? "activate"
                      : p.moduleKey
                        ? "change"
                        : "open"
                }
                ctaOverride={
                  isTrust
                    ? { label: "V2 / planlagt", variant: "outline" }
                    : undefined
                }
                footer={
                  isTrust ? (
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal border-warning/30 bg-warning/10 text-warning"
                      >
                        V2 — ikke implementert nå
                      </Badge>
                      {trustStatus && trustStatus !== "inactive" && (
                        <>
                          <p className="text-[11px] text-muted-foreground">
                            {TRUST_CENTER_STATUS_LABEL[trustStatus]}
                          </p>
                          {TRUST_CENTER_NEXT_STEP[trustStatus] && (
                            <p className="text-[11px] text-muted-foreground">
                              {TRUST_CENTER_NEXT_STEP[trustStatus]}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ) : undefined
                }

                onClick={() => {
                  if (isTrust) {
                    toast.info("Trust Center er planlagt i v2", {
                      description: "Dette produktet skal ikke implementeres i prototype.",
                    });
                    return;
                  }
                  if (p.moduleKey === "core") {

                    setCoreTierOpen(true);
                    return;
                  }
                  if (p.moduleKey === "vendors") {
                    setVendorTierMode(p.status === "inactive" ? "activate" : "change");
                    setVendorTierOpen(true);
                    return;
                  }
                  if (p.status === "inactive") activateProduct(p);
                  else onUpdate?.();
                }}
              />
            );
          })}
        </div>
      </div>


      {/* ── Alt tilgjengelig å tilby ── */}
      <Collapsible open={showAll} onOpenChange={setShowAll}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between text-xs">
            Alle tilgjengelige produkter og tjenester
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-5 pt-5">
          <CustomerModulesTab
            customerId={customerId}
            customerName={customerName}
            activeFrameworkIds={activeFrameworkIds}
            onUpdate={onUpdate}
          />
          <MSPMaturityServiceMatrix customerName={customerName} customerEmail={customerEmail} />
        </CollapsibleContent>
      </Collapsible>

      {activateItems && (
        <ActivateRecommendationsDialog
          open={!!activateItems}
          onOpenChange={(o) => !o && setActivateItems(null)}
          customerId={customerId}
          customerName={customerName}
          items={activateItems}
          activeFrameworks={activeFrameworkIds}
          activeModules={products.filter((p) => p.status === "active").map((p) => p.moduleKey ?? p.key)}
          onActivated={() => {
            setActivateItems(null);
            setSelectedFrameworks([]);
            setTick((n) => n + 1);
            onUpdate?.();
          }}
          onEnterCustomer={(activated) => {
            const targets: CustomerEntryTarget[] = activated.map((a) => ({
              id: a.id,
              label: a.label,
              kind: a.kind,
              moduleKey: a.moduleKey,
              frameworkId: a.frameworkId,
            }));
            if (promptOrToast({ customerName, onEnter: () => setEnterItems(targets) })) {
              setEnterItems(targets);
            }
          }}

          onMoveToOffer={() => {
            const labels = activateItems.map((i) => ({ label: i.label, hours: 8 }));
            setActivateItems(null);
            setOfferItems(labels);
          }}
        />
      )}

      {enterItems && (
        <EnterCustomerContextDialog
          open={!!enterItems}
          onOpenChange={(o) => !o && setEnterItems(null)}
          customerId={customerId}
          customerName={customerName}
          items={enterItems}
        />
      )}


      {offerItems && (
        <MSPCreateOfferDialog
          open={!!offerItems}
          onOpenChange={(o) => !o && setOfferItems(null)}
          customerId={customerId}
          customerName={customerName}
          customerContactName={customerName}
          /* v1.1: partneren er i gang med å lage tilbudet — ikke lenger en anbefalingsliste */
              serviceTitle={`Tilbudsutkast til ${customerName}`}
          offeredServiceNames={offerItems.map((i) => i.label)}
          activeFrameworks={activeFrameworkIds}
          defaultTasks={offerItems.map((i) => ({
            label: i.label,
            hours: i.hours,
            owner: "Partner" as const,
          }))}
        />
      )}

      <ChangeCoreTierDialog
        open={coreTierOpen}
        onOpenChange={setCoreTierOpen}
        currentTierId={coreTierId}
        usedSystems={usedSystems}
        onConfirm={(next) => {
          setPendingCoreTierId(next);
          setCoreTierOpen(false);
        }}
      />

      <ConfirmCoreTierChangeDialog
        open={!!pendingCoreTierId}
        onOpenChange={(o) => { if (!o) setPendingCoreTierId(null); }}
        currentTierId={coreTierId}
        nextTierId={pendingCoreTierId}
        onConfirm={commitCoreTier}
      />

      <ChangeVendorTierDialog
        open={vendorTierOpen}
        onOpenChange={setVendorTierOpen}
        currentTierId={vendorTierId}
        usedVendors={usedVendors}
        mode={vendorTierMode}
        onConfirm={(next) => {
          setPendingVendorTierId(next);
          setVendorTierOpen(false);
        }}
      />

      <ConfirmVendorTierChangeDialog
        open={!!pendingVendorTierId}
        onOpenChange={(o) => { if (!o) setPendingVendorTierId(null); }}
        currentTierId={vendorTierId}
        nextTierId={pendingVendorTierId}
        mode={vendorTierMode}
        customerName={customerName}
        onConfirm={commitVendorTier}
      />

      <ModuleChangeReceiptSheet receipt={receipt} onOpenChange={(o) => !o && setReceipt(null)} />
    </div>
  );
}
