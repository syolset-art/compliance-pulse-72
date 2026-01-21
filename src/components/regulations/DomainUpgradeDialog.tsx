import { Check, CreditCard, Sparkles, LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { frameworks } from "@/lib/frameworkDefinitions";

interface DomainUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainId: string;
  domainName: string;
  domainIcon: LucideIcon;
  domainColor: string;
  domainBgColor: string;
  monthlyPrice: number; // in øre
  onActivate: () => void;
  isActivating?: boolean;
  nextBillingDate?: string;
}

export function DomainUpgradeDialog({
  open,
  onOpenChange,
  domainId,
  domainName,
  domainIcon: Icon,
  domainColor,
  domainBgColor,
  monthlyPrice,
  onActivate,
  isActivating = false,
  nextBillingDate = "1. februar 2026"
}: DomainUpgradeDialogProps) {
  
  // Get frameworks for this domain
  const domainFrameworks = frameworks.filter(f => f.category === domainId);

  const formatPrice = (priceInOre: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(priceInOre / 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("p-2.5 rounded-lg", domainBgColor)}>
              <Icon className={cn("h-5 w-5", domainColor)} />
            </div>
            <div>
              <DialogTitle className="text-lg flex items-center gap-2">
                Aktiver {domainName}
                <Sparkles className="h-4 w-4 text-primary" />
              </DialogTitle>
              <DialogDescription>
                Utvid din compliance-dekning
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* What's included */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">
              Dette domenet inkluderer:
            </p>
            <div className="space-y-2">
              {domainFrameworks.map((framework) => (
                <div
                  key={framework.id}
                  className="flex items-start gap-2 text-sm"
                >
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">{framework.name}</span>
                    <span className="text-muted-foreground"> - {framework.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing box */}
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Månedlig tillegg</span>
              <span className="text-2xl font-bold text-foreground">
                + {formatPrice(monthlyPrice)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Legges til på neste faktura ({nextBillingDate})
            </p>
          </div>

          {/* Benefits */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <CreditCard className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              Du kan når som helst deaktivere dette domenet. Endringen trer i kraft ved neste faktureringsperiode.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
            disabled={isActivating}
          >
            Avbryt
          </Button>
          <Button
            onClick={onActivate}
            className="flex-1 sm:flex-none"
            disabled={isActivating}
          >
            {isActivating ? (
              <>Aktiverer...</>
            ) : (
              <>
                Aktiver nå
                <Check className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
