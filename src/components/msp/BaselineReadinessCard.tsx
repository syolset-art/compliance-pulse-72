import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, ArrowRight, ClipboardEdit, Eye, ShieldCheck, Sparkles, Info, Loader2, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { BaselineAreaProgress } from "@/hooks/useCustomerBaseline";

interface Props {
  areaProgress: BaselineAreaProgress[];
  totalAnswered: number;
  totalQuestions: number;
  onFillBaseline: () => void;
  onReviewBaseline: () => void;
  onGoToRegulations: () => void;
  onLaraSuggest?: () => Promise<void> | void;
  isLaraSuggesting?: boolean;
}

/**
 * Baseline-gate: partneren ser fremdrift på de fem kanoniske kontrollområdene
 * fra Trust Profile, og kan fylle ut / se over baselinen på vegne av kunden.
 * GDPR-baselinen er alltid inkludert gratis så snart kunden er invitert inn,
 * så partneren kan komme i gang uten å aktivere flere regelverk først.
 *
 * Tre nivåer av autonomi (jf. AI-filosofien):
 *  - Automatisk: "La Lara fylle ut" — Lara foreslår alle svar, partner bekrefter
 *  - Assistert:  "Fortsett baseline" — Lara foreslår per spørsmål, partner svarer
 *  - Manuell:    Partner fyller ut hvert spørsmål selv
 */
export function BaselineReadinessCard({
  areaProgress,
  totalAnswered,
  totalQuestions,
  onFillBaseline,
  onReviewBaseline,
  onGoToRegulations,
  onLaraSuggest,
  isLaraSuggesting = false,
}: Props) {
  const [explainerOpen, setExplainerOpen] = useState(totalAnswered === 0);
  const completeness = totalQuestions === 0 ? 0 : totalAnswered / totalQuestions;
  const isReady = completeness >= 0.8;
  const hasStarted = totalAnswered > 0;

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
            <p className="text-sm font-semibold text-foreground">
              {isReady ? "Baseline er klar" : hasStarted ? "Baseline er under arbeid" : "Baseline mangler"}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalAnswered} av {totalQuestions} spørsmål er besvart.{" "}
              {hasStarted
                ? "Du kan fylle ut baselinen på vegne av kunden — eller se over det Lara allerede har foreslått."
                : "Lara kan foreslå svarene automatisk — du bekrefter og fullfører."}
            </p>
          </div>
        </div>

        {/* Hva er baseline? — kollapsibel forklaring */}
        <Collapsible open={explainerOpen} onOpenChange={setExplainerOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Info className="h-3.5 w-3.5" />
              Hva er baseline?
              <ChevronDown
                className={"h-3.5 w-3.5 transition-transform " + (explainerOpen ? "rotate-180" : "")}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-foreground space-y-2">
              <p>
                <span className="font-medium">Baseline</span> er kundens utgangspunkt — en
                kort kartlegging av om de mest sentrale GDPR- og sikkerhetstiltakene er på
                plass i dag. Den består av spørsmål fordelt på fem kontrollområder
                (styring, drift, identitet, personvern og tredjepart).
              </p>
              <p className="text-muted-foreground">
                Når baselinen er besvart vet både du og kunden hvor de står, hvilke gap som
                finnes, og hva Lara skal hjelpe til med å løse først.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Område-fremdrift — 5 kanoniske kontrollområder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {areaProgress.map((area, idx) => {
            const pct = area.total === 0 ? 0 : Math.round((area.answered / area.total) * 100);
            const isLastOdd = idx === areaProgress.length - 1 && areaProgress.length % 2 === 1;
            return (
              <div key={area.id} className={`flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 ${isLastOdd ? "sm:col-span-2" : ""}`}>
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

        {/* CTAs — tre nivåer av autonomi */}
        <div className="flex flex-wrap gap-2 items-center">
          {onLaraSuggest && !isReady && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={hasStarted ? "outline" : "default"}
                  className="gap-1.5"
                  onClick={() => void onLaraSuggest()}
                  disabled={isLaraSuggesting}
                >
                  {isLaraSuggesting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  La Lara fylle ut
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                Lara foreslår et konservativt utgangspunkt for alle spørsmålene basert på
                hva som er typisk for kunden. Du gjennomgår og bekrefter hvert svar etterpå.
              </TooltipContent>
            </Tooltip>
          )}

          <Button
            size="sm"
            variant={hasStarted || onLaraSuggest ? "outline" : "default"}
            className="gap-1.5"
            onClick={onFillBaseline}
          >
            <ClipboardEdit className="h-3.5 w-3.5" />
            {hasStarted ? "Fortsett baseline" : "Fyll ut manuelt"}
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
