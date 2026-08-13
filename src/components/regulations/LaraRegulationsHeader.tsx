import { Sparkles, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  frameworks: number;
  analysed: number;
  confirmed: number;
  waitingYou: number;
  percent: number;
  onReview?: () => void;
  onEditFrameworks?: () => void;
  className?: string;
}

/** Agentisk topplinje: hva Lara har gjort, og hva som venter på deg. */
export function LaraRegulationsHeader({
  frameworks,
  analysed,
  confirmed,
  waitingYou,
  percent,
  onReview,
  onEditFrameworks,
  className,
}: Props) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
            Jeg har gått gjennom {frameworks} regelverk og {analysed} krav.{" "}
            {confirmed > 0 ? `${confirmed} krav er bekreftet automatisk` : "Ingen nye krav er bekreftet automatisk"}
            {waitingYou > 0 ? `, ${waitingYou} venter på deg.` : "."}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Modenhet <span className="font-semibold text-foreground">{percent}%</span>
            </span>
            <span>
              Bekreftet av meg <span className="font-semibold text-foreground">{confirmed}</span>
            </span>
            <span>
              Venter på deg <span className="font-semibold text-foreground">{waitingYou}</span>
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {waitingYou > 0 && onReview && (
            <Button size="sm" className="h-8 text-xs" onClick={onReview}>
              Se gjennom
            </Button>
          )}
          {onEditFrameworks && (
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={onEditFrameworks}
                    aria-label="Endre regelverk"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Endre hvilke regelverk som gjelder dere</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </section>
  );
}
