import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ATTESTATION_LABEL,
  PIN_LEVEL_CLASS,
  getFrameworkPin,
  pinTooltipLine,
  type Pin,
} from "@/lib/pin";
import { PinRosette } from "./PinRosette";
import { PinDetails } from "./PinDetails";

interface PinBadgeProps {
  pin?: Pin;
  /** Klikkbar (popover) eller ren visning med tooltip — bruk false inne i knapper. */
  interactive?: boolean;
  /** "xs" = kun rosett, for tette lister. */
  size?: "sm" | "xs";
  /** Tving pille eller kun ikon. Standard: pille (ikon når size="xs"). */
  variant?: "pill" | "icon";
  className?: string;
}

export function PinBadge({
  pin,
  interactive = true,
  size = "sm",
  variant,
  className,
}: PinBadgeProps) {
  // Alt produksjonssatt har alltid en Pin — fall tilbake til agentverifisert.
  const resolved: Pin = pin ?? getFrameworkPin("__default__");
  const level = resolved.attestation.level;
  const label = ATTESTATION_LABEL[level];
  const tooltipLine = pinTooltipLine(resolved);
  const a11yLabel = `Pin: ${label}. ${tooltipLine}.`;
  const asIcon = variant === "icon" || (variant !== "pill" && size === "xs");

  const visual = asIcon ? (
    <span className={cn("inline-flex items-center justify-center", className)}>
      <PinRosette level={level} className="h-3.5 w-3.5" />
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-xs font-medium",
        PIN_LEVEL_CLASS[level],
        className,
      )}
    >
      <PinRosette level={level} className="h-3.5 w-3.5" />
      {label}
    </span>
  );

  if (!interactive) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span aria-label={a11yLabel}>{visual}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltipLine}</TooltipContent>
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
              className="rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              {visual}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltipLine}</TooltipContent>
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
