import { useState } from "react";
import { ChevronDown, Bot, Sparkles } from "lucide-react";
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
  }
];

export default function Tasks() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [aiStatusFilter, setAiStatusFilter] = useState<"all" | "ai-handling" | "requires-action" | "hybrid">("all");
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Mock autonomy levels from AI setup (in real app, fetch from storage/context)
  const currentAutonomyLevels = {
    system: 50,
    service: 50,
    admin: 25,
    process: 25
  };

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

  const aiHandlingCount = mockTasks.filter(canAIHandle).length;
  const requiresActionCount = mockTasks.filter(task => !canAIHandle(task)).length;
  const hybridCount = mockTasks.filter(task => task.aiAutonomyLevel >= 40 && task.aiAutonomyLevel <= 60).length;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Alle oppgaver</h1>
          <p className="text-muted-foreground">
            Oversikt over alle oppgaver og systemer som krever oppfølging
          </p>
        </div>

        {/* Overall compliance card */}
        <Card className="p-6 mb-6">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-bold text-primary">81%</span>
            <span className="text-lg text-muted-foreground">Samlet samsvar</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">System & prosesser</span>
                <span className="font-semibold text-primary">67%</span>
              </div>
              <Progress value={67} className="h-2" />
              <p className="text-xs text-muted-foreground">Risikostyring og sikkerhetstiltak</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Organisasjon & styring</span>
                <span className="font-semibold text-primary">97%</span>
              </div>
              <Progress value={97} className="h-2" />
              <p className="text-xs text-muted-foreground">Dokumentasjon, rutiner & kontroll</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Roller & tilgang</span>
                <span className="font-semibold text-primary">75%</span>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground">Nøkkelroller og systemansvar</p>
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
              Alle oppgaver
              <Badge variant="secondary" className="ml-1">{mockTasks.length}</Badge>
            </Button>
            <Button
              variant={aiStatusFilter === "ai-handling" ? "default" : "outline"}
              onClick={() => setAiStatusFilter("ai-handling")}
              className="gap-2"
            >
              <Bot className="w-4 h-4" />
              AI håndterer autonomt
              <Badge variant="secondary" className="ml-1">{aiHandlingCount}</Badge>
            </Button>
            <Button
              variant={aiStatusFilter === "requires-action" ? "default" : "outline"}
              onClick={() => setAiStatusFilter("requires-action")}
              className="gap-2"
            >
              Krever handling
              <Badge variant="secondary" className="ml-1">{requiresActionCount}</Badge>
            </Button>
            <Button
              variant={aiStatusFilter === "hybrid" ? "default" : "outline"}
              onClick={() => setAiStatusFilter("hybrid")}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Hybrid
              <Badge variant="secondary" className="ml-1">{hybridCount}</Badge>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-muted-foreground">Filtrer etter type:</span>
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
          <p className="text-sm text-muted-foreground">Viser {filteredTasks.length} oppgaver</p>
        </div>

        {/* Tasks list */}
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <Card key={task.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={task.type === "system" ? "default" : "secondary"}>
                      {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                    </Badge>
                    <Badge variant="destructive">
                      {task.priority === "høy" ? "Høy prioritet" : task.priority === "middels" ? "Middels prioritet" : "Lav prioritet"}
                    </Badge>
                    {canAIHandle(task) && (
                      <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-xs">AI kan hjelpe</span>
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">{task.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                  
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
                  <Dialog open={selectedTask?.id === task.id} onOpenChange={(open) => !open && setSelectedTask(null)}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => setSelectedTask(task)}
                      >
                        <Bot className="w-4 h-4" />
                        AI-hjelp
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
          ))}
        </div>
        </div>
      </main>
    </div>
  );
}
