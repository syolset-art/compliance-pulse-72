import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getControlAreaLabel, type ControlAreaKey } from "@/lib/controlAreas";
import { requiresConfirmation, severityWeightText } from "@/lib/deviationImpact";

interface Props {
  /** Antall krav som settes til null når avviket åpnes. */
  affectedRequirements?: number;
  /** Kontrollområder som berøres. */
  controlAreas?: ControlAreaKey[];
  severity?: string;
  source?: string;
  className?: string;
}

/**
 * Forklarer på generell basis hvordan et avvik påvirker scoren.
 * Brukes både ved registrering fra aktivitet og fra avviksregisteret.
 */
export function DeviationScoreImpactNote({
  affectedRequirements = 0,
  controlAreas = [],
  severity,
  source,
  className,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const needsConfirmation = requiresConfirmation(source);

  return (
    <div className={cn("rounded-lg border border-border bg-muted/30 p-3 space-y-2", className)}>
      <div className="flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <p className="text-xs text-foreground leading-relaxed">
            Et åpent avvik setter berørte krav til «ikke oppfylt» så lenge det står åpent.
            Dokumentasjonen beholdes, men teller ikke i scoren.
          </p>

          {(affectedRequirements > 0 || controlAreas.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {affectedRequirements > 0 && (
                <Badge variant="secondary" className="text-[11px] font-normal">
                  {affectedRequirements} krav settes til null
                </Badge>
              )}
              {controlAreas.map((a) => (
                <Badge key={a} variant="outline" className="text-[11px] font-normal">
                  {getControlAreaLabel(a, "nb")}
                </Badge>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
            {expanded ? "Skjul detaljer" : "Slik påvirker det scoren"}
          </button>

          {expanded && (
            <ul className="space-y-1 pt-0.5 text-[11px] text-muted-foreground leading-relaxed list-disc pl-4">
              <li>Berørte kontrollområder får redusert modenhet, som trekker ned samlet modenhet og regelverkene kravene tilhører.</li>
              <li>{severityWeightText(severity)}</li>
              <li>Når avviket lukkes, gjenopptar kravene sin opprinnelige status og scoren hentes inn igjen.</li>
              {needsConfirmation && (
                <li>Avvik meldt av leverandør eller oppdaget av agent må bekreftes av et menneske før kravene nulles.</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
