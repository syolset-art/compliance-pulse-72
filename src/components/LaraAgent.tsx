import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Check, Server, Building, Users, Building2, ChevronRight } from "lucide-react";
import laraButterfly from "@/assets/lara-butterfly.png";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { CompactCompanyOnboarding } from "@/components/onboarding/CompactCompanyOnboarding";
import confetti from "canvas-confetti";

interface LaraAgentProps {
  onOpenSystemDialog?: () => void;
  onOpenRoleDialog?: () => void;
}

const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Server,
  Building,
  Users
};

const triggerConfetti = () => {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors: ['#7c3aed', '#a78bfa', '#c4b5fd', '#22c55e', '#fbbf24']
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: ['#7c3aed', '#a78bfa', '#c4b5fd', '#22c55e', '#fbbf24']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  // Initial burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#7c3aed', '#a78bfa', '#c4b5fd', '#22c55e', '#fbbf24']
  });

  frame();
};

export const LaraAgent = ({ onOpenSystemDialog, onOpenRoleDialog }: LaraAgentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const hasShownConfetti = useRef(false);
  const navigate = useNavigate();
  const { 
    steps, 
    completedCount, 
    totalCount, 
    percentComplete, 
    nextStep, 
    isFullyComplete,
    isLoading,
    refetch 
  } = useOnboardingProgress();

  const remainingSteps = totalCount - completedCount;

  // Trigger confetti when onboarding is fully complete
  useEffect(() => {
    if (isFullyComplete && !isLoading && !hasShownConfetti.current) {
      hasShownConfetti.current = true;
      triggerConfetti();
    }
  }, [isFullyComplete, isLoading]);

  const handleStepAction = (step: typeof steps[0]) => {
    if (step.isCompleted) return;

    switch (step.id) {
      case 'company-info':
        setShowCompanyForm(true);
        break;
      case 'systems':
        if (onOpenSystemDialog) {
          onOpenSystemDialog();
          setIsOpen(false);
        }
        break;
      case 'work-areas':
        navigate('/work-areas');
        setIsOpen(false);
        break;
      case 'roles':
        if (onOpenRoleDialog) {
          onOpenRoleDialog();
          setIsOpen(false);
        }
        break;
    }
  };

  const handleCompanyFormComplete = () => {
    setShowCompanyForm(false);
    refetch();
  };

  const getStepIcon = (iconName: string) => {
    const Icon = stepIcons[iconName] || Building2;
    return Icon;
  };

  // Calculate the circumference and offset for the progress ring
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentComplete / 100) * circumference;

  return (
    <>
      {/* Floating Lara Button with Progress Ring */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <div className="relative">
            <button
              onClick={() => setIsOpen(true)}
              className="relative group animate-fade-in"
            >
              {/* Progress ring behind butterfly */}
              <svg 
                className="absolute -inset-2 w-24 h-24 -rotate-90"
                viewBox="0 0 88 88"
              >
                {/* Background ring */}
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="4"
                />
                {/* Progress ring */}
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              
              <img 
                src={laraButterfly} 
                alt="Lara AI Agent" 
                className={`w-20 h-20 hover:scale-110 transition-transform duration-300 drop-shadow-lg ${
                  !isFullyComplete ? 'animate-pulse' : ''
                }`}
              />
              
              {/* Remaining steps badge */}
              {!isFullyComplete && (
                <Badge 
                  className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 animate-bounce"
                >
                  {remainingSteps} igjen
                </Badge>
              )}
              
              {/* Completed badge */}
              {isFullyComplete && (
                <Badge 
                  className="absolute -top-2 -right-2 bg-success text-success-foreground text-xs px-2"
                >
                  <Check className="h-3 w-3" />
                </Badge>
              )}
            </button>
          </div>
        )}

        {/* Lara Card */}
        {isOpen && (
          <Card className="w-80 shadow-2xl animate-scale-in border-primary/20">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img 
                    src={laraButterfly} 
                    alt="Lara" 
                    className="w-10 h-10"
                  />
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-1">
                      Lara
                      <Sparkles className="w-3 h-3 text-primary" />
                    </h3>
                    <p className="text-xs text-muted-foreground">Din AI-assistent</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Progress percentage */}
                  <span className="text-sm font-bold text-primary">{percentComplete}%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setIsOpen(false);
                      setShowCompanyForm(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Company Form View */}
              {showCompanyForm ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => setShowCompanyForm(false)}
                    >
                      ← Tilbake
                    </Button>
                  </div>
                  <CompactCompanyOnboarding onComplete={handleCompanyFormComplete} />
                </div>
              ) : (
                <>
                  {/* Welcome message */}
                  <div className="mb-4">
                    {isFullyComplete ? (
                      <p className="text-sm text-foreground">
                        🎉 Gratulerer! Du har fullført oppsettet. Utforsk dashbordet for å komme i gang.
                      </p>
                    ) : (
                      <p className="text-sm text-foreground">
                        👋 Hei! La oss fullføre oppsettet sammen. {remainingSteps} steg gjenstår.
                      </p>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                        style={{ width: `${percentComplete}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {completedCount} av {totalCount} steg fullført
                    </p>
                  </div>

                  {/* Steps list */}
                  <div className="space-y-2 mb-4">
                    {steps.map((step, index) => {
                      const Icon = getStepIcon(step.icon);
                      const isNext = nextStep?.id === step.id;
                      
                      return (
                        <button
                          key={step.id}
                          onClick={() => handleStepAction(step)}
                          disabled={step.isCompleted}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                            step.isCompleted
                              ? 'bg-success/10 border border-success/20'
                              : isNext
                                ? 'bg-primary/10 border-2 border-primary hover:bg-primary/20'
                                : 'bg-muted/30 border border-border hover:bg-muted/50'
                          }`}
                        >
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                            step.isCompleted
                              ? 'bg-success text-success-foreground'
                              : isNext
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                          }`}>
                            {step.isCompleted ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium ${
                              step.isCompleted ? 'text-muted-foreground' : 'text-foreground'
                            }`}>
                              {step.title}
                            </h4>
                            {isNext && (
                              <p className="text-xs text-muted-foreground truncate">
                                {step.description}
                              </p>
                            )}
                          </div>
                          
                          {!step.isCompleted && (
                            <ChevronRight className={`h-4 w-4 shrink-0 ${
                              isNext ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick action for next step */}
                  {nextStep && !isFullyComplete && (
                    <Button 
                      onClick={() => handleStepAction(nextStep)}
                      className="w-full"
                    >
                      {nextStep.id === 'company-info' ? 'Start oppsett' : `Fortsett: ${nextStep.title}`}
                    </Button>
                  )}

                  {/* Later button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center mt-3"
                  >
                    Gjør dette senere
                  </button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};
