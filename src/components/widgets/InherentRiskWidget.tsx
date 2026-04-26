import { Shield, Lock, Brain, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface DomainRisk {
  id: string;
  name: string;
  icon: React.ReactNode;
  iconBg: string;
  risks: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  previousCriticalHigh: number;
}

export function InherentRiskWidget() {
  const { t } = useTranslation();

  const domains: DomainRisk[] = [
    {
      id: "privacy",
      name: t("widgets.privacy", "Personvern"),
      icon: <Shield className="h-4 w-4" />,
      iconBg: "bg-primary/10 text-primary dark:text-primary",
      risks: { critical: 2, high: 1, medium: 4, low: 8 },
      previousCriticalHigh: 5,
    },
    {
      id: "security",
      name: t("widgets.infoSecurity", "Informasjonssikkerhet"),
      icon: <Lock className="h-4 w-4" />,
      iconBg: "bg-warning/10 text-warning dark:text-warning",
      risks: { critical: 1, high: 3, medium: 5, low: 4 },
      previousCriticalHigh: 6,
    },
    {
      id: "ai",
      name: t("widgets.aiGovernance", "AI Governance"),
      icon: <Brain className="h-4 w-4" />,
      iconBg: "bg-accent/10 text-accent dark:text-accent",
      risks: { critical: 0, high: 1, medium: 4, low: 3 },
      previousCriticalHigh: 2,
    },
  ];

  const totalRisks = domains.reduce(
    (sum, d) => sum + d.risks.critical + d.risks.high + d.risks.medium + d.risks.low,
    0
  );

  const currentCriticalHigh = domains.reduce(
    (sum, d) => sum + d.risks.critical + d.risks.high,
    0
  );
  const previousCriticalHigh = domains.reduce((sum, d) => sum + d.previousCriticalHigh, 0);
  const criticalChange = previousCriticalHigh - currentCriticalHigh;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold text-foreground">
                📊 {t("widgets.riskPicture", "Risikobilde")}
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
                      {t("widgets.riskPictureTooltip", "Viser identifiserte risikoer fordelt på kontrollområder. Risikoer vurderes fra systemer, prosesser og AI-bruk.")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("widgets.riskDistribution", "Fordeling på tvers av kontrollområder")}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {domains.map((domain) => {
            const domainTotal = domain.risks.critical + domain.risks.high + domain.risks.medium + domain.risks.low;
            const currentCH = domain.risks.critical + domain.risks.high;
            const change = domain.previousCriticalHigh - currentCH;

            return (
              <div
                key={domain.id}
                className="p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-md ${domain.iconBg}`}>
                    {domain.icon}
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">
                    {domain.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-destructive">🔴</span>
                    <span className="text-muted-foreground">{t("widgets.critical", "Kritisk")}</span>
                    <span className="font-semibold text-foreground ml-auto">{domain.risks.critical}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-warning">🟠</span>
                    <span className="text-muted-foreground">{t("widgets.high", "Høy")}</span>
                    <span className="font-semibold text-foreground ml-auto">{domain.risks.high}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-warning">🟡</span>
                    <span className="text-muted-foreground">{t("widgets.medium", "Medium")}</span>
                    <span className="font-semibold text-foreground ml-auto">{domain.risks.medium}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-success">🟢</span>
                    <span className="text-muted-foreground">{t("widgets.low", "Lav")}</span>
                    <span className="font-semibold text-foreground ml-auto">{domain.risks.low}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {domainTotal} {t("widgets.risks", "risikoer")}
                  </span>
                  {change !== 0 && (
                    <span className={change > 0 ? "text-success" : "text-destructive"}>
                      {change > 0 ? "↓" : "↑"}{Math.abs(change)} {t("widgets.criticalShort", "krit.")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {t("widgets.totalRisks", "Totalt")}: <span className="font-semibold text-foreground">{totalRisks} {t("widgets.risks", "risikoer")}</span>
            </p>
            {criticalChange > 0 && (
              <div className="flex items-center gap-1.5 text-success text-sm">
                <span className="font-medium">
                  ↓ {criticalChange} {t("widgets.fewerCriticalHigh", "færre kritiske/høye")}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
