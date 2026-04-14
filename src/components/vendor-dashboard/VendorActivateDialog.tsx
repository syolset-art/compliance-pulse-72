import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Check, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  MODULES, FREE_INCLUSIONS, formatKr, getModulePrice, getModuleAnnualSavingsKr,
  type BillingInterval, type ModuleTier,
} from "@/lib/planConstants";

interface VendorActivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated: () => void;
}

export function VendorActivateDialog({ open, onOpenChange, onActivated }: VendorActivateDialogProps) {
  const [selectedTier, setSelectedTier] = useState<ModuleTier>("basis");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");

  const mod = MODULES.vendors;

  const handleActivate = () => {
    localStorage.setItem("vendor_premium_activated", "true");
    localStorage.setItem("vendor_premium_tier", selectedTier);
    const config = mod.tiers[selectedTier];
    toast.success(`Leverandørmodul (${selectedTier === "premium" ? "Premium" : "Basis"}) aktivert! Du kan nå administrere opptil ${config.maxItems} leverandører.`);
    onActivated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Aktiver Leverandør-tillegget
          </DialogTitle>
          <DialogDescription>
            Legg til leverandørstyring som en separat tilleggsmodul — uavhengig av Mynder Core. Inkluderer DPA-sporing, risikoanalyse og compliance-scoring.
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

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["basis", "premium"] as ModuleTier[]).map((tier) => {
            const config = mod.tiers[tier];
            const price = getModulePrice("vendors", tier, billingInterval);
            const isRecommended = tier === "premium";

            return (
              <Card
                key={tier}
                className={`p-5 cursor-pointer transition-all relative ${
                  selectedTier === tier
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40"
                }`}
                onClick={() => setSelectedTier(tier)}
              >
                {isRecommended && (
                  <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[10px]">
                    Anbefalt
                  </Badge>
                )}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {tier === "basis" ? "Basis" : "Premium"}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold text-foreground">{formatKr(price)}</span>
                      <span className="text-sm text-muted-foreground">
                        {billingInterval === "yearly" ? "/år" : "/mnd"}
                      </span>
                    </div>
                    {billingInterval === "yearly" && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                        Spar {formatKr(getModuleAnnualSavingsKr("vendors", tier))} per år
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {config.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleActivate}
            className="gap-2 bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90 text-white"
          >
            <Sparkles className="h-4 w-4" />
            Aktiver {selectedTier === "basis" ? "Basis" : "Premium"} – {formatKr(getModulePrice("vendors", selectedTier, billingInterval))}{billingInterval === "yearly" ? "/år" : "/mnd"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
