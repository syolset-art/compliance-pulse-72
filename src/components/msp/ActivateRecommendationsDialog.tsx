import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TermsAcceptRow } from "@/components/legal/TermsAcceptRow";
import { useTerms } from "@/hooks/useTerms";
import { cn } from "@/lib/utils";
import {
  CORE_TIERS,
  VENDOR_TIERS,
  formatKr,
  type CoreTierId,
  type VendorTierId,
} from "@/lib/planConstants";

export interface ActivatableItem {
  id: string;
  label: string;
  kind: "framework" | "service" | "module";
  activatable: boolean;
  frameworkId?: string;
  moduleKey?: string;
  price?: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  items: ActivatableItem[];
  activeFrameworks: string[];
  activeModules: string[];
  onActivated: () => void;
  /** Kalles med de aktiverte elementene slik at partneren kan gå inn i kundens organisasjon. */
  onEnterCustomer?: (items: ActivatableItem[]) => void;
  onMoveToOffer: () => void;
}

interface TierOption {
  id: string;
  label: string;
  monthlyPriceKr: number;
  isFree?: boolean;
}

function tiersFor(moduleKey?: string): TierOption[] | null {
  if (moduleKey === "core") return CORE_TIERS.map((t) => ({ id: t.id, label: t.label, monthlyPriceKr: t.monthlyPriceKr }));
  if (moduleKey === "vendors")
    return VENDOR_TIERS.map((t) => ({ id: t.id, label: t.label, monthlyPriceKr: t.monthlyPriceKr, isFree: t.isFree }));
  return null;
}

export function ActivateRecommendationsDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  items,
  activeFrameworks,
  activeModules,
  onActivated,
  onEnterCustomer,
  onMoveToOffer,
}: Props) {
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [saving, setSaving] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [operatorRole, setOperatorRole] = useState(false);
  const [tierByModule, setTierByModule] = useState<Record<string, string>>({});
  const { current: currentTerms, hasAcceptedCurrent, acceptTerms } = useTerms();
  const termsOk = termsChecked || hasAcceptedCurrent;

  const activatable = useMemo(() => items.filter((i) => i.activatable), [items]);
  const serviceItems = useMemo(() => items.filter((i) => !i.activatable), [items]);

  useEffect(() => {
    if (!open) return;
    setStep("select");
    setTermsChecked(false);
    const defaults: Record<string, string> = {};
    for (const item of items) {
      const tiers = tiersFor(item.moduleKey);
      if (item.moduleKey && tiers) defaults[item.moduleKey] = tiers[0].id;
    }
    setTierByModule(defaults);
  }, [open, items]);

  const priceFor = (item: ActivatableItem) => {
    const tiers = tiersFor(item.moduleKey);
    if (tiers && item.moduleKey) {
      const selectedTier = tiers.find((t) => t.id === tierByModule[item.moduleKey!]) ?? tiers[0];
      return selectedTier.monthlyPriceKr;
    }
    return item.price ?? 0;
  };

  const monthlyTotal = activatable.reduce((sum, i) => sum + priceFor(i), 0);

  const handleActivate = async () => {
    if (activatable.length === 0) return;
    setSaving(true);

    const nextFrameworks = Array.from(
      new Set([
        ...activeFrameworks,
        ...activatable.filter((i) => i.frameworkId).map((i) => i.frameworkId as string),
      ]),
    );
    const nextModules = Array.from(
      new Set([
        ...activeModules,
        ...activatable.filter((i) => i.moduleKey).map((i) => i.moduleKey as string),
      ]),
    );

    const { error } = await supabase
      .from("msp_customers" as any)
      .update({ active_frameworks: nextFrameworks, active_modules: nextModules } as any)
      .eq("id", customerId);

    if (error) {
      setSaving(false);
      toast.error("Kunne ikke aktivere", { description: error.message });
      return;
    }

    await acceptTerms("module_activation", `msp-customer:${customerId}`, { operatorRole });
    setSaving(false);
    toast.success(
      activatable.length === 1
        ? `${activatable[0].label} aktivert hos ${customerName}`
        : `${activatable.length} valg aktivert hos ${customerName}`,
    );
    onActivated();
    onOpenChange(false);
    onEnterCustomer?.(activatable);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {step === "select" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">Aktiver hos {customerName}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Alle priser er eks. mva.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {activatable.map((item) => {
                const tiers = tiersFor(item.moduleKey);
                if (!tiers || !item.moduleKey) {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {item.price
                          ? <>{formatKr(item.price)} <span className="text-xs font-normal text-muted-foreground">/mnd</span></>
                          : <span className="text-xs font-normal text-muted-foreground">Inkludert</span>}
                      </span>
                    </div>
                  );
                }

                const selectedId = tierByModule[item.moduleKey] ?? tiers[0].id;

                return (
                  <div key={item.id} className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                    {tiers.map((tier) => {
                      const isSelected = tier.id === selectedId;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() =>
                            setTierByModule((prev) => ({ ...prev, [item.moduleKey as string]: tier.id }))
                          }
                          className={cn(
                            "w-full text-left rounded-lg border p-3 transition-all",
                            isSelected
                              ? "border-primary ring-1 ring-primary/30 bg-primary/5"
                              : "border-border hover:border-primary/40",
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={cn(
                                  "h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                                  isSelected ? "border-primary" : "border-muted-foreground/40",
                                )}
                              >
                                {isSelected && <span className="h-2 w-2 rounded-full bg-primary" />}
                              </span>
                              <span className="text-sm font-medium text-foreground">{tier.label}</span>
                            </div>
                            <div className="text-sm font-semibold tabular-nums text-foreground shrink-0">
                              {tier.isFree ? (
                                <>
                                  <span>Gratis</span>{" "}
                                  <span className="text-xs font-normal text-muted-foreground">alltid</span>
                                </>
                              ) : (
                                <>
                                  {formatKr(tier.monthlyPriceKr)}{" "}
                                  <span className="text-xs font-normal text-muted-foreground">/mnd</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {serviceItems.length > 0 && (
                <div className="rounded-lg border border-dashed p-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Leveres som oppdrag og kan ikke slås på:{" "}
                    <span className="text-foreground">
                      {serviceItems.map((i) => i.label).join(", ")}
                    </span>
                    .
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onMoveToOffer();
                    }}
                    className="mt-2 text-xs font-medium text-primary hover:underline"
                  >
                    Legg i tilbud i stedet
                  </button>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button disabled={activatable.length === 0} onClick={() => setStep("confirm")}>
                Aktiver
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">
                {activatable.length === 1
                  ? `Aktivere ${activatable[0].label.toLowerCase()}?`
                  : `Aktivere ${activatable.length} valg?`}
              </DialogTitle>
            </DialogHeader>

            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Tjenesten aktiveres umiddelbart hos {customerName}, og faktureres på neste faktura. Alle priser er
              eks. mva.
            </DialogDescription>



            <TermsAcceptRow
              id={`terms-activate-${customerId}`}
              checked={termsOk}
              onCheckedChange={setTermsChecked}
              version={currentTerms?.version}
              showOperatorRole
              operatorRole={operatorRole}
              onOperatorRoleChange={setOperatorRole}
            />

            <DialogFooter className="pt-2">
              <Button variant="ghost" onClick={() => setStep("select")}>
                Tilbake
              </Button>
              <Button onClick={handleActivate} disabled={saving || !termsOk}>
                {saving
                  ? "Aktiverer…"
                  : monthlyTotal > 0
                    ? `Aktiver for ${formatKr(monthlyTotal)}/mnd eks. mva.`
                    : "Aktiver"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
