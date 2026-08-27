import { AlertTriangle, BadgeCheck, CircleHelp, Pin as PinIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ATTESTATION_LABEL,
  AUTHORITY_LABEL,
  SOURCE_CLASS_LABEL,
  attestationTone,
  type Pin,
} from "@/lib/pin";
import { PinDetails } from "./PinDetails";

interface PinBadgeProps {
  pin?: Pin;
  /** Klikkbar (popover) eller ren visning med tooltip — bruk false inne i knapper. */
  interactive?: boolean;
  /** "xs" = kun ikon, for tette lister. */
  size?: "sm" | "xs";
  className?: string;
}


/** Kompakt merke: ikon + tekstlabel (aldri farge alene). */
function badgeVisual(pin?: Pin) {
  if (!pin) {
    return {
      Icon: CircleHelp,
      label: "Ingen Pin",
      cls: "border-border bg-muted text-muted-foreground",
      hint: "Innholdet er ikke pinnet — kvaliteten er ikke deklarert.",
    };
  }
  if (pin.fallen) {
    return {
      Icon: AlertTriangle,
      label: "Pin falt",
      cls: "border-destructive/50 bg-destructive/10 text-destructive line-through decoration-destructive/60",
      hint: "Innholdet er endret etter pinning — Pin er ikke gyldig.",
    };
  }
  const tone = attestationTone(pin.attestation);
  if (tone === "good") {
    return {
      Icon: BadgeCheck,
      label: "Pin · attestert",
      cls: "border-success/40 bg-success/10 text-success",
      hint: `${SOURCE_CLASS_LABEL[pin.source.sourceClass]} · ${ATTESTATION_LABEL[pin.attestation.level]}`,
    };
  }
  return {
    Icon: PinIcon,
    label:
      pin.attestation.level === "not_attested" ? "Pin · ikke attestert" : "Pin · egenerklært",
    cls: "border-warning/40 bg-warning/10 text-warning",
    hint: `${SOURCE_CLASS_LABEL[pin.source.sourceClass]} · ${ATTESTATION_LABEL[pin.attestation.level]}`,
  };
}

export function PinBadge({ pin, interactive = true, size = "sm", className }: PinBadgeProps) {
  const { Icon, label, cls, hint } = badgeVisual(pin);
  const authority = pin ? AUTHORITY_LABEL[pin.authority.level] : "—";
  const a11yLabel = `${label}. ${hint} Bruksgrense: ${authority}.`;

  const visual = (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border font-medium",
        size === "xs" ? "gap-0 p-1 text-[10px]" : "gap-1 px-2 py-0.5 text-[11px]",
        cls,
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {size !== "xs" && <span className="truncate">{label}</span>}
    </span>
  );


  if (!interactive || !pin) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span aria-label={a11yLabel}>{visual}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px]">
          <p className="text-xs">{hint}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Bruksgrense: {authority}</p>
        </TooltipContent>
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
