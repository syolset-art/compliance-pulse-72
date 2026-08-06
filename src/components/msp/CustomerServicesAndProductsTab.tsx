import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Package, ChevronDown, Check, Plus, Wrench } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";
import {
  getModuleState,
  formatPeriodEnd,
  formatDateLong,
  setModuleTier,
  scheduleModuleTier,
  clearScheduledTier,
  activateModule,
} from "@/lib/moduleActivationState";
import {
  CORE_TIERS,
  VENDOR_TIERS,
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
import { ActivateTrustCenterDialog } from "./ActivateTrustCenterDialog";
import { TrustCenterGuideSheet } from "./TrustCenterGuideSheet";
import {
  TRUST_CENTER_EVENT,
  TRUST_CENTER_NEXT_STEP,
  TRUST_CENTER_STATUS_LABEL,
  trustCenterStatusFor,
} from "@/lib/trustCenterStatus";
import type { CustomerEntryTarget } from "@/lib/customerEntryRoutes";
import { MSPCreateOfferDialog } from "./MSPCreateOfferDialog";
import { CustomerModulesTab } from "./CustomerModulesTab";
import { MSPMaturityServiceMatrix } from "./MSPMaturityServiceMatrix";
import { RecommendedNextStepsCard } from "./RecommendedNextStepsCard";

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
    key: "systems",
    title: "Systemer",
    description: "Automatisk kartlegging og oversikt over systemene kunden bruker.",
  },
  {
    key: "assets",
    title: "Eiendeler (Assets)",
    description: "System- og eiendelsregister.",
  },
  {
    key: "trust",
    moduleKey: "trust",
    title: "Trust Center",
    description: "Del dokumentasjonen én gang og gjenbruk den mot kunder og leverandører.",
  },
];

const FLAT_PRICE: Record<string, number> = { systems: 690, assets: 690, trust: 490 };


/** Månedspris per aktivert regelverk. */
const FRAMEWORK_PRICE = 490;


/** Rene tjenester som må leveres som oppdrag. */
const SERVICE_SUGGESTIONS: { id: string; label: string; hours: number }[] = [
  { id: "svc-maturity", label: "Modenhetsvurdering", hours: 12 },
  { id: "svc-pentest", label: "Penetrasjonstest", hours: 30 },
  { id: "svc-ropa", label: "Behandlingsprotokoll (RoPA)", hours: 10 },
];

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
    window.addEventListener("modules:changed", refresh);
    window.addEventListener(TRUST_CENTER_EVENT, refresh);
    return () => {
      window.removeEventListener("modules:changed", refresh);
      window.removeEventListener(TRUST_CENTER_EVENT, refresh);
    };
  }, []);

  const { promptOrToast } = usePostActivationPrompt();
  const [showAll, setShowAll] = useState(false);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [activateItems, setActivateItems] = useState<ActivatableItem[] | null>(null);
  const [enterItems, setEnterItems] = useState<CustomerEntryTarget[] | null>(null);
  const [offerItems, setOfferItems] = useState<{ label: string; hours: number }[] | null>(null);
  const [trustActivateOpen, setTrustActivateOpen] = useState(false);
  const [trustGuideOpen, setTrustGuideOpen] = useState(false);

  // Nivåflyt (samme som i Innstillinger > Produkter)
  const [coreTierOpen, setCoreTierOpen] = useState(false);
  const [pendingCoreTierId, setPendingCoreTierId] = useState<CoreTierId | null>(null);
  const [vendorTierOpen, setVendorTierOpen] = useState(false);
  const [vendorTierMode, setVendorTierMode] = useState<"change" | "activate">("change");
  const [pendingVendorTierId, setPendingVendorTierId] = useState<VendorTierId | null>(null);
  const [receipt, setReceipt] = useState<ModuleChangeReceipt | null>(null);

  // Faktiske tall fra registeret — aldri hardkodet.
  const { data: counts } = useQuery({
    queryKey: ["msp-customer-usage-counts"],
    queryFn: async () => {
      const [vendorRes, systemRes] = await Promise.all([
        supabase.from("assets").select("id", { count: "exact", head: true }).eq("asset_type", "vendor"),
        supabase.from("assets").select("id", { count: "exact", head: true }).eq("asset_type", "system"),
      ]);
      return { vendors: vendorRes.count ?? 0, systems: systemRes.count ?? 0 };
    },
  });

  const usedVendors = counts?.vendors ?? 0;
  const usedSystems = counts?.systems ?? 0;

  const products = useMemo(
    () =>
      PRODUCTS.map((p) => {
        const stateKey = p.moduleKey ?? p.key;
        const state = getModuleState(stateKey);
        const isCore = p.moduleKey === "core";
        const isVendors = p.moduleKey === "vendors";
        const tier = isCore
          ? getCoreTier((state.tierId as CoreTierId) ?? CORE_TIERS[0].id)
          : isVendors
            ? getVendorTier((state.tierId as VendorTierId) ?? VENDOR_TIERS[0].id)
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
    [tick],
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
      setTrustActivateOpen(true);
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
                usage={p.usage ? String(p.usage.current) : undefined}
                usageSuffix={p.usage?.suffix}
                usageLimit={p.limit != null ? String(p.limit) : undefined}
                cancelAtLabel={p.cancelAt ? formatPeriodEnd(p.cancelAt) : undefined}
                action={
                  isTrust
                    ? "activate"
                    : p.status === "inactive"
                      ? "activate"
                      : p.moduleKey
                        ? "change"
                        : "open"
                }
                ctaOverride={
                  isTrust
                    ? {
                        label: p.status === "inactive" ? "Aktiver" : "Åpne veiledning",
                        variant: p.status === "inactive" ? "default" : "outline",
                      }
                    : undefined
                }
                footer={
                  isTrust && trustStatus && trustStatus !== "inactive" ? (
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal border-primary/30 bg-primary/5 text-primary"
                      >
                        {TRUST_CENTER_STATUS_LABEL[trustStatus]}
                      </Badge>
                      {TRUST_CENTER_NEXT_STEP[trustStatus] && (
                        <p className="text-[11px] text-muted-foreground">
                          {TRUST_CENTER_NEXT_STEP[trustStatus]}
                        </p>
                      )}
                    </div>
                  ) : undefined
                }
                onClick={() => {
                  if (isTrust) {
                    if (p.status === "inactive") setTrustActivateOpen(true);
                    else setTrustGuideOpen(true);
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


      {/* ── 3. Anbefalte tjenester (leveres som oppdrag) ── */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Wrench className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">Tjenester</span>
          <div className="flex flex-wrap gap-1.5">
            {SERVICE_SUGGESTIONS.map((s) => (
              <Badge key={s.id} variant="outline" className="text-[11px]">
                {s.label}
              </Badge>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-7 text-xs"
            onClick={() => setOfferItems(SERVICE_SUGGESTIONS.map((s) => ({ label: s.label, hours: s.hours })))}
          >
            Legg i tilbud
          </Button>
        </div>
      </Card>

      {/* ── 4. Anbefalt for økt modenhet ── */}
      <RecommendedNextStepsCard
        customerId={customerId}
        activeFrameworkIds={activeFrameworkIds}
        recommended={recommended}
        confirmed={confirmed}
        onShowAll={() => setShowAll(true)}
      />

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

      <ActivateTrustCenterDialog
        open={trustActivateOpen}
        onOpenChange={setTrustActivateOpen}
        customerId={customerId}
        customerName={customerName}
        customerEmail={customerEmail}
        activeModules={products.filter((p) => p.status === "active").map((p) => p.moduleKey ?? p.key)}
        onActivated={() => {
          setTick((n) => n + 1);
          onUpdate?.();
        }}
        onOpenGuide={() => setTrustGuideOpen(true)}
      />

      <TrustCenterGuideSheet
        open={trustGuideOpen}
        onOpenChange={setTrustGuideOpen}
        customerId={customerId}
        customerName={customerName}
        customerEmail={customerEmail}
      />

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
          serviceTitle={`Anbefalte produkter og tjenester for ${customerName}`}
          offeredServiceNames={offerItems.map((i) => i.label)}
          activeFrameworks={activeFrameworkIds}
          defaultTasks={offerItems.map((i) => ({
            label: i.label,
            hours: i.hours,
            owner: "Partner" as const,
          }))}
        />
      )}
    </div>
  );
}
