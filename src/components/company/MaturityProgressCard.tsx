import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMaturityScore, getLevelLabel, LEVEL_THRESHOLDS, MaturityLevel } from "@/hooks/useMaturityScore";
import { TrendingUp, CheckCircle2, Circle, Lightbulb, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const levelColors: Record<MaturityLevel, string> = {
  beginner: "text-warning",
  developing: "text-warning",
  established: "text-primary",
  mature: "text-status-closed",
};

const levelBgColors: Record<MaturityLevel, string> = {
  beginner: "bg-warning",
  developing: "bg-warning",
  established: "bg-primary",
  mature: "bg-status-closed",
};

export function MaturityProgressCard() {
  const { data: maturity, isLoading } = useMaturityScore();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!maturity) return null;

  const levels: MaturityLevel[] = ["beginner", "developing", "established", "mature"];
  const currentLevelIndex = levels.indexOf(maturity.level);
  const initialLevelIndex = levels.indexOf(maturity.initialLevel);
  const pointsGained = maturity.currentScore - maturity.initialScore;

  // Calculate progress within level range
  const currentThreshold = LEVEL_THRESHOLDS[maturity.level];
  const nextLevelIndex = currentLevelIndex + 1;
  const nextThreshold = nextLevelIndex < levels.length 
    ? LEVEL_THRESHOLDS[levels[nextLevelIndex]] 
    : 100;
  const progressInLevel = ((maturity.currentScore - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Din compliance-modenhet
          </CardTitle>
          {pointsGained > 0 && (
            <span className="text-sm text-status-closed font-medium bg-status-closed/10 dark:bg-status-closed/20 px-2 py-1 rounded-full">
              +{pointsGained} poeng siden oppstart
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level Progress Line */}
        <div className="relative pt-6 pb-4">
          {/* Track */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500", levelBgColors[maturity.level])}
              style={{ width: `${Math.min(100, (currentLevelIndex / (levels.length - 1)) * 100 + (progressInLevel / levels.length))}%` }}
            />
          </div>
          
          {/* Level markers */}
          <div className="absolute top-0 left-0 right-0 flex justify-between">
            {levels.map((level, index) => {
              const isReached = index <= currentLevelIndex;
              const isInitial = index === initialLevelIndex;
              const isCurrent = index === currentLevelIndex;
              
              return (
                <div 
                  key={level} 
                  className="flex flex-col items-center"
                  style={{ width: index === 0 ? 'auto' : index === levels.length - 1 ? 'auto' : 'auto' }}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 transition-all",
                    isReached 
                      ? cn("border-transparent", levelBgColors[level])
                      : "border-muted-foreground/30 bg-background"
                  )}>
                    {isCurrent && (
                      <div className="w-full h-full rounded-full animate-pulse bg-white/50" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs mt-1 whitespace-nowrap",
                    isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                  )}>
                    {getLevelLabel(level)}
                  </span>
                  {isInitial && index !== currentLevelIndex && (
                    <span className="text-[13px] text-muted-foreground">↑ Start</span>
                  )}
                  {isCurrent && (
                    <span className="text-[13px] text-primary font-medium">↑ Nå</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Din poengsum</span>
          <span className="text-2xl font-bold text-foreground">{maturity.currentScore} poeng</span>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Regelverk aktivert", count: maturity.breakdown.frameworks.count, points: maturity.breakdown.frameworks.points },
            { label: "Oppgaver fullført", count: maturity.breakdown.tasks.count, points: maturity.breakdown.tasks.points },
            { label: "Systemer dokumentert", count: maturity.breakdown.systems.count, points: maturity.breakdown.systems.points },
            { label: "Prosesser kartlagt", count: maturity.breakdown.processes.count, points: maturity.breakdown.processes.points },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              {item.points > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-status-closed flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-muted-foreground">{item.count} {item.label.toLowerCase()}</span>
              {item.points > 0 && (
                <span className="text-status-closed text-xs ml-auto">+{item.points}</span>
              )}
            </div>
          ))}
        </div>

        {/* Next milestone suggestion */}
        {maturity.nextMilestone && (
          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Neste steg: {maturity.nextMilestone.description}</p>
              <p className="text-xs text-muted-foreground">Få +{maturity.nextMilestone.pointsToGain} poeng</p>
            </div>
            {maturity.nextMilestone.actionPath && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate(maturity.nextMilestone!.actionPath!)}
                className="flex-shrink-0"
              >
                {maturity.nextMilestone.action}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
