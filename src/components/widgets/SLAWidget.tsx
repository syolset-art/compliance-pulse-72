import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import type { SLACategory } from "@/lib/certificationPhases";

const SLA_CATEGORIES: SLACategory[] = ['systems_processes', 'organization_governance', 'roles_access'];

export function SLAWidget() {
  const { t } = useTranslation();
  const { requirements } = useComplianceRequirements({});

  const slaData = useMemo(() => {
    return SLA_CATEGORIES.map(cat => {
      const reqs = requirements.filter(r => (r.sla_category || 'organization_governance') === cat);
      const total = reqs.length;
      const completed = reqs.filter(r => r.status === 'completed').length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        key: cat,
        title: t(`isoReadiness.slaCategories.${cat}`),
        percentage,
        current: completed,
        total,
      };
    });
  }, [requirements, t]);
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
          {t("isoReadiness.slaCategories.title", "SLA-oppnåelse")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {slaData.map((item) => (
            <Card key={item.key} className="bg-muted/30 border-border">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">{item.title}</p>
                <div className="flex flex-wrap items-baseline gap-1 sm:gap-2 mb-2">
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">
                    {item.percentage}%
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {item.current} av {item.total}
                  </span>
                </div>
                <Progress 
                  value={item.percentage} 
                  className="h-1.5 mb-3"
                />
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Minus className="h-3.5 w-3.5" />
                  <span>—</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
