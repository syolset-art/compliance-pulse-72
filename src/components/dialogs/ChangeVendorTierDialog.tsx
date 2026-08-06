import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VENDOR_TIERS, formatKr, getVendorTier, type VendorTierId } from "@/lib/planConstants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTierId: VendorTierId;
  usedVendors: number;
  onConfirm: (nextTierId: VendorTierId) => void;
  /** Overskriver tittel/knapp når modulen aktiveres på nytt. */
  mode?: "change" | "activate";
  /** Åpner leverandørregisteret slik at brukeren kan frigjøre plass. */
  onManageUsage?: () => void;
}

export function ChangeVendorTierDialog({
  open, onOpenChange, currentTierId, usedVendors, onConfirm, mode = "change", onManageUsage,
}: Props) {
  const [selected, setSelected] = useState<VendorTierId>(currentTierId);

  useEffect(() => {
    if (open) setSelected(currentTierId);
  }, [open, currentTierId]);

  const current = getVendorTier(currentTierId);
  const next = getVendorTier(selected);
  const diff = next.monthlyPriceKr - current.monthlyPriceKr;
  const changed = selected !== currentTierId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Endre nivå på Leverandørmodul</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {VENDOR_TIERS.map((tier) => {
            const isCurrent = tier.id === currentTierId;
            const isSelected = tier.id === selected;

            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelected(tier.id)}
                className={cn(
                  "w-full text-left rounded-lg border p-3 transition-all",
                  isSelected ? "border-primary ring-1 ring-primary/30 bg-primary/5" : "border-border hover:border-primary/40"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                        isSelected ? "border-primary" : "border-muted-foreground/40"
                      )}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <span className="text-sm font-medium text-foreground">{tier.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isCurrent && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Nåværende nivå
                      </span>
                    )}
                    <div className="text-sm font-semibold tabular-nums text-foreground">
                      {tier.isFree ? (
                        <><span>Gratis</span> <span className="text-xs font-normal text-muted-foreground">alltid</span></>
                      ) : (
                        <>{formatKr(tier.monthlyPriceKr)} <span className="text-xs font-normal text-muted-foreground">/mnd</span></>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {changed && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Fra {current.isFree ? "gratis" : formatKr(current.monthlyPriceKr)} til{" "}
            <span className="font-semibold text-foreground">
              {next.isFree ? "gratis" : `${formatKr(next.monthlyPriceKr)} per måned`}
            </span>
            {!current.isFree && !next.isFree && (
              <> {" — "}{formatKr(Math.abs(diff))} {diff > 0 ? "mer" : "mindre"}</>
            )}
          </p>
        )}

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button disabled={!changed} onClick={() => onConfirm(selected)}>Endre nivå</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
