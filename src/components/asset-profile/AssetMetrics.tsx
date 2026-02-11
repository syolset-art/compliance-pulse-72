import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Calendar, ListTodo, Shield } from "lucide-react";

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
      case "high": return { color: "text-destructive", bg: "bg-destructive/10", label: t("trustProfile.riskHigh") };
      case "medium": return { color: "text-warning", bg: "bg-warning/10", label: t("trustProfile.riskMedium") };
      case "low": return { color: "text-success", bg: "bg-success/10", label: t("trustProfile.riskLow") };
      default: return { color: "text-muted-foreground", bg: "bg-muted", label: t("trustProfile.notSet") };
    }
  };

  const getCriticalityBadge = (level: string | null) => {
    switch (level) {
      case "critical": return { color: "text-destructive", bg: "bg-destructive/10", label: t("assets.criticalityCritical") };
      case "high": return { color: "text-warning", bg: "bg-warning/10", label: t("assets.criticalityHigh") };
      case "medium": return { color: "text-primary", bg: "bg-primary/10", label: t("assets.criticalityMedium") };
      case "low": return { color: "text-success", bg: "bg-success/10", label: t("assets.criticalityLow") };
      default: return { color: "text-muted-foreground", bg: "bg-muted", label: t("trustProfile.notSet") };
    }
  };

  const risk = getRiskBadge(asset.risk_level);
  const criticality = getCriticalityBadge(asset.criticality);
  const complianceScore = asset.compliance_score || 0;
  const complianceColor = complianceScore >= 80 ? "text-success" : complianceScore >= 50 ? "text-warning" : "text-destructive";
  const formattedReviewDate = asset.next_review_date 
    ? new Date(asset.next_review_date).toLocaleDateString()
    : t("trustProfile.notSet");

  const metrics = [
    {
      icon: AlertTriangle,
      label: t("trustProfile.riskLevel"),
      value: risk.label,
      valueClass: risk.color,
      bgClass: risk.bg,
    },
    {
      icon: Shield,
      label: t("assets.criticality"),
      value: criticality.label,
      valueClass: criticality.color,
      bgClass: criticality.bg,
    },
    {
      icon: CheckCircle2,
      label: t("trustProfile.complianceScore"),
      value: `${complianceScore}%`,
      valueClass: complianceColor,
      bgClass: "",
    },
    {
      icon: Calendar,
      label: t("trustProfile.nextReview"),
      value: formattedReviewDate,
      valueClass: "text-foreground",
      bgClass: "",
    },
    {
      icon: ListTodo,
      label: t("trustProfile.tasks"),
      value: String(tasksCount),
      valueClass: "text-foreground",
      bgClass: "",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {metrics.map((m) => (
        <Card key={m.label} className="p-3.5">
          <div className="flex items-center gap-1.5 mb-2">
            <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{m.label}</span>
          </div>
          {m.bgClass ? (
            <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${m.valueClass} ${m.bgClass}`}>
              {m.value}
            </span>
          ) : (
            <p className={`text-xl font-bold ${m.valueClass}`}>{m.value}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
