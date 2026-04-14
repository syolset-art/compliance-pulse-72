import { useTranslation } from "react-i18next";
import { Trash2, CheckCircle2, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DeletionStatus = "scheduled" | "awaiting_approval" | "completed" | "overdue";

interface DeletionTask {
  activity: string;
  system: string;
  records: number;
  daysLeft: number | null;
  status: DeletionStatus;
  completedDate?: string;
}

const DEMO_TASKS_NB: DeletionTask[] = [
  { activity: "Kundedata HR", system: "Visma", records: 342, daysLeft: 5, status: "scheduled" },
  { activity: "Søknadsdata", system: "Recruitee", records: 128, daysLeft: 12, status: "awaiting_approval" },
  { activity: "Kundelogg", system: "Salesforce", records: 89, daysLeft: null, status: "completed", completedDate: "14. apr" },
  { activity: "Markedsdata", system: "HubSpot", records: 56, daysLeft: -3, status: "overdue" },
];

const DEMO_TASKS_EN: DeletionTask[] = [
  { activity: "HR Customer Data", system: "Visma", records: 342, daysLeft: 5, status: "scheduled" },
  { activity: "Application Data", system: "Recruitee", records: 128, daysLeft: 12, status: "awaiting_approval" },
  { activity: "Customer Log", system: "Salesforce", records: 89, daysLeft: null, status: "completed", completedDate: "Apr 14" },
  { activity: "Marketing Data", system: "HubSpot", records: 56, daysLeft: -3, status: "overdue" },
];

function StatusIcon({ status }: { status: DeletionStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
    case "overdue":
      return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
    case "awaiting_approval":
      return <Clock className="h-3.5 w-3.5 text-chart-2" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-primary" />;
  }
}

function statusLabel(status: DeletionStatus, isNb: boolean): string {
  const labels: Record<DeletionStatus, [string, string]> = {
    scheduled: ["Planlagt", "Scheduled"],
    awaiting_approval: ["Venter godkjenning", "Awaiting approval"],
    completed: ["Utført", "Completed"],
    overdue: ["Over frist", "Overdue"],
  };
  return labels[status][isNb ? 0 : 1];
}

export function DeletionAgentCard() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const tasks = isNb ? DEMO_TASKS_NB : DEMO_TASKS_EN;

  const scheduled = tasks.filter(t => t.status === "scheduled" || t.status === "awaiting_approval").length;
  const completedToday = tasks.filter(t => t.status === "completed").length;
  const overdue = tasks.filter(t => t.status === "overdue").length;

  return (
    <Card className="p-4 border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg p-1.5 bg-destructive/10">
            <Trash2 className="h-4 w-4 text-destructive" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {isNb ? "Slette-agent" : "Deletion Agent"}
          </h3>
        </div>
        <Badge variant="action" className="text-[10px] px-1.5 py-0">
          {isNb ? "Aktiv" : "Active"}
        </Badge>
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{scheduled} {isNb ? "planlagte" : "scheduled"}</span>
        <span>·</span>
        <span className="text-emerald-600">{completedToday} {isNb ? "utført" : "completed"}</span>
        {overdue > 0 && (
          <>
            <span>·</span>
            <span className="text-destructive font-medium">{overdue} {isNb ? "over frist" : "overdue"}</span>
          </>
        )}
      </div>

      {/* Task list */}
      <div className="space-y-2.5">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-start gap-2">
            <StatusIcon status={task.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground truncate">
                  {task.activity}
                </span>
                <span className="text-[10px] text-muted-foreground">— {task.system}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {task.status === "completed"
                  ? `${task.records} ${isNb ? "poster slettet" : "records deleted"} ${task.completedDate}`
                  : task.status === "awaiting_approval"
                  ? `${isNb ? "Venter godkjenning" : "Awaiting approval"}`
                  : task.status === "overdue"
                  ? `${task.records} ${isNb ? "poster — frist utløpt" : "records — deadline passed"}`
                  : `${task.records} ${isNb ? "poster klare for sletting" : "records ready for deletion"}`}
              </p>
            </div>
            <span
              className={cn(
                "text-[10px] font-medium tabular-nums whitespace-nowrap mt-0.5",
                task.status === "completed"
                  ? "text-emerald-600"
                  : task.status === "overdue"
                  ? "text-destructive"
                  : task.daysLeft !== null && task.daysLeft <= 7
                  ? "text-orange-500"
                  : "text-muted-foreground"
              )}
            >
              {task.status === "completed"
                ? "✓"
                : task.daysLeft !== null
                ? `${isNb ? "om" : "in"} ${Math.abs(task.daysLeft)}${isNb ? " d" : "d"}`
                : ""}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <button className="mt-3 w-full flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
        {isNb ? "Se slettelogg" : "View deletion log"}
        <ChevronRight className="h-3 w-3" />
      </button>
    </Card>
  );
}
