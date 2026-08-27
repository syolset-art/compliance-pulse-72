import { AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ATTESTATION_LABEL,
  FRESHNESS_LABEL,
  SOURCE_CLASS_LABEL,
  UNKNOWN_TEXT,
  formatPinDate,
  isHumanVerified,
  type Pin,
} from "@/lib/pin";
import { PinDetails } from "./PinDetails";


interface PinBadgeProps {
  pin?: Pin;
  /** Klikkbar (popover) eller ren visning med tooltip — bruk false inne i knapper. */
  interactive?: boolean;
  /** "xs" = ekstra liten for tette lister. */
  size?: "sm" | "xs";
  className?: string;
}

/** Lite rosett-ikon med en «i» inni. */
function RosetteInfo({ size = 16, className }: { size?: number; className?: string }) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const outer = s * 0.46;
  const inner = s * 0.34;
  const points: string[] = [];
  for (let i = 0; i < 24; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((i * 15 - 90) * Math.PI) / 180;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <polygon points={points.join(" ")} fill="currentColor" />
      <circle cx={cx} cy={cy - s * 0.08} r={s * 0.06} className="fill-background" />
      <rect
        x={cx - s * 0.04}
        y={cy - s * 0.02}
        width={s * 0.08}
        height={s * 0.22}
        rx={s * 0.02}
        className="fill-background"
      />
    </svg>
  );
}

function pinVisual(pin?: Pin) {
  if (!pin) {
    return {
      colorClass: "text-muted-foreground",
      label: "Ingen Pin",
      status: "Kilden er ikke deklarert.",
    };
  }
  if (pin.fallen) {
    return {
      colorClass: "text-warning",
      label: "Pin falt",
      status: "Innholdsversjonen er endret etter verifikasjon.",
    };
  }
  const human = isHumanVerified(pin);
  return {
    colorClass: human ? "text-success" : "text-warning",
    label: ATTESTATION_LABEL[pin.attestation.level],
    status: ATTESTATION_LABEL[pin.attestation.level],
  };
}

export function PinBadge({ pin, interactive = true, size = "sm", className }: PinBadgeProps) {
  const { colorClass, label, status } = pinVisual(pin);
  const verifiedBy = pin?.attestation.attestedBy;
  const verifiedAt = pin?.attestation.attestedAt;
  const sourceText = pin
    ? pin.source.sourceRef || SOURCE_CLASS_LABEL[pin.source.sourceClass]
    : UNKNOWN_TEXT;
  const checkedText = pin
    ? pin.freshness.checkedAt
      ? formatPinDate(pin.freshness.checkedAt)
      : FRESHNESS_LABEL[pin.freshness.flag]
    : UNKNOWN_TEXT;
  const a11yLabel = `${label}. Kilde: ${sourceText}. Sist kontrollert: ${checkedText}.`;
  const iconSize = size === "xs" ? 14 : 16;

  const visual = (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        size === "xs" ? "p-0.5" : "p-1",
        colorClass,
        className,
      )}
    >
      <RosetteInfo size={iconSize} />
    </span>
  );

  const hoverCard = (
    <>
      <p className={cn("text-xs font-medium", colorClass)}>{status}</p>
      {verifiedBy && (
        <p className="text-[11px] text-muted-foreground">
          Verifisert av {verifiedBy}
          {verifiedAt ? ` · ${formatPinDate(verifiedAt)}` : ""}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">Kilde: {sourceText}</p>
      <p className="text-[11px] text-muted-foreground">Sist kontrollert: {checkedText}</p>
      {pin?.fallen && (
        <p className="flex items-start gap-1 text-[11px] text-warning">
          <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
          Pin falt — merket gjelder ikke denne innholdsversjonen.
        </p>
      )}
      <p className="text-[10px] text-muted-foreground">
        Merket gjelder denne innholdsversjonen og sier ingenting om samsvar.
      </p>
    </>
  );

  if (!interactive || !pin) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span aria-label={a11yLabel}>{visual}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px] space-y-1">{hoverCard}</TooltipContent>
      </Tooltip>
    );
  }


  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${a11yLabel} Vis detaljer.`}
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          {visual}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[340px] max-h-[70vh] overflow-y-auto">
        <PinDetails pin={pin} />
      </PopoverContent>
    </Popover>
  );
}

