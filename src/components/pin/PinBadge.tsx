import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ATTESTATION_LABEL,
  ATTESTATION_METHOD_TEXT,
  PIN_ROW_LABEL,
  ATTESTATION_VERIFIER_TEXT,
  SOURCE_CLASS_DESCRIPTION,
  SOURCE_CLASS_LABEL,
  formatPinDate,
  formatPinRelativeDate,
  getFrameworkPin,
  pinTooltipLine,
  type Pin,
} from "@/lib/pin";
import { PinRosette } from "./PinRosette";
import { PinDetails } from "./PinDetails";

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <dt className="w-[110px] shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-foreground" title={value}>
        {value}
      </dd>
    </div>
  );
}

interface PinBadgeProps {
  pin?: Pin;
  /** Klikkbar (popover) eller ren visning med tooltip — bruk false inne i knapper. */
  interactive?: boolean;
  /** Størrelse på rosetten. */
  size?: "sm" | "xs";
  /** Beholdt for bakoverkompatibilitet — Pin vises alltid som ren rosett. */
  variant?: "pill" | "icon";
  className?: string;
}

export function PinBadge({
  pin,
  interactive = true,
  size = "sm",
  className,
}: PinBadgeProps) {
  // Alt produksjonssatt har alltid en Pin — fall tilbake til agentverifisert.
  const resolved: Pin = pin ?? getFrameworkPin("__default__");
  const level = resolved.attestation.level;
  const label = ATTESTATION_LABEL[level];
  const a11yLabel = `Pin: ${label}. ${pinTooltipLine(resolved)}.`;

  // Kun rosett — ingen pille, ingen tekst.
  const visual = (
    <span className={cn("inline-flex items-center justify-center", className)}>
      <PinRosette level={level} className={size === "xs" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </span>
  );

  const isAgent = level === "agent_verified";
  const att = resolved.attestation;

  const tooltip = (
    <div className="w-[320px] space-y-2 p-1">
      <div className="flex items-center gap-1.5 font-semibold">
        <PinRosette level={level} className="h-4 w-4" />
        {label}
      </div>
      <p className="text-xs opacity-90">
        {isAgent
          ? "Verifisert av agentis runtime-rutine."
          : "Verifisert av juridisk fagansvarlig."}
      </p>
      <dl className="space-y-1">
        {isAgent && att.agentAlias && (
          <TooltipRow label={PIN_ROW_LABEL.agent} value={`Regelverksagent · ${att.agentAlias}`} />
        )}
        {isAgent && att.agentId && (
          <TooltipRow label={PIN_ROW_LABEL.agentId} value={att.agentId} />
        )}
        {att.routineRef && <TooltipRow label={PIN_ROW_LABEL.routine} value={att.routineRef} />}
        <div className="flex gap-2 text-xs">
          <dt className="w-[110px] shrink-0 text-muted-foreground">Kilde</dt>
          <dd className="min-w-0 flex-1 truncate text-foreground">
            {SOURCE_CLASS_LABEL[resolved.source.sourceClass]}
          </dd>
          <span
            className="shrink-0 text-muted-foreground"
            title={SOURCE_CLASS_DESCRIPTION[resolved.source.sourceClass]}
          >
            <Info className="h-3.5 w-3.5" />
          </span>
        </div>
        <TooltipRow
          label="Sist kontrollert"
          value={formatPinRelativeDate(
            resolved.freshness.checkedAt ?? resolved.attestation.attestedAt,
          )}
        />
        {resolved.previousAttestation && (
          <TooltipRow
            label="Tidligere"
            value={`${ATTESTATION_LABEL[resolved.previousAttestation.level]} ${formatPinDate(
              resolved.previousAttestation.at,
            )}, gjaldt ${resolved.previousAttestation.unitVersion}`}
          />
        )}
      </dl>
    </div>
  );

  if (!interactive) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span aria-label={a11yLabel}>{visual}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`${a11yLabel} Vis detaljer.`}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              {visual}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltip}</TooltipContent>
      </Tooltip>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        collisionPadding={16}
        className="w-[360px] max-h-[70vh] overflow-y-auto"
      >
        <PinDetails pin={resolved} />
      </PopoverContent>
    </Popover>
  );
}
