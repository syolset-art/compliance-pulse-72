import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Shield, Server, KeyRound, Link2, FileText } from "lucide-react";
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
  trend: number;
}

const MOCK_TRENDS: Record<SLACategory, number> = {
  governance: 12,
  operations: 23,
  identity_access: -5,
  supplier_ecosystem: -15,
  privacy_data: 8,
};

const CATEGORY_ICONS: Record<SLACategory, React.ReactNode> = {
  governance: <Shield className="h-4 w-4" />,
  operations: <Server className="h-4 w-4" />,
  identity_access: <KeyRound className="h-4 w-4" />,
  supplier_ecosystem: <Link2 className="h-4 w-4" />,
  privacy_data: <FileText className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<SLACategory, string> = {
  governance: "text-blue-600 dark:text-blue-400",
  operations: "text-emerald-600 dark:text-emerald-400",
  identity_access: "text-amber-600 dark:text-amber-400",
  supplier_ecosystem: "text-purple-600 dark:text-purple-400",
  privacy_data: "text-rose-600 dark:text-rose-400",
};

export function SLACategoryBreakdown({ requirements }: SLACategoryBreakdownProps) {
  const { t } = useTranslation();

  const categories: SLAData[] = (['governance', 'operations', 'identity_access', 'supplier_ecosystem', 'privacy_data'] as SLACategory[]).map(cat => {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((item) => (
        <Card key={item.category} className="bg-muted/30 border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={CATEGORY_COLORS[item.category]}>
                {CATEGORY_ICONS[item.category]}
              </span>
              <p className="text-xs sm:text-sm font-medium text-foreground">
                {t(`isoReadiness.slaCategories.${item.category}`)}
              </p>
            </div>
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
