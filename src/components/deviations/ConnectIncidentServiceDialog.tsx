import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CreditCard, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface ConnectIncidentServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectIncidentServiceDialog({
  open,
  onOpenChange,
}: ConnectIncidentServiceDialogProps) {
  const [requested, setRequested] = useState(false);

  const handleRequest = () => {
    setRequested(true);
    toast.success("Interesse registrert", {
      description: "Vi tar kontakt når MDR-koblingen åpnes.",
    });
  };

  const rows = [
    {
      icon: ShieldCheck,
      title: "Leverandøren må godkjenne",
      text: "7 Security godkjenner koblingen før hendelser sendes til Mynder.",
    },
    {
      icon: CreditCard,
      title: "Kostnad",
      text: "Tjenesten prises av tjenestetilbyder. Pris oppgis før aktivering.",
    },
    {
      icon: FileText,
      title: "Vilkår",
      text: "Egne vilkår for datadeling må aksepteres av begge parter.",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[11px] border-dashed text-muted-foreground">
              Kommer
            </Badge>
          </div>
          <DialogTitle>MDR – Managed Detection &amp; Response</DialogTitle>
          <DialogDescription>
            Tjenestetilbyder: 7 Security. Hendelser fra MDR-tjenesten opprettes
            automatisk som avvik i registeret.
          </DialogDescription>
        </DialogHeader>

        {requested ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Interesse registrert</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vi kontakter deg når koblingen mot 7 Security åpnes.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.title} className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <row.icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{row.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{row.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
          {!requested && <Button onClick={handleRequest}>Meld interesse</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
