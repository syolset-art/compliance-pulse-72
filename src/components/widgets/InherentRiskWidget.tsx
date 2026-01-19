import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

interface RiskLevel {
  key: string;
  emoji: string;
  color: string;
  progressColor: string;
  previous: number;
  current: number;
  max: number;
}

export function InherentRiskWidget() {
  const { t } = useTranslation();
  
  const riskLevels: RiskLevel[] = [
    { key: "critical", emoji: "🔴", color: "text-destructive", progressColor: "bg-destructive", previous: 5, current: 3, max: 20 },
    { key: "high", emoji: "🟠", color: "text-warning", progressColor: "bg-warning", previous: 7, current: 5, max: 20 },
    { key: "medium", emoji: "🟡", color: "text-yellow-500", progressColor: "bg-yellow-500", previous: 11, current: 13, max: 20 },
    { key: "low", emoji: "🟢", color: "text-success", progressColor: "bg-success", previous: 15, current: 15, max: 20 },
  ];

  const totalRisks = riskLevels.reduce((sum, level) => sum + level.current, 0);
  const criticalChange = riskLevels[0].previous - riskLevels[0].current + riskLevels[1].previous - riskLevels[1].current;
  const isImproving = criticalChange > 0;

  const getRiskLabel = (key: string) => {
    const labels: Record<string, string> = {
      critical: t("widgets.critical", "Kritisk"),
      high: t("widgets.high", "Høy"),
      medium: t("widgets.medium", "Medium"),
      low: t("widgets.low", "Lav"),
    };
    return labels[key] || key;
  };

  const getTrendIcon = (previous: number, current: number) => {
    const change = current - previous;
    if (change < 0) return <TrendingDown className="h-3.5 w-3.5 text-success" />;
    if (change > 0) return <TrendingUp className="h-3.5 w-3.5 text-destructive" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const getTrendText = (previous: number, current: number) => {
    const change = current - previous;
    if (change === 0) return null;
    return (
      <span className={change < 0 ? "text-success" : "text-destructive"}>
        ({change < 0 ? "↓" : "↑"}{Math.abs(change)})
      </span>
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">
          📊 {t("widgets.riskPicture", "Risikobilde")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("widgets.howItLooksNow", "Slik ser det ut nå")}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {riskLevels.map((level) => (
            <div key={level.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{level.emoji}</span>
                  <span className="text-foreground font-medium">{getRiskLabel(level.key)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{level.current}</span>
                  {getTrendText(level.previous, level.current)}
                  {getTrendIcon(level.previous, level.current)}
                </div>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${level.progressColor}`}
                  style={{ width: `${(level.current / level.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary box */}
        <div className="mt-5 p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("widgets.totalRisks", "Totalt")}: <span className="font-semibold text-foreground">{totalRisks} {t("widgets.risks", "risikoer")}</span>
              </p>
            </div>
            {isImproving && (
              <div className="flex items-center gap-1.5 text-success text-sm">
                <TrendingDown className="h-4 w-4" />
                <span className="font-medium">
                  {criticalChange} {t("widgets.fewerCritical", "færre kritiske")}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
