import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface RiskManagementTabProps {
  systemId: string;
}

export const RiskManagementTab = ({ systemId }: RiskManagementTabProps) => {
  const { t, i18n } = useTranslation();

  const { data: riskAssessments } = useQuery({
    queryKey: ["system-risk-assessments", systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_risk_assessments")
        .select("*")
        .eq("system_id", systemId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const latestAssessment = riskAssessments?.[0];

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return t("trustProfile.notSet");
    try {
      return format(new Date(dateStr), "dd.MM.yyyy", { locale: i18n.language === "nb" ? nb : undefined });
    } catch {
      return t("trustProfile.notSet");
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return "text-destructive";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getRiskScoreLabel = (score: number) => {
    if (score >= 70) return t("trustProfile.riskHigh");
    if (score >= 40) return t("trustProfile.riskMedium");
    return t("trustProfile.riskLow");
  };

  // Parse risk distribution from JSON
  const riskDistribution = latestAssessment?.risk_distribution as Record<string, number> | undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Risk Score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t("trustProfile.overallRisk")}
            </CardTitle>
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
                    className={latestAssessment?.risk_score && latestAssessment.risk_score >= 70 ? "stroke-destructive" : 
                      latestAssessment?.risk_score && latestAssessment.risk_score >= 40 ? "stroke-yellow-500" : "stroke-green-500"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${latestAssessment?.risk_score || 0}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${getRiskScoreColor(latestAssessment?.risk_score || 0)}`}>
                    {latestAssessment?.risk_score || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getRiskScoreLabel(latestAssessment?.risk_score || 0)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Review */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("trustProfile.nextReview")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-2xl font-bold">{formatDate(latestAssessment?.next_review)}</p>
              <Badge variant="outline" className="mt-2">
                {latestAssessment?.status || t("trustProfile.pending")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("trustProfile.assessmentNotes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {latestAssessment?.notes || t("trustProfile.noNotes")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("trustProfile.riskDistribution")}</CardTitle>
        </CardHeader>
        <CardContent>
          {riskDistribution && Object.keys(riskDistribution).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(riskDistribution).map(([area, score]) => (
                <div key={area} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{area}</span>
                    <span className={`text-sm ${getRiskScoreColor(score)}`}>{score}%</span>
                  </div>
                  <Progress 
                    value={score} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("trustProfile.noRiskDistribution")}</p>
          )}
        </CardContent>
      </Card>

      {/* Assessment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("trustProfile.assessmentHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {riskAssessments && riskAssessments.length > 0 ? (
            <div className="space-y-3">
              {riskAssessments.map((assessment) => (
                <div key={assessment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${
                      assessment.risk_score >= 70 ? "bg-destructive" : 
                      assessment.risk_score >= 40 ? "bg-yellow-500" : "bg-green-500"
                    }`} />
                    <span className="text-sm">{formatDate(assessment.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${getRiskScoreColor(assessment.risk_score)}`}>
                      {assessment.risk_score}
                    </span>
                    <Badge variant="outline">{assessment.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("trustProfile.noAssessments")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
