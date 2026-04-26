import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useCalendarActivityStatus, type ActivityStatus } from "@/hooks/useCalendarActivityStatus";

type Frequency = "annual" | "biannual" | "quarterly" | "ongoing";

interface QuarterActivity {
  label_no: string;
  label_en: string;
  route: string;
  frequency: Frequency;
  isoRef?: string;
  statusKey: string;
}

const FREQ_CONFIG: Record<Frequency, { label_no: string; label_en: string; color: string }> = {
  annual: { label_no: "Årlig", label_en: "Annual", color: "bg-primary/10 text-primary dark:text-primary border-primary/20" },
  biannual: { label_no: "Halvårlig", label_en: "Biannual", color: "bg-accent/10 text-accent dark:text-accent border-accent/20" },
  quarterly: { label_no: "Kvartalsvis", label_en: "Quarterly", color: "bg-warning/10 text-warning dark:text-warning border-warning/20" },
  ongoing: { label_no: "Løpende", label_en: "Ongoing", color: "bg-status-closed/10 text-status-closed dark:text-status-closed border-status-closed/20" },
};

const QUARTERS: { key: string; label_no: string; label_en: string; phase_no: string; phase_en: string; activities: QuarterActivity[] }[] = [
  {
    key: "q1",
    label_no: "Q1 (Jan–Mar)",
    label_en: "Q1 (Jan–Mar)",
    phase_no: "Planlegging",
    phase_en: "Planning",
    activities: [
      { label_no: "Gap-analyse per domene", label_en: "Gap analysis per domain", route: "/compliance-checklist", frequency: "annual", isoRef: "ISO 27001 4.1–4.3", statusKey: "q1_gap_analysis" },
      { label_no: "Scope-definisjon", label_en: "Scope definition", route: "/regulations", frequency: "annual", isoRef: "ISO 27001 4.3", statusKey: "q1_scope_definition" },
      { label_no: "Rollefordeling", label_en: "Role assignment", route: "/company-settings", frequency: "annual", isoRef: "ISO 27001 5.3", statusKey: "q1_role_assignment" },
      { label_no: "Gjennomgang av behandlingsprotokoll", label_en: "Review of processing records", route: "/processing-records", frequency: "annual", isoRef: "GDPR Art. 30", statusKey: "q1_processing_records" },
    ],
  },
  {
    key: "q2",
    label_no: "Q2 (Apr–Jun)",
    label_en: "Q2 (Apr–Jun)",
    phase_no: "Implementering",
    phase_en: "Implementation",
    activities: [
      { label_no: "Risikovurdering", label_en: "Risk assessment", route: "/tasks?view=readiness", frequency: "biannual", isoRef: "ISO 27001 6.1.2", statusKey: "q2_risk_assessment" },
      { label_no: "Policy-utvikling", label_en: "Policy development", route: "/compliance-checklist", frequency: "annual", isoRef: "ISO 27001 5.2", statusKey: "q2_policy_development" },
      { label_no: "DPIA ved behov", label_en: "DPIA when required", route: "/compliance-checklist", frequency: "ongoing", isoRef: "GDPR Art. 35", statusKey: "q2_dpia" },
      { label_no: "Bevisstgjøringstesting", label_en: "Awareness testing (e.g. phishing)", route: "/mynder-me", frequency: "biannual", isoRef: "ISO 27001 7.2–7.3", statusKey: "q2_awareness" },
    ],
  },
  {
    key: "q3",
    label_no: "Q3 (Jul–Sep)",
    label_en: "Q3 (Jul–Sep)",
    phase_no: "Drift & overvåking",
    phase_en: "Operation & monitoring",
    activities: [
      { label_no: "Kontrollimplementering", label_en: "Control implementation", route: "/compliance-checklist", frequency: "ongoing", isoRef: "ISO 27001 Annex A", statusKey: "q3_controls" },
      { label_no: "Leverandørvurdering og kontroll", label_en: "Vendor assessment & control", route: "/assets", frequency: "biannual", isoRef: "GDPR Art. 28", statusKey: "q3_vendor_review" },
      { label_no: "Avvikshåndtering og oppfølging", label_en: "Deviation handling & follow-up", route: "/deviations", frequency: "ongoing", isoRef: "ISO 27001 10.1", statusKey: "q3_deviations" },
      { label_no: "Testing av beredskapsplan", label_en: "Incident response testing", route: "/deviations", frequency: "annual", isoRef: "ISO 27001 A.5.24", statusKey: "q3_incident_test" },
    ],
  },
  {
    key: "q4",
    label_no: "Q4 (Okt–Des)",
    label_en: "Q4 (Oct–Dec)",
    phase_no: "Revisjon & forbedring",
    phase_en: "Audit & improvement",
    activities: [
      { label_no: "Internrevisjon", label_en: "Internal audit", route: "/tasks?view=readiness", frequency: "annual", isoRef: "ISO 27001 9.2", statusKey: "q4_internal_audit" },
      { label_no: "Ledelsesgjennomgang", label_en: "Management review", route: "/reports", frequency: "annual", isoRef: "ISO 27001 9.3", statusKey: "q4_management_review" },
      { label_no: "Oppdatering og reforhandling av DPA", label_en: "DPA update & renegotiation", route: "/assets", frequency: "annual", isoRef: "GDPR Art. 28", statusKey: "q4_dpa_update" },
      { label_no: "Kontinuerlig forbedring", label_en: "Continuous improvement", route: "/tasks", frequency: "ongoing", isoRef: "ISO 27001 10.2", statusKey: "q4_improvement" },
    ],
  },
];

function ActivityIcon({ status }: { status: ActivityStatus }) {
  if (status === "completed") {
    return <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-status-closed" />;
  }
  if (status === "in_progress") {
    return <Circle className="h-3 w-3 flex-shrink-0 text-warning opacity-70" />;
  }
  return <CheckCircle2 className="h-3 w-3 flex-shrink-0 opacity-30" />;
}

export function ComplianceCalendarSection() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";
  const currentQuarter = Math.floor(new Date().getMonth() / 3);
  const { statuses } = useCalendarActivityStatus();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        <CalendarDays className="h-4 w-4" />
        {isNorwegian ? "Årshjul for compliance (PECB)" : "Annual compliance cycle (PECB)"}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {QUARTERS.map((q, qi) => {
          const completedCount = q.activities.filter(
            (a) => statuses[a.statusKey] === "completed"
          ).length;

          return (
            <div
              key={q.key}
              className={cn(
                "rounded-xl border p-4 space-y-3 transition-all",
                qi === currentQuarter
                  ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20"
                  : "border-border bg-card/50"
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {isNorwegian ? q.label_no : q.label_en}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {completedCount > 0 && (
                      <span className="text-[13px] font-semibold text-status-closed dark:text-status-closed">
                        {completedCount}/{q.activities.length}
                      </span>
                    )}
                    {qi === currentQuarter && (
                      <Badge className="text-[13px] font-semibold bg-primary/20 text-primary border-primary/30 px-1.5 py-0.5">
                        {isNorwegian ? "Nå" : "Now"}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-[13px] text-muted-foreground font-medium">
                  {isNorwegian ? q.phase_no : q.phase_en}
                </p>
              </div>

              <ul className="space-y-2">
                {q.activities.map((a, ai) => {
                  const freq = FREQ_CONFIG[a.frequency];
                  const status = statuses[a.statusKey] || "not_started";
                  return (
                    <li key={ai}>
                      <button
                        onClick={() => navigate(a.route)}
                        className="text-left w-full group space-y-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <ActivityIcon status={status} />
                          <span className={cn(
                            "text-xs transition-colors leading-tight",
                            status === "completed"
                              ? "text-status-closed dark:text-status-closed"
                              : "text-muted-foreground group-hover:text-primary"
                          )}>
                            {isNorwegian ? a.label_no : a.label_en}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-[18px]">
                          <Badge variant="outline" className={cn("text-[13px] px-1 py-0 h-4 border", freq.color)}>
                            {isNorwegian ? freq.label_no : freq.label_en}
                          </Badge>
                          {a.isoRef && (
                            <span className="text-[13px] text-muted-foreground/60">{a.isoRef}</span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
