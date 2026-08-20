import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Sparkles, Plus, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { VendorFramework } from "@/lib/vendorFrameworkSuggestions";

interface Props {
  frameworks: VendorFramework[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}

/**
 * Regelverk, standarder og retningslinjer leverandøren skal etterleve.
 * Lovpålagte er foreslått av Lara; brukeren kan legge til flere selv.
 */
export function VendorFrameworkCard({ frameworks, onAdd, onRemove }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const scope = frameworks;

  const renderPill = (f: VendorFramework) => {
    /** Match med Laras initielle KI-vurdering (personvern, risiko og sikkerhet
     *  ut fra bransje) = grønn. Øvrige regelverk i scope vises lilla. */
    const laraMatch = !f.manual && !f.global;
    return (
    <TooltipProvider key={f.id} delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center rounded-full border text-[11px] font-medium",
              laraMatch
                ? "border-success/40 bg-success/5 text-success"
                : "border-primary/40 bg-primary/5 text-primary",
            )}
          >
            <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1">
              {f.label}
              {f.global && (
                <span className="text-[9px] uppercase tracking-wide opacity-70">
                  {isNb ? "Global" : "Global"}
                </span>
              )}
              {f.manual && !f.global && (
                <span className="text-[9px] uppercase tracking-wide opacity-70">
                  {isNb ? "Egen" : "Manual"}
                </span>
              )}
            </span>

            <button
              type="button"
              onClick={() => onRemove(f.id)}
              aria-label={isNb ? `Fjern ${f.label}` : `Remove ${f.label}`}
              className="pr-2 pl-0.5 py-1 opacity-60 hover:opacity-100"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">
          {isNb ? f.reasonNb : f.reasonEn}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <Card className="p-5 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {isNb
              ? "Regelverk, standarder og retningslinjer"
              : "Regulations, standards and guidelines"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isNb
              ? "Velg regelverk, standarder og retningslinjer leverandøren skal etterleve."
              : "Select the regulations, standards and guidelines the vendor should comply with."}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-recommend/30 bg-recommend/10 px-2 py-0.5 text-[11px] font-medium text-recommend shrink-0">
          <Sparkles className="h-3 w-3" />
          {isNb ? "Initiell KI-vurdering" : "Initial AI assessment"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {scope.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Scope
              <span className="ml-1.5 normal-case font-normal tracking-normal opacity-70">
                {isNb
                  ? "– alle regelverk denne leverandøren følges opp på"
                  : "– all frameworks this vendor is followed up on"}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-1.5">{scope.map(renderPill)}</div>
          </div>
        )}
        {frameworks.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {isNb
              ? "Ingen regelverk er valgt for denne leverandøren ennå."
              : "No frameworks selected for this vendor yet."}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline self-start"
      >
        <Plus className="h-3.5 w-3.5" />
        {isNb
          ? "Legg til regelverk, standard eller retningslinje"
          : "Add regulation, standard or guideline"}
      </button>
    </Card>
  );
}
