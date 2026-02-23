import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { AlertTriangle, CalendarDays, CheckCircle2, Circle } from "lucide-react";
import type { RequirementWithStatus } from "@/hooks/useComplianceRequirements";
import { useCalendarActivityStatus, type ActivityStatus } from "@/hooks/useCalendarActivityStatus";

interface RiskAndCalendarSectionProps {
  requirements: RequirementWithStatus[];
}

const QUARTERS = [
  {
    key: "q1", label_no: "Q1", label_en: "Q1",
    activities: [
      { label_no: "Gap-analyse", label_en: "Gap analysis", statusKey: "q1_gap_analysis" },
      { label_no: "Scope-definisjon", label_en: "Scope definition", statusKey: "q1_scope_definition" },
      { label_no: "Rollefordeling", label_en: "Role assignment", statusKey: "q1_role_assignment" },
      { label_no: "Behandlingsprotokoll", label_en: "Processing records", statusKey: "q1_processing_records" },
    ],
  },
  {
    key: "q2", label_no: "Q2", label_en: "Q2",
    activities: [
      { label_no: "Risikovurdering", label_en: "Risk assessment", statusKey: "q2_risk_assessment" },
      { label_no: "Policy-utvikling", label_en: "Policy development", statusKey: "q2_policy_development" },
      { label_no: "DPIA ved behov", label_en: "DPIA when required", statusKey: "q2_dpia" },
      { label_no: "Bevisstgjøringstesting", label_en: "Awareness testing", statusKey: "q2_awareness" },
    ],
  },
  {
    key: "q3", label_no: "Q3", label_en: "Q3",
    activities: [
      { label_no: "Kontroller", label_en: "Controls", statusKey: "q3_controls" },
      { label_no: "Leverandørvurdering og kontroll", label_en: "Vendor assessment & control", statusKey: "q3_vendor_review" },
      { label_no: "Avvikshåndtering", label_en: "Deviation handling", statusKey: "q3_deviations" },
      { label_no: "Beredskapstest", label_en: "Incident response test", statusKey: "q3_incident_test" },
    ],
  },
  {
    key: "q4", label_no: "Q4", label_en: "Q4",
    activities: [
      { label_no: "Internrevisjon", label_en: "Internal audit", statusKey: "q4_internal_audit" },
      { label_no: "Ledelsesgjennomgang", label_en: "Management review", statusKey: "q4_management_review" },
      { label_no: "Oppdatering og reforhandling av DPA", label_en: "DPA update & renegotiation", statusKey: "q4_dpa_update" },
      { label_no: "Forbedring", label_en: "Improvement", statusKey: "q4_improvement" },
    ],
  },
];

function SmallActivityIcon({ status }: { status: ActivityStatus }) {
  if (status === "completed") {
    return <CheckCircle2 className="h-2.5 w-2.5 flex-shrink-0 text-emerald-500" />;
  }
  if (status === "in_progress") {
    return <Circle className="h-2.5 w-2.5 flex-shrink-0 text-amber-500 opacity-70" />;
  }
  return <CheckCircle2 className="h-2.5 w-2.5 flex-shrink-0 opacity-30" />;
}

export function RiskAndCalendarSection({ requirements }: RiskAndCalendarSectionProps) {
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";
  const currentQuarter = Math.floor(new Date().getMonth() / 3);
  const { statuses } = useCalendarActivityStatus();

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
          {QUARTERS.map((q, qi) => {
            const completedCount = q.activities.filter(
              (a) => statuses[a.statusKey] === "completed"
            ).length;

            return (
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
                  <div className="flex items-center gap-1.5">
                    {completedCount > 0 && (
                      <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {completedCount}/{q.activities.length}
                      </span>
                    )}
                    {qi === currentQuarter && (
                      <span className="text-[9px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                        {isNorwegian ? "Nå" : "Now"}
                      </span>
                    )}
                  </div>
                </div>
                <ul className="space-y-0.5">
                  {q.activities.map((a, i) => {
                    const status = statuses[a.statusKey] || "not_started";
                    return (
                      <li key={i} className={cn(
                        "text-[11px] flex items-center gap-1",
                        status === "completed"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      )}>
                        <SmallActivityIcon status={status} />
                        {isNorwegian ? a.label_no : a.label_en}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
