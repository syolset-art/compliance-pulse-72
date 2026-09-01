import { AlertTriangle, BadgeCheck, Bot, HelpCircle, type LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  FRESHNESS_LABEL,
  PIN_STATE_LABEL,
  PIN_TONE_CLASS,
  UNKNOWN_TEXT,
  formatPinDate,
  pinState,
  type Pin,
  type PinState,
} from "@/lib/pin";
import { PinDetails } from "./PinDetails";

interface PinBadgeProps {
  pin?: Pin;
  /** Klikkbar (popover) eller ren visning med tooltip — bruk false inne i knapper. */
  interactive?: boolean;
  /** "xs" = kun ikon, for tette lister. */
  size?: "sm" | "xs";
  /** Tving pille eller kun ikon. Standard: pille (ikon når size="xs"). */
  variant?: "pill" | "icon";
  className?: string;
}

const STATE_ICON: Record<PinState, LucideIcon> = {
  verified: BadgeCheck,
  unverified: Bot,
  fallen: AlertTriangle,
  unknown: HelpCircle,
};

const STATE_ICON_CLASS: Record<PinState, string> = {
  verified: "text-pin-verified-fg",
  unverified: "text-pin-unverified-fg",
  fallen: "text-pin-fallen-fg",
  unknown: "text-pin-unknown-fg",
};

export function PinBadge({
  pin,
  interactive = true,
  size = "sm",
  variant,
  className,
}: PinBadgeProps) {
  const { state, tone } = pinState(pin);
  const label = PIN_STATE_LABEL[state];
  const Icon = STATE_ICON[state];

  const checkedText = pin
    ? pin.freshness.checkedAt
      ? formatPinDate(pin.freshness.checkedAt)
      : FRESHNESS_LABEL[pin.freshness.flag]
    : UNKNOWN_TEXT;

  const a11yLabel = `Pin: ${label}. Sist kontrollert ${checkedText}.`;
  const tooltipLine = `${label} · sist kontrollert ${checkedText}`;
  const asIcon = variant === "icon" || (variant !== "pill" && size === "xs");

  const visual = asIcon ? (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        STATE_ICON_CLASS[state],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-xs font-medium",
        PIN_TONE_CLASS[tone],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );

  if (!interactive || !pin) {
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
        <PinDetails pin={pin} />
      </PopoverContent>
    </Popover>
  );
}
