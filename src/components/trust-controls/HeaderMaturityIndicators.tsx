import { useTranslation } from "react-i18next";
import { AlertTriangle, TrendingUp, ClipboardCheck, ListTodo } from "lucide-react";

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
        return { label: isNb ? "Høy risiko" : "High risk", color: "text-destructive", iconColor: "text-destructive" };
      case "medium":
        return { label: isNb ? "Moderat risiko" : "Moderate risk", color: "text-warning", iconColor: "text-warning" };
      case "low":
        return { label: isNb ? "Lav risiko" : "Low risk", color: "text-success", iconColor: "text-success" };
      default:
        return { label: isNb ? "Ikke vurdert" : "Not assessed", color: "text-muted-foreground", iconColor: "text-muted-foreground" };
    }
  };

  const risk = getRiskDisplay(riskLevel);
  const matColor = maturityPercent >= 70 ? "text-success" : maturityPercent >= 40 ? "text-warning" : "text-destructive";

  // Demo data for internal risk assessment and tasks
  const lastAssessmentDate = "23.03.2026";
  const openTasks = 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
      {/* Risk Level */}
      <div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isNb ? "Risikonivå" : "Risk Level"}
          </p>
          <AlertTriangle className={`h-4 w-4 ${risk.iconColor}`} />
        </div>
        <p className={`text-sm font-bold ${risk.color}`}>{risk.label}</p>
      </div>

      {/* Maturity */}
      <div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isNb ? "Modenhet" : "Maturity"}
          </p>
          <TrendingUp className={`h-4 w-4 ${matColor}`} />
        </div>
        <div className="flex items-end gap-1.5">
          <span className={`text-2xl font-extrabold tabular-nums leading-none ${matColor}`}>{maturityPercent}</span>
          <span className="text-xs text-muted-foreground font-medium mb-0.5">%</span>
        </div>
      </div>

      {/* Internal Risk Assessment */}
      <div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isNb ? "Intern risikovurd." : "Risk Assessment"}
          </p>
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-sm font-bold text-foreground">{lastAssessmentDate}</p>
      </div>

      {/* Tasks */}
      <div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isNb ? "Oppgaver" : "Tasks"}
          </p>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-end gap-1.5">
          <span className={`text-2xl font-extrabold tabular-nums leading-none ${openTasks > 0 ? "text-warning" : "text-success"}`}>{openTasks}</span>
          <span className="text-xs text-muted-foreground font-medium mb-0.5">{isNb ? "åpne" : "open"}</span>
        </div>
      </div>
    </div>
  );
}
