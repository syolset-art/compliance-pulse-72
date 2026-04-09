import { AlertTriangle, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface CriticalTask {
  id: string;
  label: string;
  route: string;
  urgency: "high" | "medium";
}

const CRITICAL_TASKS_NB: CriticalTask[] = [
  {
    id: "1",
    label: "3 leverandører mangler databehandleravtale (DPA)",
    route: "/vendors",
    urgency: "high",
  },
  {
    id: "2",
    label: "Arbeidsområde «Regnskap» mangler ansvarlig person",
    route: "/work-areas",
    urgency: "high",
  },
  {
    id: "3",
    label: "NIS2 egenvurdering er ikke fullført",
    route: "/compliance/nis2",
    urgency: "medium",
  },
];

const CRITICAL_TASKS_EN: CriticalTask[] = [
  {
    id: "1",
    label: "3 vendors are missing a Data Processing Agreement (DPA)",
    route: "/vendors",
    urgency: "high",
  },
  {
    id: "2",
    label: "Work area \"Accounting\" is missing a responsible person",
    route: "/work-areas",
    urgency: "high",
  },
  {
    id: "3",
    label: "NIS2 self-assessment is not completed",
    route: "/compliance/nis2",
    urgency: "medium",
  },
];

export function DashboardCriticalTasks() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isNb = i18n.language === "nb";
  const tasks = isNb ? CRITICAL_TASKS_NB : CRITICAL_TASKS_EN;

  return (
    <div className="mb-5 rounded-lg border border-orange-200 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-950/20 p-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
        <h2 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
          {isNb ? "3 viktigste oppgaver nå" : "Top 3 critical tasks now"}
        </h2>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => navigate(task.route)}
            className="flex-1 flex items-center gap-2 rounded-md border border-orange-200/80 dark:border-orange-800/30 bg-white/80 dark:bg-background/60 px-3 py-2 text-left text-xs text-foreground hover:bg-orange-100/60 dark:hover:bg-orange-900/20 transition-colors group"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                task.urgency === "high"
                  ? "bg-destructive"
                  : "bg-orange-400"
              }`}
            />
            <span className="flex-1 line-clamp-2">{task.label}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
