import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { FREE_INCLUSIONS } from "@/lib/planConstants";
import { useActivatedServices } from "@/hooks/useActivatedServices";

interface VendorActivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated: () => void;
}

export function VendorActivateDialog({ open, onOpenChange, onActivated }: VendorActivateDialogProps) {
  const { activateService } = useActivatedServices();

  const features = [
    "Automatisk DPA-sporing og risikoanalyse",
    "Compliance-scoring og varsler",
    "Ubegrenset antall leverandører",
    "AI-drevet leverandøranalyse via Lara",
  ];

  const handleActivate = () => {
    activateService("module-vendors", "user");
    toast.success("Leverandørstyring aktivert! Inkludert i din Profesjonell-plan.");
    onActivated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Aktiver Leverandørstyring
          </DialogTitle>
          <DialogDescription>
            Komplett leverandørstyring med DPA-sporing, risikoanalyse, compliance-scoring og varsler.
          </DialogDescription>
        </DialogHeader>

        {/* Plan inclusion banner */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium text-foreground">
            Inkludert i din <span className="text-primary">Profesjonell</span>-plan
          </p>
        </div>

        {/* Free inclusions reminder */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">ALLTID INKLUDERT</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {FREE_INCLUSIONS.map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleActivate} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Aktiver Leverandørstyring
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
