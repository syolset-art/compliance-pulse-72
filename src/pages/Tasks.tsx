import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronDown, Bot, Sparkles, Loader2, CheckCircle2, X, Shield, Lock } from "lucide-react";
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
}

const mockTasks: Task[] = [
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

export default function Tasks() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const domainFilter = searchParams.get("domain");
  
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [aiStatusFilter, setAiStatusFilter] = useState<"all" | "ai-handling" | "requires-action" | "hybrid">("all");
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [aiWorkingTasks, setAiWorkingTasks] = useState<Set<string>>(new Set());
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [overallCompliance, setOverallCompliance] = useState(81);

  // Mock autonomy levels from AI setup (in real app, fetch from storage/context)
  const currentAutonomyLevels = {
    system: 50,
    service: 50,
    admin: 25,
    process: 25
  };

  // Simulate AI working on tasks automatically
  useEffect(() => {
    const interval = setInterval(() => {
      // Find tasks that AI can handle and aren't completed
      const autoHandleTasks = mockTasks.filter(task => 
        canAIHandle(task) && !completedTasks.has(task.id) && !aiWorkingTasks.has(task.id)
      );

      if (autoHandleTasks.length > 0) {
        const randomTask = autoHandleTasks[Math.floor(Math.random() * autoHandleTasks.length)];
        setAiWorkingTasks(prev => new Set([...prev, randomTask.id]));
        setTaskProgress(prev => ({ ...prev, [randomTask.id]: 0 }));
        
        toast({
          title: "AI-agent startet",
          description: `Jobber med: "${randomTask.title}"`,
        });
      }
    }, 8000); // Start new task every 8 seconds

    return () => clearInterval(interval);
  }, [completedTasks, aiWorkingTasks]);

  // Simulate progress on working tasks
  useEffect(() => {
    const interval = setInterval(() => {
      setTaskProgress(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        aiWorkingTasks.forEach(taskId => {
          const currentProgress = updated[taskId] || 0;
          if (currentProgress < 100) {
            updated[taskId] = Math.min(100, currentProgress + Math.random() * 15 + 5);
            hasChanges = true;
          } else if (currentProgress >= 100) {
            // Task completed
            setTimeout(() => {
              setCompletedTasks(prev => new Set([...prev, taskId]));
              setAiWorkingTasks(prev => {
                const newSet = new Set(prev);
                newSet.delete(taskId);
                return newSet;
              });
              setOverallCompliance(prev => Math.min(100, prev + 2));
              
              const task = mockTasks.find(t => t.id === taskId);
              toast({
                title: "Oppgave fullført!",
                description: `"${task?.title}" er nå håndtert av AI-agenten`,
              });
            }, 500);
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1500); // Update progress every 1.5 seconds

    return () => clearInterval(interval);
  }, [aiWorkingTasks]);

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

  const filteredTasks = mockTasks.filter(task => {
    // Domain filter from URL
    if (domainFilter && domainFrameworkMapping[domainFilter]) {
      const relevantFrameworks = domainFrameworkMapping[domainFilter].frameworks;
      const hasRelevantFramework = task.relevantFor.some(framework => 
        relevantFrameworks.some(rf => framework.toLowerCase().includes(rf.toLowerCase()) || rf.toLowerCase().includes(framework.toLowerCase()))
      );
      if (!hasRelevantFramework) return false;
    }
    
    // AI status filter
    if (aiStatusFilter !== "all") {
      const aiCanHandle = canAIHandle(task);
      if (aiStatusFilter === "ai-handling" && !aiCanHandle) return false;
      if (aiStatusFilter === "requires-action" && aiCanHandle) return false;
      if (aiStatusFilter === "hybrid" && (task.aiAutonomyLevel < 40 || task.aiAutonomyLevel > 60)) return false;
    }
    
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
  });
  
  const clearDomainFilter = () => {
    navigate("/tasks");
  };
  
  const activeDomain = domainFilter ? domainFrameworkMapping[domainFilter] : null;

  const aiHandlingCount = mockTasks.filter(canAIHandle).length;
  const requiresActionCount = mockTasks.filter(task => !canAIHandle(task)).length;
  const hybridCount = mockTasks.filter(task => task.aiAutonomyLevel >= 40 && task.aiAutonomyLevel <= 60).length;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{t("tasks.title")}</h1>
            {activeDomain && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                {activeDomain.icon}
                <span className="text-sm font-medium text-primary">{activeDomain.name}</span>
                <button
                  onClick={clearDomainFilter}
                  className="ml-1 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            )}
          </div>
          <p className="text-muted-foreground">
            {activeDomain 
              ? `Viser oppgaver relatert til ${activeDomain.name}`
              : t("tasks.subtitle")}
          </p>
        </div>

        {/* AI Status Banner - Now shows specific task details */}
        {aiWorkingTasks.size > 0 && (
          <Card className="p-4 mb-6 bg-primary/5 border-primary/20 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="relative mt-1">
                <Bot className="w-8 h-8 text-primary" />
                <Loader2 className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-spin" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-foreground">{t("tasks.aiWorking")}</p>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-sm font-medium text-primary">{t("tasks.autonomousWork")}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {Array.from(aiWorkingTasks).map(taskId => {
                    const task = mockTasks.find(t => t.id === taskId);
                    const progress = taskProgress[taskId] || 0;
                    if (!task) return null;
                    return (
                      <div key={taskId} className="bg-background/50 rounded-lg p-3 border border-primary/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                            <span className="text-sm font-medium text-foreground">{task.title}</span>
                          </div>
                          <span className="text-sm font-semibold text-primary">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {progress < 30 ? "Analyserer oppgaven..." : 
                           progress < 60 ? "Henter og validerer data..." : 
                           progress < 90 ? "Utfører endringer..." : 
                           "Sluttfører og verifiserer..."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Overall compliance card */}
        <Card className="p-6 mb-6">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-bold text-primary transition-all duration-500">{overallCompliance}%</span>
            <span className="text-lg text-muted-foreground">{t("tasks.overallCompliance")}</span>
            {overallCompliance > 81 && (
              <span className="text-green-500 text-sm flex items-center gap-1 ml-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                +{overallCompliance - 81}%
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{t("tasks.systemsProcesses")}</span>
                <span className="font-semibold text-primary">67%</span>
              </div>
              <Progress value={67} className="h-2" />
              <p className="text-xs text-muted-foreground">{t("tasks.systemsProcessesDesc")}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{t("tasks.organizationGovernance")}</span>
                <span className="font-semibold text-primary">97%</span>
              </div>
              <Progress value={97} className="h-2" />
              <p className="text-xs text-muted-foreground">{t("tasks.organizationGovernanceDesc")}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{t("tasks.rolesAccess")}</span>
                <span className="font-semibold text-primary">75%</span>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground">{t("tasks.rolesAccessDesc")}</p>
            </div>
          </div>
        </Card>

        {/* AI Status Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant={aiStatusFilter === "all" ? "default" : "outline"}
              onClick={() => setAiStatusFilter("all")}
              className="gap-2"
            >
              {t("tasks.filters.all")}
              <Badge variant="secondary" className="ml-1">{mockTasks.length}</Badge>
            </Button>
            <Button
              variant={aiStatusFilter === "ai-handling" ? "default" : "outline"}
              onClick={() => setAiStatusFilter("ai-handling")}
              className="gap-2"
            >
              <Bot className="w-4 h-4" />
              {t("tasks.filters.aiHandling")}
              <Badge variant="secondary" className="ml-1">{aiHandlingCount}</Badge>
            </Button>
            <Button
              variant={aiStatusFilter === "requires-action" ? "default" : "outline"}
              onClick={() => setAiStatusFilter("requires-action")}
              className="gap-2"
            >
              {t("tasks.filters.requiresAction")}
              <Badge variant="secondary" className="ml-1">{requiresActionCount}</Badge>
            </Button>
            <Button
              variant={aiStatusFilter === "hybrid" ? "default" : "outline"}
              onClick={() => setAiStatusFilter("hybrid")}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {t("tasks.filters.hybrid")}
              <Badge variant="secondary" className="ml-1">{hybridCount}</Badge>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-muted-foreground">{t("tasks.filterBy")}</span>
            {["SYSTEM", "PROSESS", "PROTOKOLL", "TJENESTEOMRÅDE", "HØY PRIORITET", "MIDDELS PRIORITET", "LAV PRIORITET"].map(filter => (
              <Button
                key={filter}
                variant={selectedFilters.includes(filter) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter(filter)}
                className="text-xs"
              >
                {filter}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{t("tasks.showing", { count: filteredTasks.length })}</p>
        </div>

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
        </div>
      </main>
    </div>
  );
}
