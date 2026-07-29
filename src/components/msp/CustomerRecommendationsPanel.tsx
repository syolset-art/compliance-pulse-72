import { useMemo } from "react";
import { Check, Star, Sparkles, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { FrameworkRecommendation } from "@/lib/regulationRecommender";
import { matchServicesToFrameworks } from "@/lib/serviceMatcher";

interface Props {
  recommendations: FrameworkRecommendation[];
  /** IDs som partneren har bekreftet i denne økten (høy-confidence er alltid inkludert). */
  confirmed: string[];
  onToggleConfirm: (frameworkId: string) => void;
}

export function CustomerRecommendationsPanel({ recommendations, confirmed, onToggleConfirm }: Props) {
  const highs = recommendations.filter((r) => r.confidence === "high");
  const mediums = recommendations.filter((r) => r.confidence === "medium");

  const activeIds = useMemo(() => {
    const set = new Set(highs.map((r) => r.frameworkId));
    confirmed.forEach((id) => set.add(id));
    return Array.from(set);
  }, [highs, confirmed]);

  const services = useMemo(() => matchServicesToFrameworks(activeIds, undefined, 5), [activeIds]);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-5">
        {/* Auto-anvendte */}
        {highs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-success" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Gjelder for kunden
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {highs.map((r) => (
                <Tooltip key={r.frameworkId}>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/5 px-2.5 py-1 text-xs font-medium text-success-foreground/90">
                      <Check className="h-3 w-3" />
                      {r.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    {r.reason}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* Anbefalt — krever bekreftelse */}
        {mediums.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Anbefalt å vurdere
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  Klikk for å bekrefte at regelverket gjelder. Du kan alltid endre dette senere fra kundens profil.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mediums.map((r) => {
                const isOn = confirmed.includes(r.frameworkId);
                return (
                  <Tooltip key={r.frameworkId}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onToggleConfirm(r.frameworkId)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                          isOn
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-foreground/80 hover:border-primary/60 hover:bg-primary/5"
                        )}
                      >
                        {isOn ? <Check className="h-3 w-3" /> : <Star className="h-3 w-3" />}
                        {r.label}
                        {isOn && (
                          <X
                            className="h-3 w-3 opacity-60"
                            aria-label="Fjern"
                          />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      {r.reason}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}

        {/* Matchende tjenester */}
        {services.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-border">
            <div className="flex items-center gap-1.5 pt-3">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tjenester du sannsynligvis kan tilby
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {services.map((s) => (
                <Tooltip key={s.templateId}>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-foreground/80">
                      {s.name}
                      <span className="text-[10px] text-muted-foreground">
                        · {s.frameworks.length}
                      </span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    Dekker: {s.frameworks.map((f) => f.toUpperCase()).join(", ")}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {recommendations.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Lara fant ingen sikre regelverksmatch for denne kunden ennå. Du kan fylle ut compliance-kartleggingen fra kundens profil for å få mer presise anbefalinger.
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}
