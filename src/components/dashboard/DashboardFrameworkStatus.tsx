import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { getFrameworkById } from "@/lib/frameworkDefinitions";
import { cn } from "@/lib/utils";

function statusChip(score: number, isNb: boolean) {
  if (score >= 75)
    return {
      label: isNb ? "Grønn" : "Green",
      className: "bg-success/15 text-success",
    };
  if (score >= 50)
    return {
      label: isNb ? "Gul" : "Yellow",
      className: "bg-warning/15 text-warning",
    };
  return {
    label: isNb ? "Rød" : "Red",
    className: "bg-destructive/15 text-destructive",
  };
}

function scoreColor(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

export function DashboardFrameworkStatus() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const { stats } = useComplianceRequirements();

  const frameworks = useMemo(() => {
    const byFramework = stats.byFramework || {};
    return Object.entries(byFramework)
      .filter(([, v]: any) => v.total > 0)
      .map(([id, data]: any) => ({
        id,
        name: getFrameworkById(id)?.name || id,
        score: Math.round(data.score),
      }))
      .sort((a, b) => b.score - a.score);
  }, [stats.byFramework]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground">
        {isNb ? "Rammeverks-status" : "Framework status"}
      </h3>
      <p className="text-sm text-muted-foreground mt-0.5 mb-4">
        {isNb
          ? "Modenhetsscore per regelverk basert på dokumenterte kontroller"
          : "Maturity score per framework based on documented controls"}
      </p>

      <div className="space-y-4">
        {frameworks.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            {isNb ? "Ingen aktive rammeverk." : "No active frameworks."}
          </p>
        )}
        {frameworks.map((fw) => {
          const chip = statusChip(fw.score, isNb);
          return (
            <div key={fw.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground truncate">
                  {fw.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("text-sm font-bold tabular-nums", scoreColor(fw.score))}>
                    {fw.score}%
                  </span>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", chip.className)}>
                    {chip.label}
                  </span>
                </div>
              </div>
              <Progress value={fw.score} className="h-2 [&>div]:bg-primary" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
