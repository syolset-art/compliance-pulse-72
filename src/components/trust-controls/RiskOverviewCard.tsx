import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TriangleAlert, AlertTriangle, ShieldCheck } from "lucide-react";
import { type RiskSeverity } from "@/lib/trustControlDefinitions";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import { Progress } from "@/components/ui/progress";

const SEVERITY_CONFIG: Record<RiskSeverity, { color: string; bg: string; border: string; labelEn: string; labelNb: string }> = {
  high: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", labelEn: "High", labelNb: "Høy" },
  medium: { color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", labelEn: "Medium", labelNb: "Middels" },
  low: { color: "text-muted-foreground", bg: "bg-muted/50", border: "border-muted", labelEn: "Low", labelNb: "Lav" },
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
  const totalRisks = risks.length;

  // Calculate overall risk score (0-100, higher = more risk)
  const riskScore = totalRisks > 0
    ? Math.round(((highRisks * 3 + mediumRisks * 2 + lowRisks) / (totalRisks * 3)) * 100)
    : 0;

  const getRiskLevel = (score: number) => {
    if (score >= 60) return { label: isNb ? "Høy" : "High", color: "text-destructive" };
    if (score >= 30) return { label: isNb ? "Middels" : "Medium", color: "text-warning" };
    return { label: isNb ? "Lav" : "Low", color: "text-green-600 dark:text-green-400" };
  };

  const level = getRiskLevel(riskScore);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Left: Risk score gauge */}
        <div className="flex items-center gap-5 p-5 lg:border-r border-border lg:min-w-[220px]">
          <div className="relative h-20 w-20 shrink-0">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
              <path
                className="stroke-muted"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={riskScore >= 60 ? "stroke-destructive" : riskScore >= 30 ? "stroke-warning" : "stroke-green-500"}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${riskScore}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-lg font-bold ${level.color}`}>{riskScore}</span>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{isNb ? "Risikooversikt" : "Risk Overview"}</h2>
            <span className={`text-xs font-medium ${level.color}`}>{level.label} {isNb ? "risiko" : "risk"}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">{totalRisks} {isNb ? "identifiserte risikoer" : "identified risks"}</p>
          </div>
        </div>

        {/* Center: Severity counters */}
        <div className="flex items-stretch border-t lg:border-t-0 flex-1">
          <div className="flex-1 flex flex-col items-center justify-center gap-1 p-4 border-r border-border bg-destructive/5">
            <TriangleAlert className="h-4 w-4 text-destructive" aria-hidden="true" />
            <span className="text-2xl font-bold text-destructive">{highRisks}</span>
            <span className="text-[10px] font-medium text-destructive uppercase tracking-wider">{isNb ? "Høy" : "High"}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-1 p-4 border-r border-border bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
            <span className="text-2xl font-bold text-warning">{mediumRisks}</span>
            <span className="text-[10px] font-medium text-warning uppercase tracking-wider">{isNb ? "Middels" : "Medium"}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-1 p-4 border-r border-border bg-muted/30">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-2xl font-bold text-muted-foreground">{lowRisks}</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{isNb ? "Lav" : "Low"}</span>
          </div>

          {/* Right: Top risks list */}
          <div className="flex-[2] p-4 min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {isNb ? "Viktigste risikoer" : "Top risks"}
            </p>
            {risks.length > 0 ? (
              <div className="space-y-1.5">
                {risks.slice(0, 3).map((r) => {
                  const sev = SEVERITY_CONFIG[r.severity];
                  return (
                    <div key={r.id} className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 ${sev.bg} border ${sev.border}`}>
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
            ) : (
              <p className="text-xs text-muted-foreground">{isNb ? "Ingen risikoer identifisert" : "No risks identified"}</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
