import { useState } from "react";
import { Play, Sparkles, ChevronRight, BookOpen, Lightbulb, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageContext, DemoScenario } from "@/hooks/usePageContext";
import laraButterfly from "@/assets/lara-butterfly.png";

interface DemoAgentPanelProps {
  pageContext?: PageContext;
  onStartDemo: (scenarioId: string) => void;
  onAskQuestion: (question: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const iconMap = {
  play: Play,
  book: BookOpen,
  lightbulb: Lightbulb,
  target: Target,
  zap: Zap,
};

type IconType = keyof typeof iconMap;

// Map scenario IDs to icons
const scenarioIcons: Record<string, IconType> = {
  "getting-started": "play",
  "add-asset": "target",
  "gdpr-gap": "book",
  "compliance-report": "zap",
  "work-areas": "lightbulb",
};

// Extended scenario type for UI display with icon
interface DisplayScenario {
  id: string;
  title: string;
  description: string;
  icon: IconType;
  estimatedTime?: string;
}

// Default scenarios when no page-specific ones exist
const defaultScenarios: DisplayScenario[] = [
  {
    id: "getting-started",
    title: "Kom i gang med Mynder",
    description: "Lær grunnleggende navigasjon og oppsett",
    icon: "play",
    estimatedTime: "2 min"
  },
  {
    id: "add-asset",
    title: "Legg til din første eiendel",
    description: "Registrer et IT-system eller leverandør",
    icon: "target",
    estimatedTime: "3 min"
  },
  {
    id: "compliance-overview",
    title: "Forstå compliance-status",
    description: "Se hvordan du ligger an med GDPR og ISO",
    icon: "book",
    estimatedTime: "2 min"
  }
];

// Context-aware quick questions
const getQuickQuestions = (pageName?: string): string[] => {
  switch (pageName) {
    case "Dashboard":
      return [
        "Hva betyr compliance-scorene?",
        "Hvordan prioriterer jeg oppgaver?",
        "Forklar risikooversikten"
      ];
    case "Eiendeler":
      return [
        "Hva er forskjellen på asset-typene?",
        "Hvordan kobler jeg en eiendel til et arbeidsområde?",
        "Hvilke felt er obligatoriske?"
      ];
    case "Mine arbeidsområder":
      return [
        "Hvorfor trenger jeg arbeidsområder?",
        "Hvordan strukturerer jeg organisasjonen?",
        "Kan jeg flytte eiendeler mellom områder?"
      ];
    case "Behandlingsprotokoller":
      return [
        "Hva er en behandlingsprotokoll?",
        "Hvilke GDPR-krav gjelder her?",
        "Hvordan dokumenterer jeg behandlingsgrunnlag?"
      ];
    default:
      return [
        "Hva kan jeg gjøre her?",
        "Vis meg de viktigste funksjonene",
        "Hvordan kommer jeg i gang?"
      ];
  }
};

// Convert PageContext scenarios to DisplayScenarios
const toDisplayScenarios = (scenarios?: DemoScenario[]): DisplayScenario[] => {
  if (!scenarios || scenarios.length === 0) return defaultScenarios;
  
  return scenarios.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    icon: scenarioIcons[s.id] || "play",
    estimatedTime: s.steps ? `${s.steps.length} steg` : undefined
  }));
};

export function DemoAgentPanel({ 
  pageContext, 
  onStartDemo, 
  onAskQuestion, 
  isVisible, 
  onClose 
}: DemoAgentPanelProps) {
  const [hoveredScenario, setHoveredScenario] = useState<string | null>(null);

  // Get scenarios - use page-specific if available, otherwise defaults
  const scenarios = toDisplayScenarios(pageContext?.demoScenarios);
  const quickQuestions = getQuickQuestions(pageContext?.pageName);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-card z-10 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="relative">
          <img 
            src={laraButterfly} 
            alt="" 
            className="w-10 h-10"
            aria-hidden="true"
          />
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground flex items-center gap-1.5">
            Demo-agent
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </h3>
          <p className="text-xs text-muted-foreground">
            {pageContext?.pageName ? `Hjelp for ${pageContext.pageName}` : "Interaktiv veiledning"}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          Tilbake til chat
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Interactive Demos Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Play className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-medium text-foreground">Interaktive demoer</h4>
          </div>
          <div className="space-y-2">
            {scenarios.map((scenario) => {
              const Icon = iconMap[scenario.icon];
              const isHovered = hoveredScenario === scenario.id;
              
              return (
                <button
                  key={scenario.id}
                  onClick={() => {
                    onStartDemo(scenario.id);
                    onClose();
                  }}
                  onMouseEnter={() => setHoveredScenario(scenario.id)}
                  onMouseLeave={() => setHoveredScenario(null)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left group",
                    isHovered 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isHovered ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {scenario.title}
                      </span>
                      {scenario.estimatedTime && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {scenario.estimatedTime}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {scenario.description}
                    </p>
                  </div>
                  <ChevronRight className={cn(
                    "h-4 w-4 shrink-0 transition-transform mt-2.5",
                    isHovered ? "text-primary translate-x-0.5" : "text-muted-foreground"
                  )} />
                </button>
              );
            })}
          </div>
        </section>

        {/* Quick Questions Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-medium text-foreground">Vanlige spørsmål</h4>
          </div>
          <div className="space-y-1.5">
            {quickQuestions.map((question, i) => (
              <button
                key={i}
                onClick={() => {
                  onAskQuestion(question);
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors group"
              >
                <span className="flex-1">{question}</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </section>

        {/* Pro tip */}
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Pro-tips</p>
              <p className="text-xs text-muted-foreground">
                Du kan alltid spørre meg om hjelp ved å skrive "demo" eller "vis meg hvordan" i chatten. 
                Jeg tilpasser veiledningen til siden du er på.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
