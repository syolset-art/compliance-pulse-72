import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, Shield, FileText, BarChart3, Bell } from "lucide-react";
import { toast } from "sonner";

interface VendorActivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated: () => void;
}

const FEATURES = [
  { icon: Shield, label: "Ubegrenset antall leverandører" },
  { icon: FileText, label: "Automatisk DPA-sporing og påminnelser" },
  { icon: BarChart3, label: "Risikoanalyse og compliance-scoring" },
  { icon: Bell, label: "Varsler ved utløpende avtaler og sertifiseringer" },
];

export function VendorActivateDialog({ open, onOpenChange, onActivated }: VendorActivateDialogProps) {
  const handleActivate = () => {
    // Store activation in localStorage for demo purposes
    localStorage.setItem("vendor_premium_activated", "true");
    toast.success("Leverandørstyring er nå aktivert! Full tilgang er tilgjengelig.");
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
            Få full tilgang til TPRM-modulen med automatisert leverandørstyring, DPA-sporing og risikoanalyse.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">990 kr<span className="text-sm font-normal text-muted-foreground">/mnd</span></p>
          <p className="text-xs text-muted-foreground mt-1">Faktureres månedlig. Kan kanselleres når som helst.</p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleActivate} className="gap-2 bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90 text-white">
            <Sparkles className="h-4 w-4" />
            Aktiver nå
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
