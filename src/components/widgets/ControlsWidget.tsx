import { Info, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface SLACategory {
  id: string;
  nameKey: string;
  defaultName: string;
  assigned: number;
  total: number;
  previousAssigned: number;
}

export function ControlsWidget() {
  const { t } = useTranslation();

  const categories: SLACategory[] = [
    {
      id: "systems",
      nameKey: "widgets.systemsAndProcesses",
      defaultName: "Systemer og prosesser",
      assigned: 34,
      total: 40,
      previousAssigned: 31,
    },
    {
      id: "organization",
      nameKey: "widgets.organizationAndGovernance",
      defaultName: "Organisasjon og styring",
      assigned: 24,
      total: 36,
      previousAssigned: 19,
    },
    {
      id: "roles",
      nameKey: "widgets.rolesAndAccess",
      defaultName: "Roller og tilganger",
      assigned: 22,
      total: 24,
      previousAssigned: 23,
    },
  ];

  const totalAssigned = categories.reduce((sum, c) => sum + c.assigned, 0);
  const totalControls = categories.reduce((sum, c) => sum + c.total, 0);

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return "bg-success";
    if (percent >= 50) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                {t("widgets.controlStatus", "Kontrollstatus")}
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">
                      {t("widgets.controlStatusTooltip", "Viser hvor mange sikkerhetskontroller som har en ansvarlig person tildelt, fordelt på SLA-kategorier.")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("widgets.whoIsResponsible", "Hvem har ansvar for hva?")}
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {t("widgets.vsPreviousMonth", "vs. forrige måned")}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category) => {
            const percent = Math.round((category.assigned / category.total) * 100);
            const change = category.assigned - category.previousAssigned;

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium truncate">
                    {t(category.nameKey, category.defaultName)}
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm flex-shrink-0">
                    <span className="font-semibold text-foreground">{percent}%</span>
                    <span className="text-muted-foreground">
                      ({category.assigned}/{category.total})
                    </span>
                    {change !== 0 && (
                      <span className={change > 0 ? "text-success" : "text-destructive"}>
                        {change > 0 ? "↗+" : "↘"}{Math.abs(change)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${getProgressColor(percent)}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-5 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            {t("widgets.totalControls", "Totalt")}: <span className="font-semibold text-foreground">{totalAssigned} {t("widgets.of", "av")} {totalControls}</span> {t("widgets.controlsAssigned", "kontroller tildelt")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
