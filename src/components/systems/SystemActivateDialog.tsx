import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Check, Sparkles, Cpu, FolderKanban, ClipboardList, Shield,
  BarChart3, Zap, CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  PLAN_TIERS, ORDERED_TIERS, FREE_INCLUSIONS, formatKr,
  getAnnualSavingsKr, type BillingInterval, type PlanTier,
} from "@/lib/planConstants";

interface SystemActivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated: (tier: string) => void;
}

const TIER_FEATURES: Record<string, { icon: typeof Cpu; label: string }[]> = {
  basis: [
    { icon: Cpu, label: "Inntil 20 systemer / leverandører" },
    { icon: FolderKanban, label: "Arbeidsområder" },
    { icon: ClipboardList, label: "Oppgaver" },
    { icon: Shield, label: "Risikovurdering" },
    { icon: BarChart3, label: "Compliance-oversikt" },
  ],
  premium: [
    { icon: Cpu, label: "Inntil 70 systemer / leverandører" },
    { icon: FolderKanban, label: "Arbeidsområder" },
    { icon: ClipboardList, label: "Oppgaver" },
    { icon: Shield, label: "Risikovurdering" },
    { icon: BarChart3, label: "Compliance-oversikt" },
    { icon: Zap, label: "Prioritert support" },
  ],
};

export function SystemActivateDialog({ open, onOpenChange, onActivated }: SystemActivateDialogProps) {
  const [selectedTier, setSelectedTier] = useState<PlanTier>("basis");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async () => {
    setIsActivating(true);
    await new Promise((r) => setTimeout(r, 1200));
    localStorage.setItem("system_premium_activated", "true");
    localStorage.setItem("system_premium_tier", selectedTier);
    const tier = PLAN_TIERS[selectedTier];
    toast.success(`${tier.displayName}-plan aktivert! Du kan nå legge til opptil ${tier.maxSystems} systemer.`);
    onActivated(selectedTier);
    onOpenChange(false);
    setIsActivating(false);
  };

  const getPrice = (tier: PlanTier) => {
    const plan = PLAN_TIERS[tier];
    return billingInterval === "yearly" ? plan.yearly : plan.monthly;
  };

  const tiers = (["basis", "premium"] as PlanTier[]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Oppgrader planen din
          </DialogTitle>
          <DialogDescription>
            Velg den planen som passer din organisasjon. GDPR og ISO 27001 er inkludert gratis i alle planer.
          </DialogDescription>
        </DialogHeader>

        {/* Free inclusions */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">INKLUDERT GRATIS I ALLE PLANER</p>
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
          {tiers.map((tierId) => {
            const tier = PLAN_TIERS[tierId];
            const features = TIER_FEATURES[tierId] || [];
            const price = getPrice(tierId);
            const isRecommended = tierId === "premium";

            return (
              <Card
                key={tierId}
                className={`p-5 cursor-pointer transition-all relative ${
                  selectedTier === tierId
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40"
                }`}
                onClick={() => setSelectedTier(tierId)}
              >
                {isRecommended && (
                  <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[10px]">
                    Anbefalt
                  </Badge>
                )}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{tier.displayName}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold text-foreground">
                        {formatKr(price)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {billingInterval === "yearly" ? "/år" : "/mnd"}
                      </span>
                    </div>
                    {billingInterval === "yearly" && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                        Spar {formatKr(getAnnualSavingsKr(tierId))} per år
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground">{feature.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleActivate}
            disabled={isActivating}
            className="gap-2 bg-gradient-to-r from-blue-600 to-primary hover:from-blue-700 hover:to-primary/90 text-white"
          >
            <Sparkles className="h-4 w-4" />
            {isActivating
              ? "Aktiverer..."
              : `Aktiver ${PLAN_TIERS[selectedTier].displayName} – ${formatKr(getPrice(selectedTier))}${billingInterval === "yearly" ? "/år" : "/mnd"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
