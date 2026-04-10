import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronDown, Bot, Sparkles, Loader2, CheckCircle2, X, Shield, Lock, AlertTriangle, Clock, ListTodo, HelpCircle, FolderKanban, Crown, ClipboardList, BarChart3, Users, Bell } from "lucide-react";
import { TasksPremiumDialog } from "@/components/tasks/TasksPremiumDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { useTranslation } from "react-i18next";
import { PageHelpDrawer } from "@/components/shared/PageHelpDrawer";
import { ClipboardList as ClipboardListHelp, Zap, Users as UsersHelp } from "lucide-react";

interface Task {
  id: string;
  type: "system" | "prosess" | "protokoll";
  priority: "høy" | "middels" | "lav";
  title: string;
  description: string;
  relevantFor: string[];
  systemCount?: number;
  processCount?: number;
  aiAutonomyLevel: number; // 0-100, what autonomy level needed for AI to handle this
  actionCategory?: "open_incidents" | "overdue_reviews" | "pending_approvals"; // Category for action filters
}

const mockTasks: Task[] = [
  // Action-required tasks
  {
    id: "incident-1",
    type: "system",
    priority: "høy",
    title: "Uautorisert tilgangsforsøk oppdaget",
    description: "Flere mislykkede innloggingsforsøk registrert på HR-systemet. Undersøk og bekreft at det ikke foreligger sikkerhetsbrudd.",
    relevantFor: ["ISO27001", "NIS2"],
    systemCount: 1,
    aiAutonomyLevel: 90,
    actionCategory: "open_incidents"
  },
  {
    id: "incident-2",
    type: "system",
    priority: "høy",
    title: "Potensiell datalekkasje i CRM-system",
    description: "Uvanlig dataeksport oppdaget. Verifiser at det var autorisert aktivitet og dokumenter hendelsen.",
    relevantFor: ["GDPR", "ISO27001"],
    systemCount: 1,
    aiAutonomyLevel: 95,
    actionCategory: "open_incidents"
  },
  {
    id: "review-1",
    type: "system",
    priority: "høy",
    title: "Revisjon av SharePoint er forfalt",
    description: "Planlagt sikkerhetsvurdering for SharePoint skulle vært gjennomført. Planlegg ny revisjon.",
    relevantFor: ["ISO27001", "GDPR"],
    systemCount: 1,
    aiAutonomyLevel: 40,
    actionCategory: "overdue_reviews"
  },
  {
    id: "review-2",
    type: "system",
    priority: "middels",
    title: "SAP-system krever årlig revisjon",
    description: "Årlig sikkerhetsrevisjon av SAP-systemet er forfalt. Iverksett revisjonsprosess.",
    relevantFor: ["ISO27001", "NIS2"],
    systemCount: 1,
    aiAutonomyLevel: 45,
    actionCategory: "overdue_reviews"
  },
  {
    id: "approval-1",
    type: "prosess",
    priority: "høy",
    title: "Godkjenn risikovurdering for nytt AI-system",
    description: "Risikovurdering for det nye ChatGPT-integrasjonen venter på din godkjenning før produksjonssetting.",
    relevantFor: ["EU AI Act", "ISO27001"],
    processCount: 1,
    aiAutonomyLevel: 100,
    actionCategory: "pending_approvals"
  },
  {
    id: "approval-2",
    type: "prosess",
    priority: "høy",
    title: "Godkjenn DPIA for kundeportal",
    description: "Personvernkonsekvensvurdering for ny kundeportal er klar for godkjenning.",
    relevantFor: ["GDPR"],
    processCount: 1,
    aiAutonomyLevel: 100,
    actionCategory: "pending_approvals"
  },
  {
    id: "approval-3",
    type: "prosess",
    priority: "middels",
    title: "Godkjenn oppdatert tilgangspolicy",
    description: "Revidert tilgangspolicy for leverandører venter på godkjenning.",
    relevantFor: ["ISO27001", "NIS2"],
    processCount: 1,
    aiAutonomyLevel: 100,
    actionCategory: "pending_approvals"
  },
  // Regular tasks
  {
    id: "1",
    type: "system",
    priority: "høy",
    title: "Manglende informasjon om datalagring",
    description: "Spesifiser hvor data lagres for å sikre at personopplysninger behandles i henhold til GDPR og andre relevante regelverk.",
    relevantFor: ["GDPR", "ISO27001", "CRA", "NIS2"],
    systemCount: 2,
    aiAutonomyLevel: 50
  },
  {
    id: "2",
    type: "system",
    priority: "høy",
    title: "Manglende Transfer Impact Assessment (TIA)",
    description: "Systemer som overfører data utenfor EU/EØS må ha en Transfer Impact Assessment (TIA) i henhold til GDPR artikkel 44-49 og Schrems II-dommen.",
    relevantFor: ["GDPR"],
    systemCount: 4,
    aiAutonomyLevel: 75
  },
  {
    id: "3",
    type: "prosess",
    priority: "høy",
    title: "Uhåndterte risikoer i prosess",
    description: "Alle identifiserte risikoer i prosessen må ha en status som ikke er \"Ikke håndtert\".",
    relevantFor: ["ISO27001", "GDPR", "NIS2"],
    processCount: 5,
    aiAutonomyLevel: 25
  },
  // AI Governance tasks
  {
    id: "4",
    type: "system",
    priority: "høy",
    title: "Klassifiser AI-systemer etter risikonivå",
    description: "Alle AI-systemer må klassifiseres etter EU AI Act risikonivåer: uakseptabel, høy, begrenset eller minimal risiko.",
    relevantFor: ["EU AI Act"],
    systemCount: 5,
    aiAutonomyLevel: 50
  },
  {
    id: "5",
    type: "prosess",
    priority: "høy",
    title: "Dokumenter AI-beslutningslogikk",
    description: "For høyrisiko AI-systemer kreves full dokumentasjon av beslutningslogikk og treningsdata iht. EU AI Act artikkel 11.",
    relevantFor: ["EU AI Act", "AI Act"],
    processCount: 3,
    aiAutonomyLevel: 60
  },
  {
    id: "6",
    type: "prosess",
    priority: "middels",
    title: "Etabler menneske-i-løkka-prosedyrer",
    description: "Implementer krav om menneskelig tilsyn for AI-systemer som fatter beslutninger med vesentlig påvirkning på enkeltpersoner.",
    relevantFor: ["EU AI Act"],
    processCount: 4,
    aiAutonomyLevel: 40
  },
  {
    id: "7",
    type: "system",
    priority: "høy",
    title: "Gjennomfør FRIA (Fundamental Rights Impact Assessment)",
    description: "Høyrisiko AI-systemer må ha gjennomført konsekvensanalyse for grunnleggende rettigheter før produksjonssetting.",
    relevantFor: ["EU AI Act", "AI Act"],
    systemCount: 2,
    aiAutonomyLevel: 75
  },
  {
    id: "8",
    type: "system",
    priority: "middels",
    title: "Registrer AI-systemer i EU-databasen",
    description: "Høyrisiko AI-systemer skal registreres i EUs offisielle AI-database før de tas i bruk.",
    relevantFor: ["EU AI Act"],
    systemCount: 3,
    aiAutonomyLevel: 30
  },
  {
    id: "9",
    type: "prosess",
    priority: "lav",
    title: "Oppdater transparensinformasjon for AI-chat",
    description: "Brukere må informeres tydelig når de kommuniserer med AI-systemer iht. transparenskravene i EU AI Act.",
    relevantFor: ["AI Act", "EU AI Act"],
    processCount: 2,
    aiAutonomyLevel: 25
  },
  {
    id: "10",
    type: "system",
    priority: "middels",
    title: "Verifiser AI-leverandørens samsvarserklæring",
    description: "Innhent og verifiser samsvarserklæring (CE-merking) fra leverandører av høyrisiko AI-systemer.",
    relevantFor: ["EU AI Act"],
    systemCount: 4,
    aiAutonomyLevel: 45
  },
  // Additional InfoSec tasks
  {
    id: "11",
    type: "system",
    priority: "høy",
    title: "Oppdater tilgangskontroll-policy",
    description: "Gjennomgå og oppdater tilgangskontroll i henhold til ISO 27001 Annex A.9 og NIS2-direktivets krav.",
    relevantFor: ["ISO27001", "NIS2"],
    systemCount: 6,
    aiAutonomyLevel: 35
  },
  {
    id: "12",
    type: "prosess",
    priority: "middels",
    title: "Etabler hendelseshåndteringsprosess",
    description: "Dokumenter og implementer prosess for håndtering av sikkerhetshendelser iht. NIS2 artikkel 23.",
    relevantFor: ["NIS2", "ISO27001"],
    processCount: 1,
    aiAutonomyLevel: 55
  }
];

// Mapping between domain IDs and relevant regulatory frameworks
const domainFrameworkMapping: Record<string, { frameworks: string[]; name: string; icon: React.ReactNode }> = {
  privacy: {
    frameworks: ["GDPR", "Personopplysningsloven"],
    name: "Personvern",
    icon: <Shield className="w-4 h-4" />
  },
  infosec: {
    frameworks: ["ISO27001", "NIS2", "CRA"],
    name: "Informasjonssikkerhet",
    icon: <Lock className="w-4 h-4" />
  },
  "ai-governance": {
    frameworks: ["EU AI Act", "AI Act"],
    name: "AI Governance",
    icon: <Bot className="w-4 h-4" />
  }
};

// Filter type labels for display
const actionFilterLabels: Record<string, { label: string; description: string }> = {
  open_incidents: { 
    label: "Åpne sikkerhetshendelser", 
    description: "Sikkerhetshendelser som krever umiddelbar handling" 
  },
  overdue_reviews: { 
    label: "Systemer krever revisjon", 
    description: "Systemer hvor planlagt revisjonsdato har passert" 
  },
  pending_approvals: { 
    label: "Risikovurderinger venter godkjenning", 
    description: "Risikovurderinger som venter på din godkjenning" 
  }
};

export default function Tasks() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const domainFilter = searchParams.get("domain");
  const actionFilter = searchParams.get("filter");
  const viewParam = searchParams.get("view");
  
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  // aiStatusFilter removed — consolidated into domain + type/priority chips
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [aiWorkingTasks, setAiWorkingTasks] = useState<Set<string>>(new Set());
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [overallCompliance, setOverallCompliance] = useState(81);
  const [helpOpen, setHelpOpen] = useState(false);
  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);
  const [isPremiumActivated, setIsPremiumActivated] = useState(() => 
    localStorage.getItem("tasks_premium_activated") === "true"
  );

  // Mock autonomy levels from AI setup (in real app, fetch from storage/context)
  const currentAutonomyLevels = {
    system: 50,
    service: 50,
    admin: 25,
    process: 25
  };

  const clearActionFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("filter");
    setSearchParams(newParams);
  };

  // AI simulation disabled – was too noisy for users

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const canAIHandle = (task: Task) => {
    // Check if current autonomy level allows AI to handle this task
    const relevantLevel = task.type === "prosess" 
      ? currentAutonomyLevels.process 
      : currentAutonomyLevels.system;
    
    return relevantLevel >= task.aiAutonomyLevel;
  };

  const requestAIHelp = (task: Task) => {
    if (canAIHandle(task)) {
      setAiWorkingTasks(prev => new Set([...prev, task.id]));
      setTaskProgress(prev => ({ ...prev, [task.id]: 0 }));
      toast({
        title: "AI-agent aktivert",
        description: `AI-agenten starter nå arbeidet med "${task.title}". Du vil få varsel når oppgaven er klar for godkjenning.`,
      });
      setSelectedTask(null);
    } else {
      toast({
        title: "Autonominivå for lavt",
        description: `For å la AI-agenten håndtere denne oppgaven, må autonominivået være minst ${task.aiAutonomyLevel}%. Gå til AI-agent innstillinger for å justere.`,
        variant: "destructive",
      });
    }
  };

  const getAutonomyLevelName = (level: number) => {
    if (level <= 25) return "Begrenset autonom";
    if (level <= 50) return "Assisterende";
    if (level <= 75) return "Semi-autonom";
    return "Høy autonomi";
  };

  // Priority order for sorting
  const priorityOrder = { "høy": 0, "middels": 1, "lav": 2 };

  const filteredTasks = mockTasks
    .filter(task => {
      // Action filter from URL (open_incidents, overdue_reviews, pending_approvals)
      if (actionFilter && actionFilterLabels[actionFilter]) {
        if (task.actionCategory !== actionFilter) return false;
      }
      
      // Domain filter from URL or state
      if (domainFilter && domainFrameworkMapping[domainFilter]) {
        const relevantFrameworks = domainFrameworkMapping[domainFilter].frameworks;
        const hasRelevantFramework = task.relevantFor.some(framework => 
          relevantFrameworks.some(rf => framework.toLowerCase().includes(rf.toLowerCase()) || rf.toLowerCase().includes(framework.toLowerCase()))
        );
        if (!hasRelevantFramework) return false;
      }
      
      // AI status filter removed
      
      // Type/priority filters
      if (selectedFilters.length === 0) return true;
      return selectedFilters.some(filter => {
        const filterLower = filter.toLowerCase();
        if (filterLower === "system" && task.type === "system") return true;
        if (filterLower === "prosess" && task.type === "prosess") return true;
        if (filterLower === "høy prioritet" && task.priority === "høy") return true;
        if (filterLower === "middels prioritet" && task.priority === "middels") return true;
        if (filterLower === "lav prioritet" && task.priority === "lav") return true;
        return false;
      });
    })
    // Sort by priority (høy first, then middels, then lav)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  const activeActionFilter = actionFilter ? actionFilterLabels[actionFilter] : null;
  
  const setDomainFilter = (domain: string | null) => {
    if (domain) {
      navigate(`/tasks?domain=${domain}`);
    } else {
      navigate("/tasks");
    }
  };
  
  const activeDomain = domainFilter ? domainFrameworkMapping[domainFilter] : null;

  // Count tasks per domain
  const getTaskCountForDomain = (domainId: string) => {
    const frameworks = domainFrameworkMapping[domainId]?.frameworks || [];
    return mockTasks.filter(task => 
      task.relevantFor.some(framework => 
        frameworks.some(rf => framework.toLowerCase().includes(rf.toLowerCase()) || rf.toLowerCase().includes(framework.toLowerCase()))
      )
    ).length;
  };

  // Removed aiHandlingCount, requiresActionCount, hybridCount

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto md:pt-11">
        <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{t("tasks.title")}</h1>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => setHelpOpen(true)}>
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">Hvordan fungerer dette?</span>
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-2 text-muted-foreground" onClick={() => toast({ title: "Prosjekter", description: "Prosjekter er en premium-funksjon. Kontakt oss for å aktivere." })}>
            <FolderKanban className="h-4 w-4" />
            Prosjekter
            <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px] px-1.5 py-0">
              <Crown className="h-2.5 w-2.5 mr-0.5" />
              Premium
            </Badge>
          </Button>
        </div>
        <p className="text-muted-foreground mb-6">{t("tasks.subtitle")}</p>

        <TasksPremiumDialog 
          open={premiumDialogOpen} 
          onOpenChange={setPremiumDialogOpen}
          onActivated={() => setIsPremiumActivated(true)}
        />

        {!isPremiumActivated ? (
          /* Premium gate – show feature overview */
          <div className="flex flex-col items-center justify-center py-16 max-w-lg mx-auto text-center space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ClipboardList className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Oppgaver</h2>
              <p className="text-muted-foreground">
                Få automatisk genererte compliance-oppgaver basert på dine systemer og regelverk. 
                La AI-agenten håndtere rutinearbeid mens du fokuserer på det som krever menneskelig vurdering.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {[
                { icon: ClipboardList, label: "Auto-genererte oppgaver" },
                { icon: Bot, label: "AI-agent utfører oppgaver" },
                { icon: BarChart3, label: "Prioritering etter risiko" },
                { icon: FolderKanban, label: "Prosjekter og milepæler" },
                { icon: Users, label: "Flerbruker med seats" },
                { icon: Bell, label: "Varsler og påminnelser" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {f.label}
                </div>
              ))}
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 w-full">
              <p className="text-lg font-bold text-foreground">kr 2 900 <span className="text-sm font-normal text-muted-foreground">/ mnd per seat</span></p>
              <p className="text-xs text-muted-foreground mt-1">Velg antall seats ved aktivering</p>
            </div>

            <Button
              onClick={() => setPremiumDialogOpen(true)}
              className="gap-2 bg-gradient-to-r from-blue-600 to-primary hover:from-blue-700 hover:to-primary/90 text-white px-8"
              size="lg"
            >
              <Sparkles className="h-4 w-4" />
              Aktiver Oppgaver
            </Button>
          </div>
        ) : (
          <>
        {/* Action Filter Banner - Shows when navigating from dashboard widget */}
        {activeActionFilter && (
          <Card className="p-4 mb-6 border-warning/50 bg-warning/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
                  {actionFilter === "open_incidents" && <AlertTriangle className="h-5 w-5 text-destructive" />}
                  {actionFilter === "overdue_reviews" && <Clock className="h-5 w-5 text-warning" />}
                  {actionFilter === "pending_approvals" && <Shield className="h-5 w-5 text-yellow-500" />}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{activeActionFilter.label}</h3>
                  <p className="text-sm text-muted-foreground">{activeActionFilter.description}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearActionFilter}
                className="text-muted-foreground hover:text-foreground gap-1"
              >
                <X className="w-4 h-4" />
                Vis alle oppgaver
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Viser {filteredTasks.length} {filteredTasks.length === 1 ? 'oppgave' : 'oppgaver'} som krever din handling
            </p>
          </Card>
        )}

        {/* Consolidated Filter Bar */}
        {!activeActionFilter && (
          <div className="mb-6 space-y-3">
            {/* Single row: Domain chips + compact type/priority toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setDomainFilter(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  !domainFilter
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Alle ({mockTasks.length})
              </button>
              {Object.entries(domainFrameworkMapping).map(([key, domain]) => (
                <button
                  key={key}
                  onClick={() => setDomainFilter(domainFilter === key ? null : key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    domainFilter === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {domain.icon}
                  {domain.name} ({getTaskCountForDomain(key)})
                </button>
              ))}

              <div className="w-px h-4 bg-border mx-1" />

              {["System", "Prosess"].map(filter => (
                <button
                  key={filter}
                  onClick={() => toggleFilter(filter.toUpperCase())}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedFilters.includes(filter.toUpperCase())
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter}
                </button>
              ))}

              <div className="w-px h-4 bg-border mx-1" />

              {[
                { label: "Høy", value: "HØY PRIORITET" },
                { label: "Middels", value: "MIDDELS PRIORITET" },
                { label: "Lav", value: "LAV PRIORITET" },
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => toggleFilter(filter.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedFilters.includes(filter.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter.label}
                </button>
              ))}

              {selectedFilters.length > 0 && (
                <button
                  onClick={() => setSelectedFilters([])}
                  className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Nullstill
                </button>
              )}
            </div>

            {/* Task count */}
            <p className="text-xs text-muted-foreground">
              {t("tasks.showing", { count: filteredTasks.length })}
              {activeDomain && <span> for {activeDomain.name}</span>}
            </p>
          </div>
        )}

        {/* Tasks list */}
        <div className="space-y-4">
          {filteredTasks.map(task => {
            const isWorking = aiWorkingTasks.has(task.id);
            const isCompleted = completedTasks.has(task.id);
            const progress = taskProgress[task.id] || 0;

            return (
            <Card key={task.id} className={`p-6 transition-all duration-300 ${isWorking ? 'border-primary/50 bg-primary/5' : ''} ${isCompleted ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={task.type === "system" ? "default" : "secondary"}>
                      {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                    </Badge>
                    <Badge variant="destructive">
                      {task.priority === "høy" ? "Høy prioritet" : task.priority === "middels" ? "Middels prioritet" : "Lav prioritet"}
                    </Badge>
                    {isCompleted && (
                      <Badge variant="outline" className="gap-1 border-green-500/30 bg-green-500/10 text-green-700">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-xs">Fullført av AI</span>
                      </Badge>
                    )}
                    {isWorking && (
                      <Badge variant="outline" className="gap-1 border-primary/50 bg-primary/10 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-xs">AI jobber...</span>
                      </Badge>
                    )}
                    {!isWorking && !isCompleted && canAIHandle(task) && (
                      <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-xs">AI kan hjelpe</span>
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">{task.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                  
                  {isWorking && (
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Fremgang:</span>
                        <span className="font-semibold text-primary">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Relevant for:</span>
                    {task.relevantFor.map(standard => (
                      <Badge key={standard} variant="outline" className="text-xs">
                        {standard}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {!isCompleted && (
                  <Dialog open={selectedTask?.id === task.id} onOpenChange={(open) => !open && setSelectedTask(null)}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => setSelectedTask(task)}
                        disabled={isWorking}
                      >
                        <Bot className="w-4 h-4" />
                        {isWorking ? 'Jobber...' : 'AI-hjelp'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Få hjelp fra AI-agent</DialogTitle>
                        <DialogDescription>
                          {task.title}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                        
                        <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">Krever autonominivå</p>
                              <p className="text-xs text-muted-foreground">
                                {getAutonomyLevelName(task.aiAutonomyLevel)} ({task.aiAutonomyLevel}%)
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Ditt nåværende nivå</p>
                              <p className="text-xs text-muted-foreground">
                                {getAutonomyLevelName(task.type === "prosess" ? currentAutonomyLevels.process : currentAutonomyLevels.system)} 
                                ({task.type === "prosess" ? currentAutonomyLevels.process : currentAutonomyLevels.system}%)
                              </p>
                            </div>
                          </div>
                          
                          {!canAIHandle(task) && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">
                              ⚠️ Ditt autonominivå er for lavt til å la AI-agenten håndtere denne oppgaven. 
                              Øk nivået i AI-agent innstillinger.
                            </div>
                          )}
                          
                          {canAIHandle(task) && (
                            <div className="bg-primary/10 text-primary text-sm p-3 rounded">
                              ✓ AI-agenten kan håndtere denne oppgaven basert på dine nåværende innstillinger.
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setSelectedTask(null)}
                        >
                          Avbryt
                        </Button>
                        <Button 
                          className="flex-1 gap-2"
                          onClick={() => requestAIHelp(task)}
                        >
                          <Bot className="w-4 h-4" />
                          Start AI-agent
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  )}
                  
                  {isCompleted && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 border-green-500/30 text-green-700"
                      disabled
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Fullført
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(task.id)}
                    className="gap-2"
                  >
                    {task.systemCount && `${task.systemCount} systemer`}
                    {task.processCount && `${task.processCount} prosesser`}
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedTasks.includes(task.id) ? "rotate-180" : ""}`} />
                  </Button>
                </div>
              </div>
              
              {expandedTasks.includes(task.id) && (
                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                  Detaljer om påvirkede systemer/prosesser vises her...
                </div>
              )}
            </Card>
          );
          })}
        </div>
          </>

        <PageHelpDrawer
          open={helpOpen}
          onOpenChange={setHelpOpen}
          icon={ClipboardListHelp}
          title="Hva er oppgaveoversikten?"
          description="Oppgaveoversikten samler alle handlinger som krever din oppmerksomhet — fra systemrevisjoner og risikovurderinger til godkjenninger og dokumentasjonskrav. Lara AI kan utføre mange oppgaver automatisk basert på autonominivået du har satt."
          itemsHeading="Hva kan du gjøre her?"
          items={[
            { icon: Zap, title: "La AI håndtere oppgaver", description: "Oppgaver innenfor ditt innstilte autonominivå kan utføres automatisk av Lara." },
            { icon: ClipboardListHelp, title: "Filtrer og prioriter", description: "Bruk filtrene for å fokusere på riktig område, type eller prioritet." },
            { icon: UsersHelp, title: "Tildel ansvar", description: "Se hvem som er ansvarlig og følg opp at oppgaver fullføres i tide." },
          ]}
          whyTitle="Hvorfor er dette viktig?"
          whyDescription="Systematisk oppgavehåndtering sikrer at ingenting faller mellom stolene. Ved å la AI håndtere rutineoppgaver kan du fokusere på det som krever menneskelig vurdering."
          stepsHeading="Kom i gang"
          steps={[
            { text: "Se gjennom oppgavene og filtrer etter prioritet" },
            { text: "La Lara håndtere oppgaver hun kan utføre automatisk" },
            { text: "Følg opp manuelt der det trengs menneskelig vurdering" },
          ]}
          laraSuggestion="Hjelp meg med å prioritere og håndtere oppgavene mine"
        />
        </div>
      </main>
    </div>
  );
}
