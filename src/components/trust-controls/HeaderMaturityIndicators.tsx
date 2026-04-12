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

  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (key: string) => {
    if (key === "tasks") {
      setShowTasks(prev => !prev);
      setExpandedCard(null);
    } else {
      setExpandedCard(prev => prev === key ? null : key);
      setShowTasks(false);
    }
  };

  const cardBase = "rounded-lg border bg-card p-3 flex flex-col gap-1.5 text-left transition-all duration-150 cursor-pointer group relative";
  const cardHover = "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5";

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        {/* Risk Level */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={() => toggleCard("risk")} className={`${cardBase} ${cardHover} ${expandedCard === "risk" ? "border-primary/40 shadow-md" : "border-border"}`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isNb ? "Risikonivå" : "Risk Level"}
                </p>
                <AlertTriangle className={`h-4 w-4 ${risk.iconColor} group-hover:scale-110 transition-transform`} />
              </div>
              <p className={`text-sm font-bold ${risk.color}`}>{risk.label}</p>
              <span className="absolute bottom-1.5 right-2 text-[9px] text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                {isNb ? "Se detaljer" : "Details"} <ExternalLink className="h-2.5 w-2.5" />
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px] text-xs">
            {isNb ? "Klikk for å se risikovurdering og tiltak" : "Click to view risk assessment and actions"}
          </TooltipContent>
        </Tooltip>

        {/* Maturity */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={() => toggleCard("maturity")} className={`${cardBase} ${cardHover} ${expandedCard === "maturity" ? "border-primary/40 shadow-md" : "border-border"}`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isNb ? "Modenhet" : "Maturity"}
                </p>
                <TrendingUp className={`h-4 w-4 ${matColor} group-hover:scale-110 transition-transform`} />
              </div>
              <div className="flex items-end gap-1.5">
                <span className={`text-2xl font-extrabold tabular-nums leading-none ${matColor}`}>{maturityPercent}</span>
                <span className="text-xs text-muted-foreground font-medium mb-0.5">%</span>
              </div>
              <span className="absolute bottom-1.5 right-2 text-[9px] text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                {isNb ? "Se kontroller" : "Controls"} <ExternalLink className="h-2.5 w-2.5" />
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px] text-xs">
            {isNb ? "Klikk for å se modenhet per kontrollområde" : "Click to view maturity by control area"}
          </TooltipContent>
        </Tooltip>

        {/* Internal Risk Assessment */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={() => toggleCard("assessment")} className={`${cardBase} ${cardHover} ${expandedCard === "assessment" ? "border-primary/40 shadow-md" : "border-border"}`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isNb ? "Intern risikovurd." : "Risk Assessment"}
                </p>
                <ClipboardCheck className={`h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all`} />
              </div>
              <p className="text-sm font-bold text-foreground">{lastAssessmentDate}</p>
              <span className="absolute bottom-1.5 right-2 text-[9px] text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                {isNb ? "Åpne" : "Open"} <ExternalLink className="h-2.5 w-2.5" />
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px] text-xs">
            {isNb ? "Klikk for å se intern risikovurdering" : "Click to view internal risk assessment"}
          </TooltipContent>
        </Tooltip>

        {/* Tasks — clickable */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => toggleCard("tasks")}
              className={`${cardBase} ${cardHover} ${showTasks ? "border-primary/40 shadow-md" : "border-border"}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isNb ? "Oppgaver" : "Tasks"}
                </p>
                <div className="flex items-center gap-1">
                  <ListTodo className={`h-4 w-4 text-warning group-hover:scale-110 transition-transform`} />
                  {showTasks ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="text-2xl font-extrabold tabular-nums leading-none text-warning">{openTasks}</span>
                <span className="text-xs text-muted-foreground font-medium mb-0.5">{isNb ? "åpne" : "open"}</span>
              </div>
              {openTasks > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-warning border-2 border-background" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px] text-xs">
            {isNb ? "Klikk for å se ventende oppgaver" : "Click to view pending tasks"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Expanded info panels for Risk / Maturity / Assessment */}
      {expandedCard && expandedCard !== "tasks" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground">
              {expandedCard === "risk" && (isNb ? "Risikovurdering" : "Risk Assessment")}
              {expandedCard === "maturity" && (isNb ? "Modenhet per kontrollområde" : "Maturity by Control Area")}
              {expandedCard === "assessment" && (isNb ? "Intern risikovurdering" : "Internal Risk Assessment")}
            </h4>
            <button className="text-[10px] text-primary hover:underline font-medium flex items-center gap-1">
              {isNb ? "Gå til fullstendig visning" : "Go to full view"}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="px-4 py-4">
            {expandedCard === "risk" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{isNb ? "Risikonivået er basert på kontrollmangler og sårbarheter identifisert i vurderingen." : "Risk level is based on control gaps and vulnerabilities identified in the assessment."}</p>
                <div className="space-y-2">
                  {[
                    { label: isNb ? "Manglende kryptering på data i transit" : "Missing encryption on data in transit", severity: "high" },
                    { label: isNb ? "Ingen hendelseshåndteringsplan dokumentert" : "No incident response plan documented", severity: "medium" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background">
                      <span className="text-xs font-medium text-foreground">{item.label}</span>
                      <Badge className={`text-[9px] ${item.severity === "high" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                        {item.severity === "high" ? (isNb ? "Høy" : "High") : (isNb ? "Middels" : "Med")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {expandedCard === "maturity" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">{isNb ? "Oversikt over modenhetsgrad fordelt på kontrollområder." : "Overview of maturity level by control area."}</p>
                {[
                  { label: isNb ? "Styring" : "Governance", score: 72 },
                  { label: isNb ? "Drift og sikkerhet" : "Operations & Security", score: 48 },
                  { label: isNb ? "Personvern" : "Privacy", score: 55 },
                  { label: isNb ? "Tredjepartstyring" : "Third-Party", score: 38 },
                ].map((area, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-background">
                    <span className="text-xs font-medium text-foreground flex-1">{area.label}</span>
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${area.score >= 70 ? "bg-success" : area.score >= 40 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${area.score}%` }} />
                    </div>
                    <span className={`text-xs font-bold tabular-nums w-8 text-right ${area.score >= 70 ? "text-success" : area.score >= 40 ? "text-warning" : "text-destructive"}`}>{area.score}%</span>
                  </div>
                ))}
              </div>
            )}
            {expandedCard === "assessment" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{isNb ? "Siste interne risikovurdering ble gjennomført 23. mars 2026." : "Last internal risk assessment was completed on March 23, 2026."}</p>
                <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-background">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{isNb ? "Neste vurdering" : "Next assessment"}</p>
                    <p className="text-sm font-bold text-foreground">23.09.2026</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{isNb ? "Ansvarlig" : "Responsible"}</p>
                    <p className="text-sm font-bold text-foreground">Lars Hansen</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Status</p>
                    <Badge className="bg-success/10 text-success border-success/20 text-[9px]">{isNb ? "Fullført" : "Completed"}</Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
    </TooltipProvider>
  );
}
