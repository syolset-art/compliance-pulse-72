import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, CheckCircle2, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { LaraAvatar } from "@/components/asset-profile/LaraAvatar";
import { SEVERITY_DOT, type NextStep } from "@/lib/vendorNextSteps";

interface Props {
  steps: NextStep[];
  onRunStep: (step: NextStep) => void;
  onRunAllLara: () => void;
  onShowAll?: () => void;
}

/**
 * Neste steg — anbefalte tiltak for leverandøren.
 * Viser hva som må gjøres videre og hvem som kan gjøre det (Lara eller brukeren).
 */
export function VendorNextStepsCard({ steps, onRunStep, onRunAllLara, onShowAll }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const laraCount = steps.filter((s) => s.owner === "lara").length;
  const visible = steps.slice(0, 6);
  const rest = steps.length - visible.length;

  return (
    <Card className="p-5 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {isNb ? "Anbefalte tiltak" : "Recommended actions"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {steps.length === 0
              ? isNb
                ? "Ingenting utestående — Lara overvåker leverandøren."
                : "Nothing outstanding — Lara is monitoring this vendor."
              : isNb
                ? `${steps.length} tiltak — Lara kan utføre ${laraCount} av dem.`
                : `${steps.length} actions — Lara can handle ${laraCount} of them.`}
          </p>
        </div>
        {laraCount > 0 && (
          <Button size="sm" className="h-7 text-xs shrink-0 gap-1.5" onClick={onRunAllLara}>
            <Sparkles className="h-3 w-3" />
            {isNb ? "Kjør Laras forslag" : "Run Lara's suggestions"}
          </Button>
        )}
      </div>

      <div className="mt-4 flex-1 space-y-1.5">
        {steps.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-3 text-xs text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {isNb ? "Alt nødvendig er registrert." : "Everything required is registered."}
          </div>
        )}

        {visible.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onRunStep(step)}
            className="group w-full text-left rounded-lg border border-border/70 bg-card px-3 py-2.5 hover:border-primary/40 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <span
                className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", SEVERITY_DOT[step.severity])}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-foreground truncate">
                    {isNb ? step.titleNb : step.titleEn}
                  </p>
                  {step.contextLabel && (
                    <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">
                      {step.contextLabel}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  {isNb ? step.reasonNb : step.reasonEn}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  {step.owner === "lara" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-recommend/30 bg-recommend/10 px-1.5 py-0.5 text-[10px] font-medium text-recommend">
                      <LaraAvatar size="xs" />
                      {isNb ? "Lara kan gjøre dette" : "Lara can do this"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <UserRound className="h-2.5 w-2.5" />
                      {isNb ? "Krever din beslutning" : "Needs your decision"}
                    </span>
                  )}
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    {step.owner === "lara"
                      ? isNb
                        ? "La Lara gjøre det"
                        : "Let Lara do it"
                      : isNb
                        ? "Åpne"
                        : "Open"}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {(rest > 0 || onShowAll) && (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline self-start"
        >
          {rest > 0
            ? isNb
              ? `Se alle tiltak (${steps.length})`
              : `See all actions (${steps.length})`
            : isNb
              ? "Se alle tiltak"
              : "See all actions"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </Card>
  );
}
