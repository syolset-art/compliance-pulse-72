import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, ArrowRight, ClipboardEdit, Eye, ShieldCheck } from "lucide-react";
import type { BaselineAreaProgress } from "@/hooks/useCustomerBaseline";

interface Props {
  areaProgress: BaselineAreaProgress[];
  totalAnswered: number;
  totalQuestions: number;
  activeFrameworkCount: number;
  onFillBaseline: () => void;
  onReviewBaseline: () => void;
  onGoToRegulations: () => void;
}

/**
 * Baseline-gate: partneren ser fremdrift på fire kontrollområder fra Trust Profile,
 * og kan fylle ut / se over baselinen på vegne av kunden før gap-analysen.
 */
export function BaselineReadinessCard({
  areaProgress,
  totalAnswered,
  totalQuestions,
  activeFrameworkCount,
  onFillBaseline,
  onReviewBaseline,
  onStartGapAnalysis,
  onGoToRegulations,
}: Props) {
  const completeness = totalQuestions === 0 ? 0 : totalAnswered / totalQuestions;
  const hasFramework = activeFrameworkCount > 0;
  const isReady = completeness >= 0.8 && hasFramework;
  const hasStarted = totalAnswered > 0;

  return (
    <Card className="p-4 sm:p-5 border-border space-y-4">
      <div className="flex items-start gap-3">
        <div
          className={
            "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 " +
            (isReady ? "bg-success/10" : hasStarted ? "bg-primary/10" : "bg-warning/10")
          }
        >
          {isReady ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : hasStarted ? (
            <ShieldCheck className="h-4 w-4 text-primary" />
          ) : (
            <AlertCircle className="h-4 w-4 text-warning" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {isReady ? "Baseline er klar" : hasStarted ? "Baseline er under arbeid" : "Baseline mangler"}
          </p>
          <p className="text-sm text-muted-foreground">
            {totalAnswered} av {totalQuestions} spørsmål besvart
            {" · "}
            {activeFrameworkCount} aktiverte regelverk
            {". "}
            Du kan fylle ut baselinen på vegne av kunden — eller se over det Lara allerede har foreslått.
          </p>
        </div>
      </div>

      {/* Område-fremdrift */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {areaProgress.map((area) => {
          const pct = area.total === 0 ? 0 : Math.round((area.answered / area.total) * 100);
          return (
            <div key={area.id} className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{area.title}</p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={
                      "h-full rounded-full " +
                      (pct >= 75 ? "bg-success" : pct >= 50 ? "bg-warning" : pct > 0 ? "bg-primary" : "bg-muted")
                    }
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                {area.answered}/{area.total}
              </span>
            </div>
          );
        })}
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={hasStarted ? "outline" : "default"}
          className="gap-1.5"
          onClick={onFillBaseline}
        >
          <ClipboardEdit className="h-3.5 w-3.5" />
          {hasStarted ? "Fortsett baseline" : "Fyll ut baseline"}
        </Button>

        {hasStarted && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onReviewBaseline}>
            <Eye className="h-3.5 w-3.5" />
            Se over baseline
          </Button>
        )}

        {hasFramework ? (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={isReady ? "default" : "secondary"}
                  className="gap-1.5"
                  onClick={onStartGapAnalysis}
                >
                  Kjør gap-analyse
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              {!isReady && (
                <TooltipContent>
                  <span className="text-xs">
                    Anbefalt: fyll ut baseline først for mer presis gap-analyse.
                  </span>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onGoToRegulations}>
            Gå til Regelverk
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </Card>
  );
}
