import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AlertTriangle, CalendarDays, CheckCircle2 } from "lucide-react";
import type { RequirementWithStatus } from "@/hooks/useComplianceRequirements";

interface RiskAndCalendarSectionProps {
  requirements: RequirementWithStatus[];
}

const QUARTERS = [
  {
    key: "q1", label_no: "Q1", label_en: "Q1",
    activities_no: ["Gap-analyse", "Scope-definisjon", "Rollefordeling"],
    activities_en: ["Gap analysis", "Scope definition", "Role assignment"],
  },
  {
    key: "q2", label_no: "Q2", label_en: "Q2",
    activities_no: ["Risikovurdering", "Policy-utvikling", "DPA-avtaler"],
    activities_en: ["Risk assessment", "Policy development", "DPA agreements"],
  },
  {
    key: "q3", label_no: "Q3", label_en: "Q3",
    activities_no: ["Kontroller", "Opplæring", "Overvåking"],
    activities_en: ["Controls", "Training", "Monitoring"],
  },
  {
    key: "q4", label_no: "Q4", label_en: "Q4",
    activities_no: ["Internrevisjon", "Ledelsesgjennomgang", "Forbedring"],
    activities_en: ["Internal audit", "Management review", "Improvement"],
  },
];

export function RiskAndCalendarSection({ requirements }: RiskAndCalendarSectionProps) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";
  const currentQuarter = Math.floor(new Date().getMonth() / 3);

  // Risk counts by priority (incomplete only)
  const incomplete = requirements.filter(r => r.status !== "completed" && r.status !== "not_applicable");
  const riskCounts = {
    critical: incomplete.filter(r => r.priority === "critical").length,
    high: incomplete.filter(r => r.priority === "high").length,
    medium: incomplete.filter(r => r.priority === "medium").length,
    low: incomplete.filter(r => r.priority === "low").length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Risk radar */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <AlertTriangle className="h-4 w-4" />
          {isNorwegian ? "Risikobilde" : "Risk overview"}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "critical", label_no: "Kritisk", label_en: "Critical", color: "bg-destructive/10 text-destructive border-destructive/20" },
            { key: "high", label_no: "Høy", label_en: "High", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
            { key: "medium", label_no: "Middels", label_en: "Medium", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
            { key: "low", label_no: "Lav", label_en: "Low", color: "bg-muted text-muted-foreground border-border" },
          ].map((level) => (
            <div
              key={level.key}
              className={cn("rounded-xl border p-3 text-center", level.color)}
            >
              <div className="text-2xl font-bold">{riskCounts[level.key as keyof typeof riskCounts]}</div>
              <div className="text-xs font-medium mt-0.5">{isNorwegian ? level.label_no : level.label_en}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Annual calendar */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <CalendarDays className="h-4 w-4" />
          {isNorwegian ? "Årshjul" : "Annual cycle"}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {QUARTERS.map((q, qi) => (
            <div
              key={q.key}
              className={cn(
                "rounded-lg border p-3 space-y-1.5",
                qi === currentQuarter
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card/50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase">{q.key.toUpperCase()}</span>
                {qi === currentQuarter && (
                  <span className="text-[9px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    {isNorwegian ? "Nå" : "Now"}
                  </span>
                )}
              </div>
              <ul className="space-y-0.5">
                {(isNorwegian ? q.activities_no : q.activities_en).map((a, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5 flex-shrink-0 opacity-30" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
