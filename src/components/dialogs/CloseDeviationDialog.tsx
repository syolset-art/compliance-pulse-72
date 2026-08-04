import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useCloseDeviation } from "@/hooks/useVendorDeviations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviation: any;
  assetId?: string;
}

export function CloseDeviationDialog({ open, onOpenChange, deviation, assetId }: Props) {
  const [closedBy, setClosedBy] = useState("");
  const [reason, setReason] = useState("");
  const close = useCloseDeviation(assetId, () => {
    onOpenChange(false);
    setClosedBy(""); setReason("");
  });

  if (!deviation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lukk avvik</DialogTitle>
          <DialogDescription>
            Når avviket lukkes regnes de berørte kravene som oppfylt igjen, basert på dokumentasjonen som allerede ligger inne.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <p className="text-sm font-medium text-foreground">{deviation.title}</p>
          <div className="space-y-1.5">
            <Label>Lukket av</Label>
            <Input value={closedBy} onChange={(e) => setClosedBy(e.target.value)} placeholder="Navn på den som lukker" />
          </div>
          <div className="space-y-1.5">
            <Label>Begrunnelse</Label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Hva er gjort for å lukke avviket?" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button
            disabled={closedBy.trim().length < 2 || reason.trim().length < 3 || close.isPending}
            onClick={() => close.mutate({ deviation, closedBy, reason })}
          >
            {close.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Lukk avvik
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
