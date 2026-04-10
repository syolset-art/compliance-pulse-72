import { Lock, ArrowRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { DOMAIN_STANDARDS } from "@/lib/certificationPhases";
import { cn } from "@/lib/utils";
import { formatKr, isFrameworkFree, getFrameworkYearlyPrice } from "@/lib/planConstants";
import type { RequirementDomain } from "@/lib/complianceRequirementsData";

interface LockedDomainCardProps {
  domainId: RequirementDomain;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  priceInOre: number;
  onActivate: () => void;
}

export function LockedDomainCard({
  domainId,
  icon,
  colorClass,
  bgClass,
  borderClass,
  priceInOre,
  onActivate,
}: LockedDomainCardProps) {
  const { t } = useTranslation();
  const standards = DOMAIN_STANDARDS[domainId];

  // Use framework yearly price if available, otherwise fall back to priceInOre
  const yearlyPriceKr = getFrameworkYearlyPrice(domainId);
  const isFree = isFrameworkFree(domainId);

  return (
    <Card className={cn("transition-all opacity-75 hover:opacity-90", borderClass)}>
      <CardHeader className={cn("pb-3", bgClass)}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg relative", bgClass)}>
            <div className={colorClass}>{icon}</div>
            <Lock className="w-3 h-3 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-muted-foreground">
              {t(`tasks.readiness.domains.${domainId}`)}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
              {standards.primary}
            </p>
            <p className="text-[10px] text-muted-foreground">
              + {standards.supporting.join(", ")}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-1">
            {t("isoReadiness.locked.notActivated")}
          </p>
          {isFree ? (
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              Inkludert gratis
            </p>
          ) : (
            <p className="text-sm font-semibold text-foreground">
              {formatKr(yearlyPriceKr)}/år
            </p>
          )}
          {!isFree && yearlyPriceKr > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Inkl. gap-analyse, tiltaksliste, modenhet og rapport
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <Button size="sm" className="flex-1 gap-1" onClick={onActivate}>
            {t("isoReadiness.locked.activate")}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
