import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TermsAcceptRow } from "@/components/legal/TermsAcceptRow";
import { useTerms } from "@/hooks/useTerms";
import { formatKr, getVendorTier, type VendorTierId } from "@/lib/planConstants";
import { getProductSetupFee } from "@/lib/productSetupFees";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTierId: VendorTierId;
  nextTierId: VendorTierId | null;
  onConfirm: () => void;
  mode?: "change" | "activate";
  /** Partnerkontekst: viser driftspartner-bekreftelse og navngir kunden. */
  customerName?: string;
}

function nextBillingDate(): string {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return next.toLocaleDateString("nb-NO", { day: "numeric", month: "long" });
}

export function ConfirmVendorTierChangeDialog({ open, onOpenChange, currentTierId, nextTierId, onConfirm, mode = "change", customerName }: Props) {
  const { current: currentTerms, hasAcceptedCurrent, acceptTerms } = useTerms();
  const [accepted, setAccepted] = useState(false);
  const [operatorRole, setOperatorRole] = useState(false);
  const [operatorScope, setOperatorScope] = useState<"customer" | "global">("customer");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setAccepted(false);
      setOperatorRole(false);
    }
  }, [open]);

  if (!nextTierId) return null;
  const current = getVendorTier(currentTierId);
  const next = getVendorTier(nextTierId);
  const isUpgrade = next.monthlyPriceKr > current.monthlyPriceKr;
  const checked = accepted || hasAcceptedCurrent;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await acceptTerms("license_purchase", nextTierId, { operatorRole , operatorScope });
      onConfirm();
    } finally {
      setSaving(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {mode === "activate"
              ? `Aktiver Leverandørmodul – ${next.label.toLowerCase()}?`
              : `Endre til ${next.label.toLowerCase()}?`}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {mode === "activate" ? (
            <>
              {next.monthlyPriceKr === 0
                ? "Nivået er gratis for inntil 5 leverandører."
                : `Modulen koster ${formatKr(next.monthlyPriceKr)} i måneden eks. mva.`}{" "}
              Tjenesten aktiveres umiddelbart{customerName ? ` hos ${customerName}` : ""}, og faktureres på neste faktura.
            </>
          ) : isUpgrade ? (
            <>
              Prisen går fra {formatKr(current.monthlyPriceKr)} til {formatKr(next.monthlyPriceKr)} i måneden eks. mva.
              Tjenesten aktiveres umiddelbart, og faktureres på neste faktura.
            </>
          ) : (
            <>
              Prisen går fra {formatKr(current.monthlyPriceKr)} til {formatKr(next.monthlyPriceKr)} i måneden eks. mva.
              Nivået endres ved neste fakturaperiode, {nextBillingDate()}. Fram til da beholder dere plass til {current.vendorLimit} leverandører.
            </>
          )}
        </p>

        {/* Etableringspakken (partnerens fastpris) vises kun ved førstegangs aktivering. */}
        {mode === "activate" &&
          (() => {
            const setupFee = getProductSetupFee("vendors");
            if (!setupFee) return null;
            return (
              <div className="rounded-lg border border-dashed p-3 space-y-0.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-foreground">
                    Etableringspakke – Leverandørmodulen
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-foreground">
                    {formatKr(setupFee.amountKr)} engangs
                  </span>
                </div>
                {setupFee.description && (
                  <p className="text-xs text-muted-foreground">{setupFee.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Faktureres som et engangsbeløp. Vises ikke ved senere nivåendring.
                </p>
              </div>
            );
          })()}

        <TermsAcceptRow
          id="terms-vendor-tier"
          checked={checked}
          onCheckedChange={setAccepted}
          version={currentTerms?.version}
          showOperatorRole={!!customerName}
          operatorRole={operatorRole}
            operatorScope={operatorScope}
            onOperatorScopeChange={setOperatorScope}
            operatorScopeCustomerName={customerName}
          onOperatorRoleChange={setOperatorRole}
        />

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleConfirm} disabled={!checked || saving}>
            {mode === "activate"
              ? "Aktiver modulen"
              : isUpgrade ? `Endre for ${formatKr(next.monthlyPriceKr)}/mnd` : "Endre nivå"}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
