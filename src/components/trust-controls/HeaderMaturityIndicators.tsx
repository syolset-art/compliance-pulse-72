import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ShieldAlert, Activity } from "lucide-react";

interface HeaderMaturityIndicatorsProps {
  riskLevel?: string | null;
  criticality?: string | null;
  maturityPercent: number;
}

export function HeaderMaturityIndicators({ riskLevel, criticality, maturityPercent }: HeaderMaturityIndicatorsProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const getRiskDisplay = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case "high":
      case "critical":
        return { label: isNb ? "Høy" : "High", color: "text-destructive", bgColor: "bg-destructive/10 border-destructive/30 text-destructive" };
      case "medium":
        return { label: isNb ? "Middels" : "Medium", color: "text-warning", bgColor: "bg-warning/10 border-warning/30 text-warning" };
      case "low":
        return { label: isNb ? "Lav" : "Low", color: "text-success", bgColor: "bg-success/10 border-success/30 text-success" };
      default:
        return { label: isNb ? "Ikke vurdert" : "Not assessed", color: "text-muted-foreground", bgColor: "bg-muted border-border text-muted-foreground" };
    }
  };

  const getCriticalityDisplay = (crit: string | null) => {
    switch (crit?.toLowerCase()) {
      case "critical":
        return { label: isNb ? "Kritisk" : "Critical", color: "bg-destructive/10 border-destructive/30 text-destructive" };
      case "high":
        return { label: isNb ? "Høy" : "High", color: "bg-warning/10 border-warning/30 text-warning" };
      case "medium":
        return { label: isNb ? "Middels" : "Medium", color: "bg-primary/10 border-primary/30 text-primary" };
      case "low":
        return { label: isNb ? "Lav" : "Low", color: "bg-success/10 border-success/30 text-success" };
      default:
        return { label: isNb ? "Ikke satt" : "Not set", color: "bg-muted border-border text-muted-foreground" };
    }
  };

  const risk = getRiskDisplay(riskLevel);
  const crit = getCriticalityDisplay(criticality);
  const matColor = maturityPercent >= 70 ? "text-success" : maturityPercent >= 40 ? "text-warning" : "text-destructive";

  return (
    <div className="hidden md:flex flex-col gap-3 shrink-0 pl-6 border-l border-border min-w-[180px]">
      {/* Risk */}
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
          <AlertTriangle className={`h-3.5 w-3.5 ${risk.color}`} />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            {isNb ? "Risiko" : "Risk"}
          </p>
          <Badge variant="outline" className={`text-[10px] h-5 px-2 ${risk.bgColor}`}>
            {risk.label}
          </Badge>
        </div>
      </div>

      {/* Criticality */}
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
          <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            {isNb ? "Kritikalitet" : "Criticality"}
          </p>
          <Badge variant="outline" className={`text-[10px] h-5 px-2 ${crit.color}`}>
            {crit.label}
          </Badge>
        </div>
      </div>

      {/* Maturity */}
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Activity className={`h-3.5 w-3.5 ${matColor}`} />
        </div>
        <div className="flex-1 min-w-[100px]">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            {isNb ? "Modenhet" : "Maturity"}
          </p>
          <div className="flex items-center gap-2">
            <Progress value={maturityPercent} className="h-1.5 flex-1" />
            <span className={`text-xs font-bold tabular-nums ${matColor}`}>{maturityPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
