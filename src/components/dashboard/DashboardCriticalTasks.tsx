import { AlertTriangle, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { getCriticalTasksForRole } from "@/lib/roleContentConfig";

export function DashboardCriticalTasks() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { primaryRole } = useUserRole();
  const isNb = i18n.language === "nb";
  const tasks = getCriticalTasksForRole(primaryRole);

  if (tasks.length === 0) return null;

  return (
    <div className="mb-5 rounded-lg border border-orange-200 dark:border-orange-800/40 bg-orange-50/60 dark:bg-orange-950/20 p-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
        <h2 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
          {isNb
            ? `${tasks.length} viktigste oppgaver nå`
            : `Top ${tasks.length} critical tasks now`}
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
            <span className="flex-1 line-clamp-2">
              {isNb ? task.labelNb : task.labelEn}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
