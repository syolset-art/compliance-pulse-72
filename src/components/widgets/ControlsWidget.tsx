import { useState } from "react";
import { Info, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";

type Interval = "day" | "week" | "month" | "quarter" | "year";

const DOMAIN_LABELS: Record<string, { no: string; en: string }> = {
  governance: { no: "Styring og ledelse", en: "Governance" },
  operations: { no: "Drift og sikkerhet", en: "Operations & Security" },
  identity_access: { no: "Identitet og tilgang", en: "Identity & Access" },
  privacy_data: { no: "Personvern og data", en: "Privacy & Data" },
  supplier_ecosystem: { no: "Leverandørstyring", en: "Supplier Management" },
};

// Simulated deltas per interval — replace with real historical data when available
const SIMULATED_DELTAS: Record<Interval, Record<string, number>> = {
  day: { governance: 0, operations: 1, identity_access: 0, privacy_data: 0, supplier_ecosystem: 0 },
  week: { governance: 2, operations: 1, identity_access: 1, privacy_data: 0, supplier_ecosystem: 1 },
  month: { governance: 3, operations: 2, identity_access: -1, privacy_data: 1, supplier_ecosystem: 2 },
  quarter: { governance: 5, operations: 4, identity_access: 2, privacy_data: 3, supplier_ecosystem: 3 },
  year: { governance: 8, operations: 7, identity_access: 5, privacy_data: 6, supplier_ecosystem: 5 },
};

export function ControlsWidget() {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language?.startsWith("nb") || i18n.language?.startsWith("no");
  const [interval, setInterval] = useState<Interval>("month");

  const { stats, isLoading } = useComplianceRequirements();
  const byDomain = stats?.byDomainArea;

  const domainKeys = Object.keys(DOMAIN_LABELS);

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return "bg-success";
    if (percent >= 50) return "bg-warning";
    return "bg-destructive";
  };

  // Calculate totals
  let totalAssessed = 0;
  let totalControls = 0;
  if (byDomain) {
    for (const key of domainKeys) {
      const d = byDomain[key];
      if (d) {
        totalAssessed += d.assessed;
        totalControls += d.total;
      }
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
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
                      {t("widgets.controlStatusTooltip", "Viser modenhetsstatus per kontrollområde basert på vurderte krav.")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("widgets.whoIsResponsible", "Hvem har ansvar for hva?")}
            </p>
          </div>
          <Select value={interval} onValueChange={(v) => setInterval(v as Interval)}>
            <SelectTrigger className="w-[140px] h-8 text-xs shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{isNb ? "Siste dag" : "Last day"}</SelectItem>
              <SelectItem value="week">{isNb ? "Siste uke" : "Last week"}</SelectItem>
              <SelectItem value="month">{isNb ? "Siste måned" : "Last month"}</SelectItem>
              <SelectItem value="quarter">{isNb ? "Siste kvartal" : "Last quarter"}</SelectItem>
              <SelectItem value="year">{isNb ? "Siste år" : "Last year"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-2 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {domainKeys.map((key) => {
              const domain = byDomain?.[key];
              if (!domain || domain.total === 0) return null;

              const percent = domain.score;
              const delta = SIMULATED_DELTAS[interval]?.[key] ?? 0;
              const label = isNb ? DOMAIN_LABELS[key].no : DOMAIN_LABELS[key].en;

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium truncate">
                      {label}
                    </span>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm flex-shrink-0">
                      <span className="font-semibold text-foreground">{Math.round(percent)}%</span>
                      <span className="text-muted-foreground">
                        ({domain.assessed}/{domain.total})
                      </span>
                      {delta !== 0 && (
                        <span className={delta > 0 ? "text-success" : "text-destructive"}>
                          {delta > 0 ? "↗+" : "↘"}{Math.abs(delta)}
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
        )}

        {/* Summary */}
        <div className="mt-5 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            {isNb ? "Totalt" : "Total"}: <span className="font-semibold text-foreground">{totalAssessed} {isNb ? "av" : "of"} {totalControls}</span> {isNb ? "kontroller vurdert" : "controls assessed"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
