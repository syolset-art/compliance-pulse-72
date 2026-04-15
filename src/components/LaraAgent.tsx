import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Check, Server, Building, Building2, ChevronRight, RotateCcw, Scale, Inbox } from "lucide-react";
import laraButterfly from "@/assets/lara-butterfly.png";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { CompactCompanyOnboarding } from "@/components/onboarding/CompactCompanyOnboarding";
import { FrameworkAssessment } from "@/components/onboarding/FrameworkAssessment";
import confetti from "canvas-confetti";

interface LaraAgentProps {
  onOpenAssetDialog?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Server,
  Building,
  Scale
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
      colors: ['#007AFF', '#5AC8FA', '#34C759', '#fbbf24', '#FF9500']
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: ['#007AFF', '#5AC8FA', '#34C759', '#fbbf24', '#FF9500']
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
    colors: ['#007AFF', '#5AC8FA', '#34C759', '#fbbf24', '#FF9500']
  });

  frame();
};

export const LaraAgent = ({ onOpenAssetDialog, onToggleChat, isChatOpen = false }: LaraAgentProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showFrameworkForm, setShowFrameworkForm] = useState(false);
  const hasShownConfetti = useRef(false);
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);
  const { 
    steps, 
    completedCount, 
    totalCount, 
    percentComplete, 
    nextStep, 
    isFullyComplete,
    isLoading,
    refetch,
    notifyChange,
    resetOnboarding
  } = useOnboardingProgress();

  // Global inbox count
  const { data: globalInboxCount = 0 } = useQuery({
    queryKey: ["lara-inbox-global-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("lara_inbox")
        .select("*", { count: "exact", head: true })
        .in("status", ["new", "auto_matched"]);
      if (error) throw error;
      return count || 0;
    },
  });

  const remainingSteps = totalCount - completedCount;

  // Confetti disabled - was triggering on every page load

  const handleStepAction = (step: typeof steps[0]) => {
    if (step.isCompleted) return;

    switch (step.id) {
      case 'company-info':
        setShowCompanyForm(true);
        setShowFrameworkForm(false);
        break;
      case 'frameworks':
        setShowFrameworkForm(true);
        setShowCompanyForm(false);
        break;
      case 'assets':
        if (onOpenAssetDialog) {
          onOpenAssetDialog();
          setIsOpen(false);
        }
        break;
      case 'work-areas':
        navigate('/work-areas');
        setIsOpen(false);
        break;
    }
  };

  const handleCompanyFormComplete = () => {
    setShowCompanyForm(false);
    refetch();
    notifyChange();
  };

  const handleFrameworkFormComplete = () => {
    setShowFrameworkForm(false);
    refetch();
    notifyChange();
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
      {/* Floating Lara Button with Progress Ring - Hidden when chat is open */}
      <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 transition-silk ${isChatOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'}`}>
        {!isOpen && (
          <div className="relative flex items-end gap-2">
            {/* Inbox button */}
            <button
              onClick={() => navigate("/lara-inbox")}
              className="relative group flex items-center justify-center h-12 w-12 rounded-full bg-card border border-border shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              title="Lara Innboks"
            >
              <Inbox className="h-5 w-5 text-foreground/70 group-hover:text-primary transition-colors" />
              {globalInboxCount > 0 && (
                <Badge className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 text-[13px] bg-primary text-primary-foreground shadow-md">
                  {globalInboxCount}
                </Badge>
              )}
            </button>

            <button
              onClick={() => setIsOpen(true)}
              className="relative group animate-float-in"
            >
              {/* Glow ring behind butterfly */}
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-xl opacity-50 group-hover:opacity-75 transition-silk" />
              
              {/* Progress ring behind butterfly */}
              <svg 
                className="absolute -inset-1.5 sm:-inset-2 w-[76px] h-[76px] sm:w-24 sm:h-24 -rotate-90"
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
                className={`relative w-16 h-16 sm:w-20 sm:h-20 drop-shadow-2xl group-hover:scale-110 transition-silk ${
                  !isFullyComplete ? 'animate-pulse' : ''
                }`}
              />
              
              {/* Remaining steps badge */}
              {!isFullyComplete && (
                <Badge 
                  className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 shadow-lg animate-bounce"
                >
                  {remainingSteps} {t("chat.onboarding.remaining")}
                </Badge>
              )}
              
              {/* Completed badge */}
              {isFullyComplete && (
                <Badge 
                  className="absolute -top-2 -right-2 bg-success text-success-foreground text-xs px-2 shadow-lg"
                >
                  <Check className="h-3 w-3" />
                </Badge>
              )}
            </button>
          </div>
        )}

      {/* Lara Card - Larger when open with glassmorphism */}
        {isOpen && (
          <Card variant="glass" className={`shadow-2xl animate-scale-bounce border-primary/20 ${
            showCompanyForm ? 'w-[calc(100vw-2rem)] sm:w-[420px]' : 'w-[calc(100vw-2rem)] sm:w-96'
          } max-w-[420px]`}>
            <CardContent className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-gradient-mynder opacity-30 blur-sm" />
                    <img 
                      src={laraButterfly} 
                      alt="Lara" 
                      className="relative w-12 h-12 drop-shadow-lg"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-1.5">
                      Lara
                      <Sparkles className="w-4 h-4 text-primary" />
                    </h3>
                    <p className="text-xs text-muted-foreground">{t("chatPanel.aiAssistant")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Progress percentage */}
                  <span className="text-sm font-bold text-primary">{percentComplete}%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setIsOpen(false);
                      setShowCompanyForm(false);
                      setShowFrameworkForm(false);
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
                      {t("laraAgent.back")}
                    </Button>
                  </div>
                  <CompactCompanyOnboarding onComplete={handleCompanyFormComplete} />
                </div>
              ) : showFrameworkForm ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => setShowFrameworkForm(false)}
                    >
                      {t("laraAgent.back")}
                    </Button>
                  </div>
                  <FrameworkAssessment onComplete={handleFrameworkFormComplete} />
                </div>
              ) : (
                <>
                  {/* Welcome message */}
                  <div className="mb-4">
                    {isFullyComplete ? (
                      <p className="text-sm text-foreground">
                        {t("laraAgent.congratsComplete")}
                      </p>
                    ) : (
                      <p className="text-sm text-foreground">
                        {t("laraAgent.welcomeRemaining", { count: remainingSteps })}
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
                      {t("laraAgent.stepsCompleted", { completed: completedCount, total: totalCount })}
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
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-silk text-left ${
                            step.isCompleted
                              ? 'bg-success/10 border border-success/20'
                              : isNext
                                ? 'bg-primary/10 border-2 border-primary hover:bg-primary/20 hover:shadow-md'
                                : 'bg-muted/30 border border-border hover:bg-muted/50 hover:shadow-sm'
                          }`}
                        >
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 transition-silk ${
                            step.isCompleted
                              ? 'bg-success text-success-foreground'
                              : isNext
                                ? 'bg-primary text-primary-foreground shadow-lg'
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
                            <ChevronRight className={`h-4 w-4 shrink-0 transition-silk ${
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
                      variant="luxury"
                      className="w-full"
                    >
                      {nextStep.id === 'company-info' ? t("laraAgent.startSetup") : t("laraAgent.continueStep", { step: nextStep.title })}
                    </Button>
                  )}

                  {/* Open chat button when onboarding is complete */}
                  {isFullyComplete && onToggleChat && (
                    <Button 
                      onClick={() => {
                        setIsOpen(false);
                        onToggleChat();
                      }}
                      className="w-full"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t("laraAgent.openChat")}
                    </Button>
                  )}

                  {/* Reset onboarding button */}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onToggleChat?.();
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {t("laraAgent.doLater")}
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      onClick={async () => {
                        setIsResetting(true);
                        await resetOnboarding();
                        setIsResetting(false);
                      }}
                      disabled={isResetting}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
                      {isResetting ? t("laraAgent.resetting") : t("laraAgent.reset")}
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};
