import { X, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AISuggestionStatusPanelProps {
  isGenerating: boolean;
  isComplete: boolean;
  workAreaName: string;
  suggestionCount?: number;
  duration?: number;
  onClose: () => void;
}

export const AISuggestionStatusPanel = ({
  isGenerating,
  isComplete,
  workAreaName,
  suggestionCount = 0,
  duration = 0,
  onClose,
}: AISuggestionStatusPanelProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isGenerating) return;

    setElapsedTime(0);
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const truncatedName = workAreaName.length > 20 
    ? workAreaName.substring(0, 20) + "..." 
    : workAreaName;

  if (!isGenerating && !isComplete) return null;

  return (
    <Card
      className={cn(
        "fixed top-4 right-4 z-50 w-80 shadow-lg border animate-in slide-in-from-right-5 fade-in duration-300",
        "bg-card"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <span className="text-sm font-medium">AI-genereringsstatus</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-start gap-3">
          {isGenerating ? (
            <>
              <Badge 
                variant="outline" 
                className="bg-warning/20 text-warning border-warning/30 shrink-0"
              >
                PÅGÅR
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm truncate">
                    Genererer prosessforslag for {truncatedName}...
                  </span>
                </div>
                <span className="text-xs text-muted-foreground mt-1 block">
                  Varighet: {formatTime(elapsedTime)}
                </span>
              </div>
            </>
          ) : isComplete ? (
            <>
              <Badge 
                variant="outline" 
                className="bg-status-closed/20 text-status-closed border-status-closed/30 shrink-0 flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                FERDIG
              </Badge>
              <div className="flex-1 min-w-0">
                <span className="text-sm">
                  Prosessforslag for {truncatedName} ({suggestionCount})
                </span>
                <span className="text-xs text-muted-foreground mt-1 block">
                  Varighet: {formatTime(duration)}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
};
