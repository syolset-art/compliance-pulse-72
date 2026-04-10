import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sparkles, CheckCircle2, Shield, FileText, BarChart3, Bell } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  PLAN_TIERS, FREE_INCLUSIONS, formatKr, getAnnualSavingsKr,
  type BillingInterval,
} from "@/lib/planConstants";

interface VendorActivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated: () => void;
}

const FEATURES = [
  { icon: Shield, label: "Ubegrenset antall leverandører (Basis: 20, Premium: 70)" },
  { icon: FileText, label: "Automatisk DPA-sporing og påminnelser" },
  { icon: BarChart3, label: "Risikoanalyse og compliance-scoring" },
  { icon: Bell, label: "Varsler ved utløpende avtaler og sertifiseringer" },
];

export function VendorActivateDialog({ open, onOpenChange, onActivated }: VendorActivateDialogProps) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");

  const basisPlan = PLAN_TIERS.basis;
  const price = billingInterval === "yearly" ? basisPlan.yearly : basisPlan.monthly;

  const handleActivate = () => {
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

        {/* Free inclusions */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">INKLUDERT GRATIS</p>
          <div className="space-y-1">
            {FREE_INCLUSIONS.map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 py-2">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 py-2">
          <span className={`text-sm ${billingInterval === "monthly" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
            Månedlig
          </span>
          <Switch
            checked={billingInterval === "yearly"}
            onCheckedChange={(checked) => setBillingInterval(checked ? "yearly" : "monthly")}
          />
          <span className={`text-sm ${billingInterval === "yearly" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
            Årlig
          </span>
          {billingInterval === "yearly" && (
            <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Spar 2 mnd
            </Badge>
          )}
        </div>

        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {formatKr(price)}
            <span className="text-sm font-normal text-muted-foreground">
              {billingInterval === "yearly" ? "/år" : "/mnd"}
            </span>
          </p>
          {billingInterval === "yearly" && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Spar {formatKr(getAnnualSavingsKr("basis"))} per år
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {billingInterval === "yearly" ? "Faktureres årlig." : "Faktureres månedlig."} Kan kanselleres når som helst.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleActivate} className="gap-2 bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90 text-white">
            <Sparkles className="h-4 w-4" />
            Aktiver nå – {formatKr(price)}{billingInterval === "yearly" ? "/år" : "/mnd"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
