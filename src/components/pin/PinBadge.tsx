import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ATTESTATION_LABEL,
  ATTESTATION_SUMMARY_TEXT,
  getFrameworkPin,
  pinTooltipLine,
  type Pin,
} from "@/lib/pin";
import { PinRosette } from "./PinRosette";
import { PinDetails, PinSummary, type PinDetailsView } from "./PinDetails";

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
  const [open, setOpen] = useState(false);
  const [detailsView, setDetailsView] = useState<PinDetailsView>("main");
  // Alt produksjonssatt har alltid en Pin — fall tilbake til agentverifisert.
  const resolved: Pin = pin ?? getFrameworkPin("__default__");
  const level = resolved.attestation.level;
  const label = ATTESTATION_LABEL[level];
  const a11yLabel = `Pin: ${label}. ${pinTooltipLine(resolved)}.`;

  const openDetails = (view: PinDetailsView) => {
    setDetailsView(view);
    setOpen(true);
  };

  // Kun rosett — ingen pille, ingen tekst.
  const visual = (
    <span className={cn("inline-flex items-center justify-center", className)}>
      <PinRosette level={level} className={size === "xs" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </span>
  );

  const tooltip = (
    <div className="w-[300px] space-y-2.5 p-1">
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-semibold">
          <PinRosette level={level} className="h-4 w-4" />
          {label}
        </div>
        <p className="text-xs leading-relaxed opacity-80">
          {ATTESTATION_SUMMARY_TEXT[level]}
        </p>
      </div>
      <PinSummary pin={resolved} />
      <div className="space-y-1 border-t border-border pt-2">
        <div className="flex flex-wrap gap-4 text-xs text-primary">
          <button
            type="button"
            onClick={() => openDetails("sources")}
            className="underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Kilder for {resolved.subject?.label ?? "regelverket"}
          </button>
          <button
            type="button"
            onClick={() => openDetails("quality")}
            className="underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Slik kvalitetssikrer vi
          </button>
        </div>
      </div>
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
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setDetailsView("main");
      }}
    >
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
        <TooltipContent side="bottom" className="pointer-events-auto">{tooltip}</TooltipContent>
      </Tooltip>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        collisionPadding={16}
        className="w-[360px] max-h-[70vh] overflow-y-auto"
      >
        <PinDetails key={`${detailsView}-${open}`} pin={resolved} initialView={detailsView} />
      </PopoverContent>
    </Popover>
  );
}
