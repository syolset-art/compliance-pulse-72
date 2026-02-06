import { useState, useContext } from "react";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  Scale, 
  Server, 
  Building, 
  FileCheck, 
  Bot,
  ChevronRight,
  X,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import context directly to avoid throwing when not available
import { createContext } from "react";

// We need to access the context without throwing - create a safe hook
const GlobalChatContext = createContext<{
  openChatWithMessage: (message: string) => void;
} | undefined>(undefined);

// Re-export the context check
const useGlobalChatSafe = () => {
  // Try to use the real context from GlobalChatProvider
  try {
    // Dynamic import to avoid circular dependency issues
    const { useGlobalChat } = require("@/components/GlobalChatProvider");
    return useGlobalChat();
  } catch {
    return null;
  }
};

const stepIcons: Record<string, React.ElementType> = {
  'Building2': Building2,
  'Scale': Scale,
  'Server': Server,
  'Building': Building,
  'FileCheck': FileCheck,
  'Bot': Bot,
};

export function OnboardingProgressWidget() {
  const { 
    steps, 
    completedCount, 
    totalCount, 
    percentComplete, 
    nextStep, 
    isFullyComplete,
    isLoading 
  } = useOnboardingProgress();
  
  // Use safe context access - may be null if provider not ready
  const globalChat = useGlobalChatSafe();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if dismissed or fully complete
  if (isDismissed || isFullyComplete) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="mb-8 border-primary/20 bg-card/50 backdrop-blur-sm animate-pulse">
        <CardContent className="p-6">
          <div className="h-32 bg-muted/30 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const openChatWithMessage = globalChat?.openChatWithMessage;

  const handleOpenChat = () => {
    if (!openChatWithMessage) return;
    if (nextStep) {
      const messages: Record<string, string> = {
        'company-info': 'Jeg vil legge til selskapsinformasjon',
        'frameworks': 'Hjelp meg med å velge riktige regelverk',
        'assets': 'Jeg vil registrere systemer og eiendeler',
        'work-areas': 'Hjelp meg med å definere arbeidsområder'
      };
      openChatWithMessage(messages[nextStep.id] || 'Hjelp meg med onboarding');
    } else {
      openChatWithMessage('Hjelp meg med å komme i gang');
    }
  };

  const handleStepClick = (stepId: string) => {
    if (!openChatWithMessage) return;
    const messages: Record<string, string> = {
      'company-info': 'Jeg vil oppdatere selskapsinformasjonen',
      'frameworks': 'Hjelp meg med regelverk og krav',
      'assets': 'Jeg vil legge til flere eiendeler',
      'work-areas': 'Jeg vil administrere arbeidsområdene mine'
    };
    openChatWithMessage(messages[stepId] || 'Hjelp meg med onboarding');
  };

  const NextStepIcon = nextStep ? stepIcons[nextStep.icon] || Building2 : Building2;

  return (
    <Card className="mb-8 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Kom i gang med Mynder
                </h3>
                <p className="text-sm text-muted-foreground">
                  Fullfør disse stegene for å få mest mulig ut av plattformen
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-2">Din fremgang</p>
              <Progress 
                value={percentComplete} 
                className="h-2 bg-muted/50"
              />
            </div>
            <span className="text-sm font-medium text-primary whitespace-nowrap">
              {completedCount} av {totalCount} gjennomført
            </span>
          </div>
        </div>

        {/* Next Step Card */}
        {nextStep && (
          <div className="px-6 pb-4">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-primary">
                  Neste steg
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="text-primary hover:text-primary/80 p-0 h-auto"
                  onClick={handleOpenChat}
                >
                  Åpne i chat
                </Button>
              </div>
              
              <button
                onClick={() => handleStepClick(nextStep.id)}
                className="w-full flex items-center gap-4 text-left group"
              >
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                  <NextStepIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {nextStep.title}
                  </h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {nextStep.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* Step indicators */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Steg:</span>
            {steps.map((step, index) => {
              const StepIcon = stepIcons[step.icon] || Building2;
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    step.isCompleted
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : step.id === nextStep?.id
                      ? "bg-primary/10 text-foreground border border-primary/20"
                      : "bg-muted/50 text-muted-foreground border border-transparent hover:border-muted-foreground/20"
                  )}
                >
                  <span className={cn(
                    "flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold",
                    step.isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  )}>
                    {index + 1}
                  </span>
                  {step.title.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
