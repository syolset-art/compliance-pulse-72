import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MODULES, FREE_INCLUSIONS, formatKr, getModulePrice, type BillingInterval } from "@/lib/planConstants";
import { useActivatedServices } from "@/hooks/useActivatedServices";

interface SystemActivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated: (tier: string) => void;
}

export function SystemActivateDialog({ open, onOpenChange, onActivated }: SystemActivateDialogProps) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [isActivating, setIsActivating] = useState(false);
  const { activateService } = useActivatedServices();

  const mod = MODULES.systems;
  const price = getModulePrice("systems", billingInterval);

  const handleActivate = async () => {
    setIsActivating(true);
    await new Promise((r) => setTimeout(r, 1200));
    activateService("module-systems", "user");
    toast.success(`Mynder Core aktivert! Komponenten trekker credits basert på din bruk. +${mod.bonusCredits} credits/mnd inkludert.`);
    onActivated("active");
    onOpenChange(false);
    setIsActivating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Aktiver {mod.displayName}
          </DialogTitle>
          <DialogDescription>
            {mod.description}
          </DialogDescription>
        </DialogHeader>

        {/* Free inclusions */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">INKLUDERT GRATIS</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {FREE_INCLUSIONS.map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="text-center py-3">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold text-foreground">{formatKr(price)}</span>
            <span className="text-sm text-muted-foreground">
              {billingInterval === "yearly" ? "/år" : "/mnd"}
            </span>
          </div>
          <button
            className="text-xs text-primary underline mt-1"
            onClick={() => setBillingInterval(billingInterval === "monthly" ? "yearly" : "monthly")}
          >
            {billingInterval === "monthly" ? "Vis årspris (spar 2 mnd)" : "Vis månedspris"}
          </button>
        </div>

        {/* Features */}
        <div className="space-y-2">
          {mod.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleActivate}
            disabled={isActivating}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isActivating ? "Aktiverer..." : `Aktiver – ${formatKr(price)}/${billingInterval === "yearly" ? "år" : "mnd"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
