import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { RequirementWithStatus } from "@/hooks/useComplianceRequirements";
import type { SLACategory } from "@/lib/certificationPhases";

interface SLACategoryBreakdownProps {
  requirements: RequirementWithStatus[];
}

interface SLAData {
  category: SLACategory;
  completed: number;
  total: number;
  percentage: number;
  trend: number; // mock trend
}

const MOCK_TRENDS: Record<SLACategory, number> = {
  systems_processes: 23,
  organization_governance: -15,
  roles_access: -5,
};

export function SLACategoryBreakdown({ requirements }: SLACategoryBreakdownProps) {
  const { t } = useTranslation();

  const categories: SLAData[] = (['systems_processes', 'organization_governance', 'roles_access'] as SLACategory[]).map(cat => {
    const reqs = requirements.filter(r => r.sla_category === cat);
    const completed = reqs.filter(r => r.status === 'completed').length;
    const total = reqs.length;
    return {
      category: cat,
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      trend: MOCK_TRENDS[cat],
    };
  });

  const categoryKeys: Record<SLACategory, string> = {
    systems_processes: 'isoReadiness.slaCategories.systems_processes',
    organization_governance: 'isoReadiness.slaCategories.organization_governance',
    roles_access: 'isoReadiness.slaCategories.roles_access',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {categories.map((item) => (
        <Card key={item.category} className="bg-muted/30 border-border">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
              {t(categoryKeys[item.category])}
            </p>
            <div className="flex flex-wrap items-baseline gap-1 sm:gap-2 mb-2">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">
                {item.percentage}%
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {item.completed} / {item.total} {t("isoReadiness.fulfilled")}
              </span>
            </div>
            <Progress value={item.percentage} className="h-1.5 mb-3" />
            <div className={`flex items-center gap-1 text-sm ${
              item.trend > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
            }`}>
              {item.trend > 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>{item.trend > 0 ? "+" : ""}{item.trend}%</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
