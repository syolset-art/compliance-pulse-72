import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export function CriticalProcessesWidget() {
  const { t } = useTranslation();
  
  const criticalProcesses = [
    { areaKey: "hrPayroll", count: 4, color: "bg-destructive" },
    { areaKey: "customerData", count: 3, color: "bg-destructive" },
    { areaKey: "healthInfo", count: 2, color: "bg-warning" },
    { areaKey: "itInfrastructure", count: 2, color: "bg-warning" },
    { areaKey: "finance", count: 1, color: "bg-warning" },
  ];
  const totalCritical = criticalProcesses.reduce((sum, p) => sum + p.count, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t("widgets.criticalProcesses.title")}</h3>
            <p className="text-sm text-muted-foreground">{totalCritical} {t("widgets.criticalProcesses.highRiskTreatments")}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {criticalProcesses.map((process) => (
          <div key={process.areaKey} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 flex-1">
              <div className={`h-2 w-2 rounded-full ${process.color}`} />
              <span className="text-sm font-medium text-foreground">{t(`widgets.criticalProcesses.areas.${process.areaKey}`)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{process.count}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full mt-4" size="sm">
        {t("widgets.criticalProcesses.seeAllButton")}
      </Button>
    </Card>
  );
}
