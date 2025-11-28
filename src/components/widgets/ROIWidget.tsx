import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, DollarSign, CheckCircle } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { useTranslation } from "react-i18next";

export function ROIWidget() {
  const { t } = useTranslation();
  // Kalkulerte besparelser basert på bruk av Mynders AI Agenter
  const roiMetrics = {
    timeSavedHours: 127,
    costSavedNOK: 285000,
    tasksCompleted: 234,
    efficiency: 89
  };

  const comparisons = [
    {
      taskKey: "gdprGapAnalysis",
      traditional: "3-4 uker",
      withAI: "2 timer",
      savings: "95%"
    },
    {
      taskKey: "treatmentProtocol",
      traditional: "5-7 dager",
      withAI: "45 min",
      savings: "92%"
    },
    {
      taskKey: "complianceReport",
      traditional: "2-3 uker",
      withAI: "1.5 timer",
      savings: "96%"
    }
  ];

  return (
    <Card className="overflow-hidden border-success/20 bg-gradient-to-br from-success/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <CardTitle>{t("widgets.roi.title")}</CardTitle>
              <CardDescription>{t("widgets.roi.subtitle")}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main metrics grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">{t("widgets.roi.timeSaved")}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{roiMetrics.timeSavedHours}</p>
            <p className="text-sm text-muted-foreground">{t("widgets.roi.hours")}</p>
          </div>

          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-muted-foreground">{t("widgets.roi.costSaved")}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {roiMetrics.costSavedNOK.toLocaleString('nb-NO')}
            </p>
            <p className="text-sm text-muted-foreground">NOK</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">{t("widgets.roi.tasksCompleted")}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{roiMetrics.tasksCompleted}</p>
          </div>

          <div className="p-4 rounded-lg bg-success/5 border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-muted-foreground">{t("widgets.roi.efficiency")}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{roiMetrics.efficiency}%</p>
          </div>
        </div>

        {/* Comparison table */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground mb-3">{t("widgets.roi.comparisonTitle")}</h4>
          {comparisons.map((comparison, index) => (
            <div 
              key={index}
              className="p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{t(`widgets.roi.tasks.${comparison.taskKey}`)}</span>
                <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded">
                  {comparison.savings} {t("widgets.roi.faster")}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t("widgets.roi.traditional")}</span>
                  <span className="font-medium text-muted-foreground line-through">{comparison.traditional}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t("widgets.roi.withAI")}</span>
                  <span className="font-medium text-success">{comparison.withAI}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            {t("widgets.roi.note")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}