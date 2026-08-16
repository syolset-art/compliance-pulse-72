import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { getFrameworkById } from "@/lib/frameworkDefinitions";
import { cn } from "@/lib/utils";
import { getMaturityLevel, maturitySoftClass, maturityProgressClass } from "@/lib/maturityLevel";

function statusChip(score: number, isNb: boolean) {
  const level = getMaturityLevel(score);
  const labels = {
    high: isNb ? "Høy" : "High",
    medium: isNb ? "Middels" : "Medium",
    low: isNb ? "Lav" : "Low",
  } as const;
  return { label: labels[level], className: maturitySoftClass(score) };
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
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-foreground">
        {isNb ? "Rammeverks-status" : "Framework status"}
      </h3>
      <p className="text-sm text-muted-foreground mt-0.5 mb-4">
        {isNb
          ? "Modenhet per regelverk basert på dokumenterte kontroller"
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
                  <span className={cn("text-sm font-medium px-2 py-0.5 rounded-full border", chip.className)}>
                    {chip.label}
                  </span>
                </div>
              </div>
              <Progress value={fw.score} className={cn("h-2", maturityProgressClass(fw.score))} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
