import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TermsAcceptRow } from "@/components/legal/TermsAcceptRow";
import { useTerms } from "@/hooks/useTerms";
import { formatKr, getVendorTier, type VendorTierId } from "@/lib/planConstants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTierId: VendorTierId;
  nextTierId: VendorTierId | null;
  onConfirm: () => void;
  mode?: "change" | "activate";
}

function nextBillingDate(): string {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return next.toLocaleDateString("nb-NO", { day: "numeric", month: "long" });
}

export function ConfirmVendorTierChangeDialog({ open, onOpenChange, currentTierId, nextTierId, onConfirm }: Props) {
  const { current: currentTerms, hasAcceptedCurrent, acceptTerms } = useTerms();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setAccepted(false);
  }, [open]);

  if (!nextTierId) return null;
  const current = getVendorTier(currentTierId);
  const next = getVendorTier(nextTierId);
  const isUpgrade = next.monthlyPriceKr > current.monthlyPriceKr;
  const checked = accepted || hasAcceptedCurrent;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await acceptTerms("license_purchase", nextTierId);
      onConfirm();
    } finally {
      setSaving(false);
    }
  };


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
              Nivået endres ved neste fakturaperiode, {nextBillingDate()}. Fram til da beholder dere plass til {current.vendorLimit} leverandører.
            </>
          )}
        </p>

        <TermsAcceptRow
          id="terms-vendor-tier"
          checked={checked}
          onCheckedChange={setAccepted}
          version={currentTerms?.version}
        />

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleConfirm} disabled={!checked || saving}>
            {isUpgrade ? `Endre for ${formatKr(next.monthlyPriceKr)}/mnd` : "Endre nivå"}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
