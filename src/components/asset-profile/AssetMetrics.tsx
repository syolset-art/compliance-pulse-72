import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Calendar, ListTodo, Shield, Send } from "lucide-react";
import { RequestUpdateDialog } from "./RequestUpdateDialog";

interface AssetMetricsProps {
  asset: {
    id: string;
    name: string;
    vendor?: string | null;
    risk_level: string | null;
    compliance_score: number | null;
    next_review_date: string | null;
    criticality: string | null;
  };
  tasksCount: number;
}

export function AssetMetrics({ asset, tasksCount }: AssetMetricsProps) {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  // Query expired documents count
  const { data: expiredCount = 0 } = useQuery({
    queryKey: ["expired-docs-count", asset.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("id, valid_to")
        .eq("asset_id", asset.id)
        .not("valid_to", "is", null);
      if (error) throw error;
      const now = new Date();
      return (data || []).filter((d: any) => new Date(d.valid_to) < now).length;
    },
  });

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
    <div className="space-y-3">
      {expiredCount > 0 && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              {isNb
                ? `${expiredCount} dokument${expiredCount > 1 ? "er" : ""} er utløpt`
                : `${expiredCount} document${expiredCount > 1 ? "s" : ""} expired`}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => setRequestDialogOpen(true)}
          >
            <Send className="h-3 w-3" />
            {isNb ? "Be om oppdatering" : "Request update"}
          </Button>
        </div>
      )}

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

      <RequestUpdateDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        assetId={asset.id}
        assetName={asset.name}
        vendorName={asset.vendor || undefined}
      />
    </div>
  );
}
