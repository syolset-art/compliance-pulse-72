import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { PartnerOffer } from "./offerTypes";

interface Props {
  open: boolean;
  offer: PartnerOffer | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export function DeclineOfferDialog({ open, offer, onOpenChange, onConfirm }: Props) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marker tilbudet som avslått</DialogTitle>
          <DialogDescription>
            {offer
              ? `${offer.offerNumber} · ${offer.frameworkLabel ?? offer.serviceTitle}`
              : "Registrer at kunden ikke gikk videre med tilbudet."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="decline-reason" className="text-xs">
            Begrunnelse (valgfritt)
          </Label>
          <Textarea
            id="decline-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 300))}
            placeholder="F.eks. Kunden utsetter til neste budsjettår."
            rows={3}
            className="text-sm resize-none"
          />
          <p className="text-[11px] text-muted-foreground">{reason.length}/300</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={() => {
              onConfirm(reason.trim() || "Registrert som avslått av partner");
              onOpenChange(false);
            }}
          >
            Marker som avslått
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
