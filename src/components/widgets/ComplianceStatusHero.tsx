import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "foundation", label: "Foundation", min: 0, description: "Basic governance, scope and visibility established" },
  { key: "implementation", label: "Implementation", min: 20, description: "Policies, controls and risk management in place" },
  { key: "operation", label: "Operation", min: 50, description: "Controls running in daily operations" },
  { key: "audit", label: "Internal Audit", min: 75, description: "Management system evaluated and improved" },
  { key: "certification", label: "Certification", min: 90, description: "Ready for external audit" },
];

interface Props {
  companyName?: string | null;
}

export function ComplianceStatusHero({ companyName }: Props) {
  const navigate = useNavigate();
  const { stats } = useComplianceRequirements({});
  const score = stats.progressPercent;
  const assessed = stats.overallScore?.assessed ?? 0;
  const total = stats.overallScore?.total ?? 0;

  const currentStage = useMemo(() => {
    return [...STAGES].reverse().find((s) => score >= s.min) || STAGES[0];
  }, [score]);

  const currentIndex = STAGES.findIndex((s) => s.key === currentStage.key);
  const nextStage = STAGES[currentIndex + 1];

  // How far within the current stage (for sub-progress)
  const stageProgress = useMemo(() => {
    const nextMin = nextStage?.min ?? 100;
    const range = nextMin - currentStage.min;
    if (range === 0) return 100;
    return Math.min(100, Math.round(((score - currentStage.min) / range) * 100));
  }, [score, currentStage, nextStage]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
      <CardContent className="p-6">
        {/* Top: Score + Stage side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Security Maturity score */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Security Maturity
            </p>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-bold text-foreground">{score}%</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Based on implemented security and governance controls.
            </p>
            <Progress value={score} className="h-2.5 mb-4" />
            <Button
              variant="link"
              size="sm"
              className="text-xs text-primary p-0 h-auto"
              onClick={() => navigate("/resources?tab=methodology")}
            >
              View maturity details <ArrowRight className="h-3 w-3 ml-1 inline" />
            </Button>
          </div>

          {/* Right: Current maturity stage + next step */}
          <div className="lg:border-l lg:border-border lg:pl-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Maturity stage
            </p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-lg font-bold text-foreground">{currentStage.label}</span>
              <Badge variant="outline" className="text-xs">Stage {currentIndex + 1} of {STAGES.length}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{currentStage.description}</p>

            {/* Stage progress dots */}
            <div className="flex items-center gap-1.5 mb-4">
              {STAGES.map((stage, i) => (
                <div key={stage.key} className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "flex items-center justify-center w-7 h-7 rounded-full border-2 transition-colors",
                      i < currentIndex
                        ? "bg-primary border-primary text-primary-foreground"
                        : i === currentIndex
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    {i < currentIndex ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    )}
                  </div>
                  {i < STAGES.length - 1 && (
                    <div
                      className={cn(
                        "w-4 sm:w-6 h-0.5 rounded-full",
                        i < currentIndex ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Next milestone */}
            {nextStage ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Next milestone
                  </p>
                  <span className="text-xs text-muted-foreground">{stageProgress}% there</span>
                </div>
                <p className="text-sm font-medium text-foreground">{nextStage.label}</p>
                <p className="text-xs text-muted-foreground mb-2">{nextStage.description}</p>
                <Progress value={stageProgress} className="h-1.5" />
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  🎉 Ready for certification
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
