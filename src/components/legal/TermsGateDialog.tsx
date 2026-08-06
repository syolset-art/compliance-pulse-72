import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TermsAcceptRow } from "@/components/legal/TermsAcceptRow";
import { useTerms, TermsContext } from "@/hooks/useTerms";

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
  onConfirmed: () => void | Promise<void>;
}

/**
 * Small confirmation dialog that records terms acceptance before
 * completing an activation or purchase.
 */
export function TermsGateDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Aktiver",
  context,
  contextRef,
  onConfirmed,
}: TermsGateDialogProps) {
  const { current, hasAcceptedCurrent, acceptTerms } = useTerms();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const checked = accepted || hasAcceptedCurrent;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await acceptTerms(context, contextRef);
      await onConfirmed();
      onOpenChange(false);
      setAccepted(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <TermsAcceptRow
          id="terms-gate"
          checked={checked}
          onCheckedChange={setAccepted}
          version={current?.version}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleConfirm} disabled={!checked || saving}>
            {saving ? "Aktiverer…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
