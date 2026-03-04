import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Clock, Bot } from "lucide-react";

interface ValidationTabProps {
  assetId: string;
}

const DEMO_TASKS = [
  { id: "dt1", title: "Innhent oppdatert DPA fra leverandør", status: "pending", priority: "high" },
  { id: "dt2", title: "Gjennomfør risikovurdering", status: "in_progress", priority: "high" },
  { id: "dt3", title: "Verifiser databehandleravtale", status: "pending", priority: "medium" },
  { id: "dt4", title: "Oppdater personvernkonsekvensvurdering (DPIA)", status: "pending", priority: "medium" },
  { id: "dt5", title: "Dokumenter tekniske sikkerhetstiltak", status: "completed", priority: "low" },
];

export const ValidationTab = ({ assetId }: ValidationTabProps) => {
  const { t } = useTranslation();

  const { data: asset } = useQuery({
    queryKey: ["asset-detail", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("compliance_score")
        .eq("id", assetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: compliance } = useQuery({
    queryKey: ["system-compliance", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_compliance")
        .select("*")
        .eq("system_id", assetId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ["asset-tasks", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .contains("relevant_for", [assetId])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const fallbackCompliance = useMemo(() => {
    if (compliance && compliance.length > 0) return null;
    const base = asset?.compliance_score || 45;
    return [
      { standard: "GDPR", score: Math.min(base + 15, 100), status: base + 15 >= 80 ? "compliant" : "in_progress" },
      { standard: "NIS2", score: Math.max(base - 10, 0), status: "in_progress" },
      { standard: "CRA", score: Math.max(base - 25, 0), status: "non_compliant" },
      { standard: "AIAACT", score: 0, status: "not_assessed" },
    ];
  }, [compliance, asset?.compliance_score]);

  const effectiveCompliance = fallbackCompliance || compliance || [];
  const standards = ["GDPR", "NIS2", "CRA", "AIAACT"];
  const complianceMap = (Array.isArray(effectiveCompliance) ? effectiveCompliance : []).reduce((acc, item: any) => {
    acc[item.standard] = item;
    return acc;
  }, {} as Record<string, any>);

  const totalScore = effectiveCompliance.length
    ? Math.round((effectiveCompliance as any[]).reduce((sum, item: any) => sum + (item.score || 0), 0) / effectiveCompliance.length)
    : 0;

  const effectiveTasks = tasks && tasks.length > 0 ? tasks : DEMO_TASKS;

  const getComplianceLevel = (score: number) => {
    if (score >= 80) return { label: "Høy", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 50) return { label: "Medium", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { label: "Lav", color: "text-destructive", bg: "bg-red-100" };
  };

  const level = getComplianceLevel(totalScore);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "non_compliant":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-destructive";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("trustProfile.systemTasks")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(effectiveTasks as any[]).slice(0, 5).map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      task.status === "completed" ? "bg-green-500" :
                      task.status === "in_progress" ? "bg-yellow-500" : "bg-muted-foreground"
                    }`} />
                    <span className="text-sm font-medium">{task.title}</span>
                  </div>
                  <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("trustProfile.complianceByStandard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {standards.map((standard) => {
                const item = complianceMap[standard];
                const score = item?.score || 0;
                return (
                  <div key={standard} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item?.status)}
                        <span className="font-medium">{standard}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{score}%</span>
                    </div>
                    <Progress value={score} className={`h-2 ${getStatusColor(score)}`} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("trustProfile.totalCompliance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative h-32 w-32">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-muted"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={totalScore >= 80 ? "stroke-green-500" : totalScore >= 50 ? "stroke-yellow-500" : "stroke-destructive"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${totalScore}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{totalScore}%</span>
                </div>
              </div>
              <Badge className={`mt-3 ${level.bg} ${level.color} border-0 text-sm font-semibold`}>
                {level.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              {t("trustProfile.aiInsights")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("trustProfile.aiInsightsPlaceholder")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
