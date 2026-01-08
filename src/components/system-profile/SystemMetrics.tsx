import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Calendar, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface SystemMetricsProps {
  system: {
    risk_level?: string | null;
    compliance_score?: number | null;
    next_review_date?: string | null;
  };
  tasksCount: number;
}

export const SystemMetrics = ({ system, tasksCount }: SystemMetricsProps) => {
  const { t, i18n } = useTranslation();

  const getRiskLevel = (level?: string | null) => {
    switch (level?.toLowerCase()) {
      case "high":
      case "høy":
        return { label: t("trustProfile.riskHigh"), color: "text-destructive", bg: "bg-destructive/10" };
      case "medium":
      case "middels":
        return { label: t("trustProfile.riskMedium"), color: "text-yellow-600", bg: "bg-yellow-500/10" };
      case "low":
      case "lav":
      default:
        return { label: t("trustProfile.riskLow"), color: "text-green-600", bg: "bg-green-500/10" };
    }
  };

  const riskInfo = getRiskLevel(system.risk_level);
  const complianceScore = system.compliance_score ?? 0;

  const getComplianceColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-destructive";
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return t("trustProfile.notSet");
    try {
      return format(new Date(dateStr), "dd.MM.yyyy", { locale: i18n.language === "nb" ? nb : undefined });
    } catch {
      return t("trustProfile.notSet");
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Risk Level */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${riskInfo.bg} flex items-center justify-center`}>
              <AlertTriangle className={`h-5 w-5 ${riskInfo.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("trustProfile.riskLevel")}</p>
              <p className={`text-lg font-semibold ${riskInfo.color}`}>{riskInfo.label}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Score */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle className={`h-5 w-5 ${getComplianceColor(complianceScore)}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("trustProfile.complianceScore")}</p>
              <p className={`text-lg font-semibold ${getComplianceColor(complianceScore)}`}>
                {complianceScore}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Review Date */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("trustProfile.nextReview")}</p>
              <p className="text-lg font-semibold">{formatDate(system.next_review_date)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Count */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("trustProfile.tasks")}</p>
              <p className="text-lg font-semibold">{tasksCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
