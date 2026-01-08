import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Calendar, ListTodo } from "lucide-react";

interface AssetMetricsProps {
  asset: {
    risk_level: string | null;
    compliance_score: number | null;
    next_review_date: string | null;
    criticality: string | null;
  };
  tasksCount: number;
}

export function AssetMetrics({ asset, tasksCount }: AssetMetricsProps) {
  const { t } = useTranslation();

  const getRiskBadge = (level: string | null) => {
    switch (level) {
      case "high":
        return { color: "text-red-500 bg-red-500/10", label: t("trustProfile.riskHigh") };
      case "medium":
        return { color: "text-orange-500 bg-orange-500/10", label: t("trustProfile.riskMedium") };
      case "low":
        return { color: "text-green-500 bg-green-500/10", label: t("trustProfile.riskLow") };
      default:
        return { color: "text-muted-foreground bg-muted", label: t("trustProfile.notSet") };
    }
  };

  const getCriticalityBadge = (level: string | null) => {
    switch (level) {
      case "critical":
        return { color: "text-red-500 bg-red-500/10", label: t("assets.criticalityCritical") };
      case "high":
        return { color: "text-orange-500 bg-orange-500/10", label: t("assets.criticalityHigh") };
      case "medium":
        return { color: "text-yellow-500 bg-yellow-500/10", label: t("assets.criticalityMedium") };
      case "low":
        return { color: "text-green-500 bg-green-500/10", label: t("assets.criticalityLow") };
      default:
        return { color: "text-muted-foreground bg-muted", label: t("trustProfile.notSet") };
    }
  };

  const risk = getRiskBadge(asset.risk_level);
  const criticality = getCriticalityBadge(asset.criticality);
  const complianceScore = asset.compliance_score || 0;
  const formattedReviewDate = asset.next_review_date 
    ? new Date(asset.next_review_date).toLocaleDateString()
    : t("trustProfile.notSet");

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {/* Risk Level */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <AlertTriangle className="h-4 w-4" />
            {t("trustProfile.riskLevel")}
          </div>
          <div className={`inline-flex px-2 py-1 rounded text-sm font-medium ${risk.color}`}>
            {risk.label}
          </div>
        </CardContent>
      </Card>

      {/* Criticality */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <AlertTriangle className="h-4 w-4" />
            {t("assets.criticality")}
          </div>
          <div className={`inline-flex px-2 py-1 rounded text-sm font-medium ${criticality.color}`}>
            {criticality.label}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Score */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <CheckCircle2 className="h-4 w-4" />
            {t("trustProfile.complianceScore")}
          </div>
          <div className="text-2xl font-bold text-foreground">
            {complianceScore}%
          </div>
        </CardContent>
      </Card>

      {/* Next Review */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Calendar className="h-4 w-4" />
            {t("trustProfile.nextReview")}
          </div>
          <div className="text-sm font-medium text-foreground">
            {formattedReviewDate}
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <ListTodo className="h-4 w-4" />
            {t("trustProfile.tasks")}
          </div>
          <div className="text-2xl font-bold text-foreground">
            {tasksCount}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
