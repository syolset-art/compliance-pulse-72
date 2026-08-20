import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LaraAvatar } from "@/components/asset-profile/LaraAvatar";
import { SEVERITY_DOT, splitByAutonomy, type NextStep } from "@/lib/vendorNextSteps";

interface Props {
  steps: NextStep[];
  onRunStep: (step: NextStep) => void;
  /** Beholdt for bakoverkompatibilitet — brukes ikke lenger som primærhandling. */
  onRunAllLara?: () => void;
  onShowAll?: () => void;
}

/**
 * Rolig beslutningskort: Lara har allerede håndtert alt med autonominivå
 * «automatisk». Brukeren ser kun ett punkt av gangen — det som faktisk
 * krever godkjenning eller menneskelig skjønn.
 */
export function VendorNextStepsCard({ steps, onRunStep, onShowAll }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const { autoHandled, needsApproval, needsDecision } = splitByAutonomy(steps);
  const pending = [...needsApproval, ...needsDecision];
  const active = pending[0];
  const rest = pending.length - (active ? 1 : 0);

  return (
    <Card className="p-5 flex flex-col gap-3">
      {/* 1 — statuslinje: hva Lara har gjort uten deg */}
      <button
        type="button"
        onClick={onShowAll}
        className="flex items-center gap-2 text-left group"
      >
        <LaraAvatar size={16} />
        <span className="text-[13px] text-foreground">
          {isNb
            ? `Lara har håndtert ${autoHandled.length} av ${steps.length} punkter`
            : `Lara handled ${autoHandled.length} of ${steps.length} items`}
        </span>
        <span className="text-[11px] text-primary underline-offset-4 group-hover:underline ml-1">
          {isNb ? "se logg" : "see log"}
        </span>
      </button>

      {/* 2 — én beslutning av gangen */}
      {!active ? (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-3 text-xs text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {isNb
            ? "Ingenting venter på deg — Lara overvåker leverandøren."
            : "Nothing waiting on you — Lara is monitoring this vendor."}
        </div>
      ) : (
        <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3">
          <div className="flex items-start gap-2.5">
            <span
              className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", SEVERITY_DOT[active.severity])}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-foreground truncate">
                  {isNb ? active.titleNb : active.titleEn}
                </p>
                {active.contextLabel && (
                  <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">
                    {active.contextLabel}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isNb ? active.reasonNb : active.reasonEn}
              </p>
            </div>
            <Button size="sm" className="h-7 text-xs shrink-0" onClick={() => onRunStep(active)}>
              {active.autonomy === "assisted"
                ? isNb
                  ? "Godkjenn"
                  : "Approve"
                : isNb
                  ? "Åpne"
                  : "Open"}
            </Button>
          </div>
        </div>
      )}

      {/* 3 — fotnote */}
      {rest > 0 && (
        <button
          type="button"
          onClick={onShowAll}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline self-start"
        >
          {isNb ? `${rest} flere venter på deg` : `${rest} more waiting on you`}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </Card>
  );
}
