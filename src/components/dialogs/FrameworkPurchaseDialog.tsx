import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  TrendingDown,
  Shield,
} from "lucide-react";
import { getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
import {
  isFrameworkFree,
  FRAMEWORK_ADDONS,
  formatKr,
  getFrameworkYearlyPrice,
} from "@/lib/planConstants";

interface FrameworkPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  framework: Framework | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function FrameworkPurchaseDialog({
  open,
  onOpenChange,
  framework,
  onConfirm,
  isLoading,
}: FrameworkPurchaseDialogProps) {
  if (!framework) return null;

  const category = getCategoryById(framework.category);
  const CategoryIcon = category?.icon;
  const isFree = isFrameworkFree(framework.id);
  const addon = FRAMEWORK_ADDONS[framework.id];
  const yearlyPrice = getFrameworkYearlyPrice(framework.id);
  const monthlyPrice = yearlyPrice > 0 ? Math.round(yearlyPrice / 12) : 0;
  const includes = addon?.includes ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2.5 rounded-xl ${category?.bgColor || "bg-primary/10"}`}>
              {CategoryIcon && (
                <CategoryIcon className={`h-6 w-6 ${category?.color || "text-primary"}`} />
              )}
            </div>
            <div>
              <Badge variant="secondary" className="mb-1 text-xs">
                {category?.name}
              </Badge>
              <DialogTitle className="text-xl">{framework.name}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Bekreft aktivering av {framework.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* What's included */}
          {includes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Inkludert:</p>
              <ul className="space-y-1.5">
                {includes.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pricing */}
          {isFree ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-status-closed/10 border border-status-closed/20">
              <Shield className="h-5 w-5 text-status-closed flex-shrink-0" />
              <p className="text-sm font-medium text-status-closed dark:text-status-closed">
                Inkludert i ditt abonnement — ingen ekstra kostnad
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold text-foreground">{formatKr(monthlyPrice)}</span>
                  <span className="text-sm text-muted-foreground"> /mnd</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatKr(yearlyPrice)} /år
                </p>
              </div>
            </div>
          )}

          {/* Score impact warning */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <TrendingDown className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm text-warning dark:text-warning">
              <p className="font-medium mb-0.5">Compliance-skåren beregnes på nytt</p>
              <p className="text-xs text-warning dark:text-warning/80">
                Nye krav legges til i beregningen. Skåren stiger etter hvert som du dokumenterer status.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Avbryt
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Aktiverer…" : isFree ? "Aktiver" : "Godkjenn og aktiver"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
