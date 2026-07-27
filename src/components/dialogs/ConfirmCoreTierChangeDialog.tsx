import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatKr, getCoreTier, type CoreTierId } from "@/lib/planConstants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTierId: CoreTierId;
  nextTierId: CoreTierId | null;
  onConfirm: () => void;
}

function nextBillingDate(): string {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return next.toLocaleDateString("nb-NO", { day: "numeric", month: "long" });
}

export function ConfirmCoreTierChangeDialog({ open, onOpenChange, currentTierId, nextTierId, onConfirm }: Props) {
  if (!nextTierId) return null;
  const current = getCoreTier(currentTierId);
  const next = getCoreTier(nextTierId);
  const isUpgrade = next.monthlyPriceKr > current.monthlyPriceKr;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Endre til {next.label.toLowerCase()}?</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {isUpgrade ? (
            <>
              Prisen går fra {formatKr(current.monthlyPriceKr)} til {formatKr(next.monthlyPriceKr)} i måneden.
              Det nye nivået gjelder med én gang, og differansen kommer på neste faktura.
            </>
          ) : (
            <>
              Prisen går fra {formatKr(current.monthlyPriceKr)} til {formatKr(next.monthlyPriceKr)} i måneden.
              Nivået endres ved neste fakturaperiode, {nextBillingDate()}. Fram til da beholder dere plass til {current.systemLimit} systemer.
            </>
          )}
        </p>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={onConfirm}>
            {isUpgrade ? `Endre for ${formatKr(next.monthlyPriceKr)}/mnd` : "Endre nivå"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
