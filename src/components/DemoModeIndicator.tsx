import { X, Play, Pause, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDemoSyncOptional } from "@/contexts/DemoSyncContext";
import { cn } from "@/lib/utils";

interface DemoModeIndicatorProps {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  narration?: string | null;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onSkip?: () => void;
}

export function DemoModeIndicator({
  isRunning,
  currentStep,
  totalSteps,
  narration,
  isPaused,
  onPause,
  onResume,
  onStop,
  onSkip,
}: DemoModeIndicatorProps) {
  const demoSync = useDemoSyncOptional();
  
  if (!isRunning && demoSync?.demoMode !== "auto-demo") {
    return null;
  }

  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-primary text-primary-foreground px-4 py-3 rounded-xl shadow-lg flex items-center gap-4 min-w-[300px]">
        {/* Demo badge */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
          <span className="text-sm font-semibold uppercase tracking-wide">Demo</span>
        </div>
        
        {/* Narration or progress */}
        <div className="flex-1 min-w-0">
          {narration ? (
            <p className="text-sm truncate">{narration}</p>
          ) : (
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-1.5 flex-1 bg-primary-foreground/20" />
              <span className="text-xs">
                {currentStep + 1}/{totalSteps}
              </span>
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-1">
          {onPause && onResume && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={isPaused ? onResume : onPause}
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {onSkip && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={onSkip}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          )}
          
          {onStop && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={onStop}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Subtitle for demo mode info */}
      <p className="text-center text-xs text-muted-foreground mt-1.5">
        Ingen data lagres i demo-modus
      </p>
    </div>
  );
}

// Simple banner for conversational mode
export function ConversationalModeIndicator({ onClose }: { onClose?: () => void }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-accent border border-primary/20 px-4 py-2 rounded-lg shadow-md flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-medium text-foreground">Lara hjelper deg</span>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
