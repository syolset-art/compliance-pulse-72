import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTerms, TermsContext } from "@/hooks/useTerms";
import { usePartnerMandate } from "@/hooks/usePartnerMandate";
import {
  PartnerMandateChecklist,
  EMPTY_PARTNER_MANDATE,
  isPartnerMandateComplete,
  type PartnerMandateState,
} from "@/components/legal/PartnerMandateChecklist";
import { CUSTOMER_TERMS } from "@/content/legal";
import { formatKr } from "@/lib/planConstants";

interface TermsGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  context: TermsContext;
  contextRef?: string;
  /** Månedspris eks. mva. Vises som prislinje når satt. */
  monthlyPriceKr?: number;
  /** Nivå-/planetikett som vises sammen med prisen. */
  priceLabel?: string;
  /** Settes når en partner aktiverer på vegne av en sluttkunde. */
  partnerCustomer?: { id: string; name: string };
  onConfirmed: () => void | Promise<void>;
}

/**
 * Bekreftelsesdialog som registrerer aktiv aksept av vilkårene før
 * en aktivering eller et kjøp fullføres. Ingen forhåndsavkryssing.
 */
export function TermsGateDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Aktiver",
  context,
  contextRef,
  monthlyPriceKr,
  priceLabel,
  partnerCustomer,
  onConfirmed,
}: TermsGateDialogProps) {
  const { current, acceptTerms } = useTerms();
  const { confirmed: mandateConfirmed, confirmMandate } = usePartnerMandate(partnerCustomer?.id);
  const [accepted, setAccepted] = useState(false);
  const [mandate, setMandate] = useState<PartnerMandateState>(EMPTY_PARTNER_MANDATE);
  const [saving, setSaving] = useState(false);

  // Aktiv aksept kreves hver gang dialogen åpnes.
  useEffect(() => {
    if (open) {
      setAccepted(false);
      setMandate(EMPTY_PARTNER_MANDATE);
    }
  }, [open]);

  const needsMandate = Boolean(partnerCustomer) && !mandateConfirmed;
  const mandateOk = !needsMandate || isPartnerMandateComplete(mandate);
  // Partneren kan ikke akseptere sluttkundevilkårene på kundens vegne.
  const needsCustomerTerms = !partnerCustomer;
  const canConfirm = mandateOk && (!needsCustomerTerms || accepted);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      if (needsMandate) await confirmMandate();
      if (needsCustomerTerms) await acceptTerms(context, contextRef);
      await onConfirmed();
      onOpenChange(false);
      setAccepted(false);
      setMandate(EMPTY_PARTNER_MANDATE);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {monthlyPriceKr !== undefined && (
          <div className="space-y-1 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {priceLabel ?? "Månedspris"}
              </span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {monthlyPriceKr === 0 ? "Gratis" : `${formatKr(monthlyPriceKr)} /mnd`}
                {monthlyPriceKr > 0 && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">eks. mva</span>
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Tjenesten aktiveres umiddelbart, og faktureres på neste faktura.
            </p>
          </div>
        )}

        {needsMandate && partnerCustomer && (
          <PartnerMandateChecklist
            customerName={partnerCustomer.name}
            value={mandate}
            onChange={setMandate}
            disabled={saving}
          />
        )}

        {partnerCustomer && !needsMandate && (
          <p className="text-xs text-muted-foreground">
            Fullmakt for {partnerCustomer.name} er allerede bekreftet. Sluttkunden må selv
            akseptere sluttkundevilkårene ved første innlogging.
          </p>
        )}

        {needsCustomerTerms && (
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms-gate-accept"
              checked={accepted}
              disabled={saving}
              onCheckedChange={(v) => setAccepted(v === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="terms-gate-accept"
              className="cursor-pointer text-xs leading-relaxed text-muted-foreground"
            >
              Jeg har lest og godtar{" "}
              <a
                href={`/dokumenter/${CUSTOMER_TERMS.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-primary"
              >
                {CUSTOMER_TERMS.title} v{current?.version ?? CUSTOMER_TERMS.version}
              </a>
              .
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleConfirm} disabled={!canConfirm || saving}>
            {saving ? "Aktiverer…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
