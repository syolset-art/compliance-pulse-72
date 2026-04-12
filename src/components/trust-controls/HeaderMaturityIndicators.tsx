import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, TrendingUp, ClipboardCheck, ListTodo, ChevronDown, ChevronUp, Clock, User, ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeaderMaturityIndicatorsProps {
  riskLevel?: string | null;
  criticality?: string | null;
  maturityPercent: number;
}

const DEMO_TASKS = [
  {
    id: "1",
    title: "Gjennomfør risikovurdering for Microsoft 365",
    description: "Risikovurderingen for Microsoft 365 er utdatert og må oppdateres i henhold til nye retningslinjer.",
    priority: "high" as const,
    source: "auto" as const,
    dueDate: "2026-04-20",
    assignee: "Lars Hansen",
    frameworks: ["ISO27001", "NIS2"],
  },
  {
    id: "2",
    title: "Oppdater databehandleravtale med leverandør",
    description: "DPA med Salesforce mangler oppdatert liste over underleverandører og må fornyes.",
    priority: "high" as const,
    source: "auto" as const,
    dueDate: "2026-04-25",
    assignee: "Maria Olsen",
    frameworks: ["GDPR"],
  },
  {
    id: "3",
    title: "Verifiser backup-rutiner og gjenopprettingsplan",
    description: "Backup-konfigurasjon og gjenopprettingsplan bør testes og dokumenteres for å sikre etterlevelse.",
    priority: "medium" as const,
    source: "manual" as const,
    dueDate: "2026-05-01",
    assignee: null,
    frameworks: ["ISO27001", "CRA"],
  },
];

export function HeaderMaturityIndicators({ riskLevel, criticality, maturityPercent }: HeaderMaturityIndicatorsProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [showTasks, setShowTasks] = useState(false);

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

  const lastAssessmentDate = "23.03.2026";
  const openTasks = DEMO_TASKS.length;

  const getPriorityDisplay = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high": return { label: isNb ? "HØY" : "HIGH", color: "bg-destructive/10 text-destructive border-destructive/20" };
      case "medium": return { label: isNb ? "MIDDELS" : "MED", color: "bg-warning/10 text-warning border-warning/20" };
      default: return { label: isNb ? "LAV" : "LOW", color: "bg-muted text-muted-foreground border-border" };
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(isNb ? "nb-NO" : "en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-3">
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

        {/* Tasks — clickable */}
        <button
          onClick={() => setShowTasks(prev => !prev)}
          className="rounded-lg border border-border bg-card p-3 flex flex-col gap-1.5 text-left hover:border-primary/40 transition-colors relative"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Oppgaver" : "Tasks"}
            </p>
            <div className="flex items-center gap-1">
              <ListTodo className="h-4 w-4 text-warning" />
              {showTasks ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
            </div>
          </div>
          <div className="flex items-end gap-1.5">
            <span className="text-2xl font-extrabold tabular-nums leading-none text-warning">{openTasks}</span>
            <span className="text-xs text-muted-foreground font-medium mb-0.5">{isNb ? "åpne" : "open"}</span>
          </div>
          {/* Notification dot */}
          {openTasks > 0 && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-warning border-2 border-background" />
          )}
        </button>
      </div>

      {/* Expanded task list */}
      {showTasks && (
        <div className="rounded-xl border border-border bg-card overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-warning" />
              <h4 className="text-xs font-semibold text-foreground">
                {isNb ? "Ventende oppgaver" : "Pending Tasks"}
              </h4>
              <Badge className="bg-warning/10 text-warning border-warning/20 text-[9px]">
                {openTasks}
              </Badge>
            </div>
            <button className="text-[10px] text-primary hover:underline font-medium flex items-center gap-1">
              {isNb ? "Se alle" : "View all"}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Task cards */}
          <div className="divide-y divide-border">
            {DEMO_TASKS.map(task => {
              const priority = getPriorityDisplay(task.priority);
              return (
                <div key={task.id} className="px-4 py-3.5 hover:bg-muted/20 transition-colors">
                  {/* Top row: source + priority */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${task.source === "auto" ? "text-primary" : "text-muted-foreground"}`}>
                      {task.source === "auto"
                        ? (isNb ? "AUTOMATISK OPPGAVE" : "AUTO TASK")
                        : (isNb ? "MANUELL OPPGAVE" : "MANUAL TASK")}
                    </span>
                    <Badge className={`text-[9px] ${priority.color}`}>{priority.label}</Badge>
                  </div>

                  {/* Title */}
                  <h5 className="text-sm font-semibold text-foreground mb-1 leading-snug">{task.title}</h5>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5">{task.description}</p>

                  {/* Meta row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Due date */}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px] font-medium">{formatDate(task.dueDate)}</span>
                      </div>
                      {/* Assignee */}
                      {task.assignee && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="text-[10px] font-medium">{task.assignee}</span>
                        </div>
                      )}
                    </div>
                    {/* Framework badges */}
                    <div className="flex items-center gap-1">
                      {task.frameworks.map(fw => (
                        <Badge key={fw} variant="outline" className="text-[8px] px-1.5 py-0 h-4 font-medium">
                          {fw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
