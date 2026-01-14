import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, Workflow, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AIUsageOverviewWidget = () => {
  const { t } = useTranslation();

  // Fetch asset AI usage stats
  const { data: assetStats } = useQuery({
    queryKey: ["asset-ai-stats"],
    queryFn: async () => {
      const { data: assets, error: assetsError } = await supabase
        .from("assets")
        .select("id");
      if (assetsError) throw assetsError;

      const { data: assetAI, error: aiError } = await supabase
        .from("asset_ai_usage")
        .select("has_ai, risk_category, compliance_status");
      if (aiError) throw aiError;

      const totalAssets = assets?.length || 0;
      const assetsWithAI = assetAI?.filter((a) => a.has_ai).length || 0;

      const riskDistribution = {
        minimal: 0,
        limited: 0,
        high: 0,
        unacceptable: 0,
      };

      assetAI?.forEach((a) => {
        if (a.has_ai && a.risk_category) {
          riskDistribution[a.risk_category as keyof typeof riskDistribution]++;
        }
      });

      const pendingAssessment =
        assetAI?.filter(
          (a) => a.has_ai && (!a.compliance_status || a.compliance_status === "not_assessed")
        ).length || 0;

      return {
        totalAssets,
        assetsWithAI,
        riskDistribution,
        pendingAssessment,
      };
    },
  });

  // Fetch process AI usage stats
  const { data: processStats } = useQuery({
    queryKey: ["process-ai-stats"],
    queryFn: async () => {
      const { data: processes, error: processError } = await supabase
        .from("system_processes")
        .select("id");
      if (processError) throw processError;

      const { data: processAI, error: aiError } = await supabase
        .from("process_ai_usage")
        .select("has_ai, risk_category, compliance_status");
      if (aiError) throw aiError;

      const totalProcesses = processes?.length || 0;
      const processesWithAI = processAI?.filter((p) => p.has_ai).length || 0;

      const riskDistribution = {
        minimal: 0,
        limited: 0,
        high: 0,
        unacceptable: 0,
      };

      processAI?.forEach((p) => {
        if (p.has_ai && p.risk_category) {
          riskDistribution[p.risk_category as keyof typeof riskDistribution]++;
        }
      });

      const pendingAssessment =
        processAI?.filter(
          (p) => p.has_ai && (!p.compliance_status || p.compliance_status === "not_assessed")
        ).length || 0;

      return {
        totalProcesses,
        processesWithAI,
        riskDistribution,
        pendingAssessment,
      };
    },
  });

  const totalWithAI = (assetStats?.assetsWithAI || 0) + (processStats?.processesWithAI || 0);
  const totalPending = (assetStats?.pendingAssessment || 0) + (processStats?.pendingAssessment || 0);

  const combinedRisk = {
    minimal:
      (assetStats?.riskDistribution.minimal || 0) +
      (processStats?.riskDistribution.minimal || 0),
    limited:
      (assetStats?.riskDistribution.limited || 0) +
      (processStats?.riskDistribution.limited || 0),
    high:
      (assetStats?.riskDistribution.high || 0) + (processStats?.riskDistribution.high || 0),
    unacceptable:
      (assetStats?.riskDistribution.unacceptable || 0) +
      (processStats?.riskDistribution.unacceptable || 0),
  };

  const totalRiskItems = Object.values(combinedRisk).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {t("aiOverview.title", "AI-bruk oversikt")}
        </CardTitle>
        <Button variant="ghost" size="sm">
          {t("common.viewAll", "Se alle")}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("aiOverview.systemsWithAI", "Systemer med AI")}
              </span>
            </div>
            <p className="text-2xl font-bold">
              {assetStats?.assetsWithAI || 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {assetStats?.totalAssets || 0}
              </span>
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Workflow className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("aiOverview.processesWithAI", "Prosesser med AI")}
              </span>
            </div>
            <p className="text-2xl font-bold">
              {processStats?.processesWithAI || 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {processStats?.totalProcesses || 0}
              </span>
            </p>
          </div>
        </div>

        {/* Risk distribution */}
        {totalRiskItems > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t("aiOverview.riskDistribution", "Risikofordeling")}
            </p>
            <div className="space-y-1.5">
              {[
                {
                  key: "minimal",
                  label: t("aiOverview.minimal", "Minimal"),
                  color: "bg-green-500",
                },
                {
                  key: "limited",
                  label: t("aiOverview.limited", "Begrenset"),
                  color: "bg-yellow-500",
                },
                { key: "high", label: t("aiOverview.high", "Høy"), color: "bg-orange-500" },
                {
                  key: "unacceptable",
                  label: t("aiOverview.unacceptable", "Uakseptabel"),
                  color: "bg-red-500",
                },
              ].map(({ key, label, color }) => {
                const count = combinedRisk[key as keyof typeof combinedRisk];
                const percentage = totalRiskItems > 0 ? (count / totalRiskItems) * 100 : 0;
                if (count === 0) return null;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-20 text-xs text-muted-foreground">{label}</div>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-2" />
                    </div>
                    <div className="w-8 text-xs text-right">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Warnings */}
        {totalPending > 0 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              {t("aiOverview.pendingAssessments", "{{count}} venter på vurdering", {
                count: totalPending,
              })}
            </span>
          </div>
        )}

        {/* High risk warning */}
        {(combinedRisk.high > 0 || combinedRisk.unacceptable > 0) && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800 dark:text-red-200">
              {t("aiOverview.highRiskWarning", "{{count}} høy-risiko AI krever ekstra dokumentasjon", {
                count: combinedRisk.high + combinedRisk.unacceptable,
              })}
            </span>
          </div>
        )}

        {/* Empty state */}
        {totalWithAI === 0 && (
          <div className="text-center py-4">
            <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("aiOverview.noAIRegistered", "Ingen AI-bruk registrert ennå")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
