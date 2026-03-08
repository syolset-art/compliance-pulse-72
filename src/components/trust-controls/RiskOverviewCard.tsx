import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TriangleAlert, AlertTriangle } from "lucide-react";
import { type RiskSeverity } from "@/lib/trustControlDefinitions";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";

const SEVERITY_CONFIG: Record<RiskSeverity, { color: string; bg: string; labelEn: string; labelNb: string }> = {
  high: { color: "text-destructive", bg: "bg-destructive/10", labelEn: "High", labelNb: "Høy" },
  medium: { color: "text-warning", bg: "bg-warning/10", labelEn: "Medium", labelNb: "Middels" },
  low: { color: "text-muted-foreground", bg: "bg-muted/50", labelEn: "Low", labelNb: "Lav" },
};

interface RiskOverviewCardProps {
  assetId: string;
}

export function RiskOverviewCard({ assetId }: RiskOverviewCardProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const evaluation = useTrustControlEvaluation(assetId);

  if (!evaluation) return null;

  const { risks } = evaluation;
  const highRisks = risks.filter(r => r.severity === "high").length;
  const mediumRisks = risks.filter(r => r.severity === "medium").length;
  const lowRisks = risks.filter(r => r.severity === "low").length;

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold mb-3">{isNb ? "Risikooversikt" : "Risk Overview"}</h2>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-lg bg-destructive/10" role="group" aria-label={`${highRisks} high risks`}>
          <TriangleAlert className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
          <span className="text-xl font-bold text-destructive">{highRisks}</span>
          <span className="text-[9px] font-medium text-destructive uppercase">{isNb ? "Høy" : "High"}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-lg bg-warning/10" role="group" aria-label={`${mediumRisks} medium risks`}>
          <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
          <span className="text-xl font-bold text-warning">{mediumRisks}</span>
          <span className="text-[9px] font-medium text-warning uppercase">{isNb ? "Middels" : "Medium"}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-lg bg-muted/50" role="group" aria-label={`${lowRisks} low risks`}>
          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="text-xl font-bold text-muted-foreground">{lowRisks}</span>
          <span className="text-[9px] font-medium text-muted-foreground uppercase">{isNb ? "Lav" : "Low"}</span>
        </div>
      </div>

      {risks.length > 0 && (
        <div className="space-y-1">
          {risks.slice(0, 3).map((r) => {
            const sev = SEVERITY_CONFIG[r.severity];
            return (
              <div key={r.id} className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 ${sev.bg}`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <TriangleAlert className={`h-3 w-3 shrink-0 ${sev.color}`} aria-hidden="true" />
                  <span className={`text-xs truncate ${sev.color}`}>{isNb ? r.titleNb : r.titleEn}</span>
                </div>
                <Badge variant={r.severity === "high" ? "destructive" : r.severity === "medium" ? "warning" : "outline"} className="text-[9px] shrink-0 px-1.5 py-0">
                  {isNb ? sev.labelNb : sev.labelEn}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
