import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, CheckCircle2, Clock, AlertTriangle, ChevronRight, BellOff, PauseCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DeletionStatus = "scheduled" | "awaiting_approval" | "completed" | "overdue" | "snoozed";

interface DeletionTask {
  id: string;
  activity: string;
  system: string;
  records: number;
  daysLeft: number | null;
  status: DeletionStatus;
  completedDate?: string;
  snoozedUntil?: string;
}

const makeTasks = (isNb: boolean): DeletionTask[] => [
  { id: "1", activity: isNb ? "Kundedata HR" : "HR Customer Data", system: "Visma", records: 342, daysLeft: 5, status: "scheduled" },
  { id: "2", activity: isNb ? "Søknadsdata" : "Application Data", system: "Recruitee", records: 128, daysLeft: 12, status: "awaiting_approval" },
  { id: "3", activity: isNb ? "Kundelogg" : "Customer Log", system: "Salesforce", records: 89, daysLeft: null, status: "completed", completedDate: isNb ? "14. apr" : "Apr 14" },
  { id: "4", activity: isNb ? "Markedsdata" : "Marketing Data", system: "HubSpot", records: 56, daysLeft: -3, status: "overdue" },
];

interface LogEntry {
  date: string;
  activity: string;
  system: string;
  records: number;
}

const LOG_NB: { week: LogEntry[]; month: LogEntry[]; year: LogEntry[] } = {
  week: [
    { date: "14. apr", activity: "Kundelogg", system: "Salesforce", records: 89 },
    { date: "12. apr", activity: "Besøksdata", system: "Google Analytics", records: 1204 },
  ],
  month: [
    { date: "14. apr", activity: "Kundelogg", system: "Salesforce", records: 89 },
    { date: "12. apr", activity: "Besøksdata", system: "Google Analytics", records: 1204 },
    { date: "2. apr", activity: "Søknadsdata", system: "Recruitee", records: 67 },
    { date: "28. mar", activity: "Supportlogger", system: "Zendesk", records: 312 },
  ],
  year: [
    { date: "14. apr", activity: "Kundelogg", system: "Salesforce", records: 89 },
    { date: "12. apr", activity: "Besøksdata", system: "Google Analytics", records: 1204 },
    { date: "2. apr", activity: "Søknadsdata", system: "Recruitee", records: 67 },
    { date: "28. mar", activity: "Supportlogger", system: "Zendesk", records: 312 },
    { date: "15. feb", activity: "Lønnsdata", system: "Visma", records: 445 },
    { date: "3. jan", activity: "Markedsdata", system: "HubSpot", records: 198 },
    { date: "18. nov", activity: "HR-logger", system: "SAP", records: 523 },
    { date: "5. sep", activity: "Kundedata", system: "Dynamics", records: 876 },
  ],
};

const LOG_EN: { week: LogEntry[]; month: LogEntry[]; year: LogEntry[] } = {
  week: [
    { date: "Apr 14", activity: "Customer Log", system: "Salesforce", records: 89 },
    { date: "Apr 12", activity: "Visit Data", system: "Google Analytics", records: 1204 },
  ],
  month: [
    { date: "Apr 14", activity: "Customer Log", system: "Salesforce", records: 89 },
    { date: "Apr 12", activity: "Visit Data", system: "Google Analytics", records: 1204 },
    { date: "Apr 2", activity: "Application Data", system: "Recruitee", records: 67 },
    { date: "Mar 28", activity: "Support Logs", system: "Zendesk", records: 312 },
  ],
  year: [
    { date: "Apr 14", activity: "Customer Log", system: "Salesforce", records: 89 },
    { date: "Apr 12", activity: "Visit Data", system: "Google Analytics", records: 1204 },
    { date: "Apr 2", activity: "Application Data", system: "Recruitee", records: 67 },
    { date: "Mar 28", activity: "Support Logs", system: "Zendesk", records: 312 },
    { date: "Feb 15", activity: "Payroll Data", system: "Visma", records: 445 },
    { date: "Jan 3", activity: "Marketing Data", system: "HubSpot", records: 198 },
    { date: "Nov 18", activity: "HR Logs", system: "SAP", records: 523 },
    { date: "Sep 5", activity: "Customer Data", system: "Dynamics", records: 876 },
  ],
};

function StatusIcon({ status }: { status: DeletionStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
    case "overdue":
      return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
    case "snoozed":
      return <PauseCircle className="h-3.5 w-3.5 text-muted-foreground" />;
    case "awaiting_approval":
      return <Clock className="h-3.5 w-3.5 text-chart-2" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-primary" />;
  }
}

function formatSnoozeDate(days: number, isNb: boolean): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isNb
    ? `${d.getDate()}. ${["jan","feb","mar","apr","mai","jun","jul","aug","sep","okt","nov","des"][d.getMonth()]}`
    : `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getDate()}`;
}

export function DeletionAgentCard() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [tasks, setTasks] = useState<DeletionTask[]>(() => makeTasks(isNb));
  const [logOpen, setLogOpen] = useState(false);

  const scheduled = tasks.filter(t => t.status === "scheduled" || t.status === "awaiting_approval").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const overdue = tasks.filter(t => t.status === "overdue").length;

  const handleSnooze = (id: string, days: number) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: "snoozed" as DeletionStatus, snoozedUntil: formatSnoozeDate(days, isNb), daysLeft: days } : t
    ));
  };

  const log = isNb ? LOG_NB : LOG_EN;

  const LogList = ({ entries }: { entries: LogEntry[] }) => {
    const total = entries.reduce((s, e) => s + e.records, 0);
    return (
      <div>
        <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{entries.length} {isNb ? "slettinger" : "deletions"}</span>
          <span>·</span>
          <span>{total.toLocaleString()} {isNb ? "poster" : "records"}</span>
        </div>
        <div className="space-y-2">
          {entries.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
              <span className="text-muted-foreground w-14 shrink-0">{e.date}</span>
              <span className="font-medium text-foreground truncate">{e.activity}</span>
              <span className="text-muted-foreground">— {e.system}</span>
              <span className="ml-auto text-muted-foreground tabular-nums">{e.records}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
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
          <span className="text-emerald-600">{completedCount} {isNb ? "utført" : "completed"}</span>
          {overdue > 0 && (
            <>
              <span>·</span>
              <span className="text-destructive font-medium">{overdue} {isNb ? "over frist" : "overdue"}</span>
            </>
          )}
        </div>

        {/* Task list */}
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-2">
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
                    : task.status === "snoozed"
                    ? `${isNb ? "Slumret til" : "Snoozed until"} ${task.snoozedUntil}`
                    : task.status === "awaiting_approval"
                    ? `${isNb ? "Venter godkjenning" : "Awaiting approval"}`
                    : task.status === "overdue"
                    ? `${task.records} ${isNb ? "poster — frist utløpt" : "records — deadline passed"}`
                    : `${task.records} ${isNb ? "poster klare for sletting" : "records ready for deletion"}`}
                </p>
              </div>

              {/* Snooze button for scheduled/overdue */}
              {(task.status === "scheduled" || task.status === "overdue") && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="p-0.5 rounded hover:bg-muted transition-colors mt-0.5" title={isNb ? "Slumre" : "Snooze"}>
                      <BellOff className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-36 p-1.5" align="end">
                    <p className="text-[10px] font-medium text-muted-foreground px-1.5 pb-1">{isNb ? "Slumre" : "Snooze"}</p>
                    {[7, 14, 30].map(d => (
                      <button
                        key={d}
                        onClick={() => handleSnooze(task.id, d)}
                        className="w-full text-left text-xs px-1.5 py-1 rounded hover:bg-muted transition-colors"
                      >
                        {d} {isNb ? "dager" : "days"}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              )}

              <span
                className={cn(
                  "text-[10px] font-medium tabular-nums whitespace-nowrap mt-0.5",
                  task.status === "completed"
                    ? "text-emerald-600"
                    : task.status === "overdue"
                    ? "text-destructive"
                    : task.status === "snoozed"
                    ? "text-muted-foreground"
                    : task.daysLeft !== null && task.daysLeft <= 7
                    ? "text-orange-500"
                    : "text-muted-foreground"
                )}
              >
                {task.status === "completed"
                  ? "✓"
                  : task.status === "snoozed"
                  ? (isNb ? "slumret" : "snoozed")
                  : task.daysLeft !== null
                  ? `${isNb ? "om" : "in"} ${Math.abs(task.daysLeft)}d`
                  : ""}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <button
          onClick={() => setLogOpen(true)}
          className="mt-3 w-full flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {isNb ? "Se slettelogg" : "View deletion log"}
          <ChevronRight className="h-3 w-3" />
        </button>
      </Card>

      {/* Deletion log dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {isNb ? "Slettelogg" : "Deletion Log"}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="week">
            <TabsList className="w-full">
              <TabsTrigger value="week" className="flex-1 text-xs">{isNb ? "Siste uke" : "Last week"}</TabsTrigger>
              <TabsTrigger value="month" className="flex-1 text-xs">{isNb ? "Siste måned" : "Last month"}</TabsTrigger>
              <TabsTrigger value="year" className="flex-1 text-xs">{isNb ? "Siste år" : "Last year"}</TabsTrigger>
            </TabsList>
            <TabsContent value="week"><LogList entries={log.week} /></TabsContent>
            <TabsContent value="month"><LogList entries={log.month} /></TabsContent>
            <TabsContent value="year"><LogList entries={log.year} /></TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
