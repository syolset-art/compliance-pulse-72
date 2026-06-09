import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, ArrowRight, ClipboardEdit, Eye, ShieldCheck, Gift } from "lucide-react";
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
 * Baseline-gate: partneren ser fremdrift på de fem kanoniske kontrollområdene
 * fra Trust Profile, og kan fylle ut / se over baselinen på vegne av kunden.
 * GDPR-baselinen er alltid inkludert gratis så snart kunden er invitert inn,
 * så partneren kan komme i gang uten å aktivere flere regelverk først.
 */
export function BaselineReadinessCard({
  areaProgress,
  totalAnswered,
  totalQuestions,
  activeFrameworkCount,
  onFillBaseline,
  onReviewBaseline,
  onGoToRegulations,
}: Props) {
  const completeness = totalQuestions === 0 ? 0 : totalAnswered / totalQuestions;
  // GDPR-baseline alene er nok til å gjøre kunden "klar" — flere regelverk er valgfritt.
  const isReady = completeness >= 0.8;
  const hasStarted = totalAnswered > 0;
  // activeFrameworkCount inkluderer alltid GDPR (lagt til implisitt i MSPCustomerDetail).
  const additionalFrameworks = Math.max(0, activeFrameworkCount - 1);

  return (
    <TooltipProvider>
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
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">
                {isReady ? "Baseline er klar" : hasStarted ? "Baseline er under arbeid" : "Baseline mangler"}
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-success/10 text-success border-success/20 hover:bg-success/15 cursor-help"
                  >
                    <Gift className="h-3 w-3" />
                    GDPR inkludert gratis
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  GDPR-baselinen er alltid med uten kostnad så snart kunden er invitert inn.
                  Du kan fylle ut spørsmålene og aktivere kundens Trust Profile uten å kjøpe
                  flere regelverk først.
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalAnswered} av {totalQuestions} spørsmål besvart
              {additionalFrameworks > 0
                ? ` · ${additionalFrameworks} regelverk i tillegg til GDPR`
                : " · GDPR-baseline aktiv"}
              {". "}
              {activeFrameworkCount <= 1
                ? "Fyll ut GDPR-baselinen for å aktivere kundens Trust Profile — flere regelverk kan legges til etterpå."
                : "Du kan fylle ut baselinen på vegne av kunden — eller se over det Lara allerede har foreslått."}
            </p>
          </div>
        </div>

        {/* Område-fremdrift — 5 kanoniske kontrollområder */}
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
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            size="sm"
            variant={hasStarted ? "outline" : "default"}
            className="gap-1.5"
            onClick={onFillBaseline}
          >
            <ClipboardEdit className="h-3.5 w-3.5" />
            {hasStarted ? "Fortsett baseline" : "Fyll ut GDPR-baseline"}
          </Button>

          {hasStarted && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onReviewBaseline}>
              <Eye className="h-3.5 w-3.5" />
              Se over baseline
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={onGoToRegulations}
          >
            Legg til flere regelverk
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    </TooltipProvider>
  );
}

