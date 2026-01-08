import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Clock, Bot } from "lucide-react";

interface ValidationTabProps {
  systemId: string;
}

export const ValidationTab = ({ systemId }: ValidationTabProps) => {
  const { t } = useTranslation();

  const { data: compliance } = useQuery({
    queryKey: ["system-compliance", systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_compliance")
        .select("*")
        .eq("system_id", systemId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ["system-tasks", systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .contains("relevant_for", [systemId])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const standards = ["GDPR", "NIS2", "CRA", "AIAACT"];
  const complianceMap = compliance?.reduce((acc, item) => {
    acc[item.standard] = item;
    return acc;
  }, {} as Record<string, typeof compliance[0]>) || {};

  const totalScore = compliance?.length 
    ? Math.round(compliance.reduce((sum, item) => sum + (item.score || 0), 0) / compliance.length)
    : 0;

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column - Tasks and overall compliance */}
      <div className="lg:col-span-2 space-y-6">
        {/* System Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("trustProfile.systemTasks")}</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks && tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
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
            ) : (
              <p className="text-muted-foreground text-sm">{t("trustProfile.noTasks")}</p>
            )}
          </CardContent>
        </Card>

        {/* Compliance per standard */}
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

      {/* Right column - Total compliance and AI insights */}
      <div className="space-y-6">
        {/* Total Compliance */}
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
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
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
