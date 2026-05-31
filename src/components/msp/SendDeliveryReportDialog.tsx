import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, FileText, ShieldCheck } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryTitle: string;
  fileName: string;
  frameworkLabel?: string;
  customerName: string;
  defaultEmail?: string;
  controlsCount: number;
  activitiesCount: number;
  evidenceCount: number;
  onSend: (payload: { email: string; message: string }) => void;
}

export const SendDeliveryReportDialog = ({
  open,
  onOpenChange,
  deliveryTitle,
  fileName,
  frameworkLabel,
  customerName,
  defaultEmail,
  controlsCount,
  activitiesCount,
  evidenceCount,
  onSend,
}: Props) => {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail ?? "");
      setMessage(
        `Hei,\n\nVi har fullført leveransen «${deliveryTitle}». Vedlagt finner du sluttrapporten med all dokumentasjon og bevis. Når du godkjenner rapporten oppdateres modenheten på berørte kontrollpunkter automatisk.\n\nMvh\nDin partner`,
      );
    }
  }, [open, defaultEmail, deliveryTitle]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <DialogTitle>Send leveranserapport til kunde</DialogTitle>
          </div>
          <DialogDescription>
            Rapporten legges i kundens meldingsboks. Når kunden godkjenner,
            oppdateres modenheten på berørte kontrollpunkter automatisk.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground truncate">
              {fileName}
            </span>
            {frameworkLabel && (
              <Badge variant="outline" className="text-xs">
                {frameworkLabel}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{controlsCount} kontrollpunkter</span>
            <span>·</span>
            <span>{activitiesCount} aktiviteter</span>
            <span>·</span>
            <span>{evidenceCount} vedlegg</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Mottaker ({customerName})
            </label>
            <Input
              type="email"
              placeholder="kontakt@kunde.no"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Melding
            </label>
            <Textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/15 p-2.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              Når kunden klikker «Godkjenn» i sin meldingsboks blir rapporten
              signert og kontrollpunktene berikes i kundens modenhetsberegning.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            className="gap-1.5"
            onClick={() => onSend({ email, message })}
            disabled={!email}
          >
            <Send className="h-4 w-4" />
            Send til kunde
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
