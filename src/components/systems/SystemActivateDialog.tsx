import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Cpu, FolderKanban, ClipboardList, Shield, BarChart3, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SystemActivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated: (tier: string) => void;
}

const TIERS = [
  {
    id: "basis",
    name: "Basis",
    price: "1 490",
    maxSystems: 20,
    recommended: false,
    features: [
      { icon: Cpu, label: "Inntil 20 systemer" },
      { icon: FolderKanban, label: "Arbeidsområder" },
      { icon: ClipboardList, label: "Oppgaver" },
      { icon: Shield, label: "Risikovurdering" },
      { icon: BarChart3, label: "Compliance-oversikt" },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "2 490",
    maxSystems: 70,
    recommended: true,
    features: [
      { icon: Cpu, label: "Inntil 70 systemer" },
      { icon: FolderKanban, label: "Arbeidsområder" },
      { icon: ClipboardList, label: "Oppgaver" },
      { icon: Shield, label: "Risikovurdering" },
      { icon: BarChart3, label: "Compliance-oversikt" },
      { icon: Zap, label: "Prioritert support" },
    ],
  },
];

export function SystemActivateDialog({ open, onOpenChange, onActivated }: SystemActivateDialogProps) {
  const [selectedTier, setSelectedTier] = useState<string>("basis");
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async () => {
    setIsActivating(true);
    // Simulate activation
    await new Promise((r) => setTimeout(r, 1200));
    localStorage.setItem("system_premium_activated", "true");
    localStorage.setItem("system_premium_tier", selectedTier);
    const tier = TIERS.find((t) => t.id === selectedTier);
    toast.success(`${tier?.name}-plan aktivert! Du kan nå legge til opptil ${tier?.maxSystems} systemer.`);
    onActivated(selectedTier);
    onOpenChange(false);
    setIsActivating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Velg plan for Systemstyring
          </DialogTitle>
          <DialogDescription>
            Velg den planen som passer din organisasjon. Begge inkluderer arbeidsområder og oppgaver.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={`p-5 cursor-pointer transition-all relative ${
                selectedTier === tier.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40"
              }`}
              onClick={() => setSelectedTier(tier.id)}
            >
              {tier.recommended && (
                <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[10px]">
                  Anbefalt
                </Badge>
              )}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-foreground">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">kr/mnd</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-4">
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
              : `Aktiver ${TIERS.find((t) => t.id === selectedTier)?.name} – ${TIERS.find((t) => t.id === selectedTier)?.price} kr/mnd`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
