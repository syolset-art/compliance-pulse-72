import { Wrench, Target, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { GuidanceLevel } from "@/utils/vendorGuidanceData";

const META: Record<GuidanceLevel, {
  Icon: typeof Wrench;
  nb: string; en: string;
  pill: string;
  tipNb: string; tipEn: string;
}> = {
  operasjonelt: {
    Icon: Wrench,
    nb: "Operasjonelt", en: "Operational",
    pill: "bg-muted/50 text-muted-foreground border-border",
    tipNb: "Daglig drift — løses raskt, lite analyse. F.eks. innhente et dokument.",
    tipEn: "Day-to-day work — quick to resolve, low analysis. E.g. fetch a document.",
  },
  taktisk: {
    Icon: Target,
    nb: "Taktisk", en: "Tactical",
    pill: "bg-muted/50 text-muted-foreground border-border",
    tipNb: "Krever oppfølging over uker — koordinering med leverandør og interne roller. F.eks. revidere DPA.",
    tipEn: "Multi-week follow-up — coordination with vendor and internal roles. E.g. revise a DPA.",
  },
  strategisk: {
    Icon: Compass,
    nb: "Strategisk", en: "Strategic",
    pill: "bg-muted/50 text-muted-foreground border-border",
    tipNb: "Påvirker risikobildet i organisasjonen — krever ledelsesbeslutning. F.eks. skifte leverandør.",
    tipEn: "Impacts organisational risk — requires leadership decision. E.g. switch vendor.",
  },
};

interface Props {
  level: GuidanceLevel;
  isNb?: boolean;
  size?: "sm" | "md";
}

export function LevelChip({ level, isNb = true, size = "sm" }: Props) {
  const m = META[level];
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-pill border font-medium cursor-help",
              size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
              m.pill
            )}
          >
            <m.Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
            {isNb ? m.nb : m.en}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px]">
          <p className="text-[11px] font-semibold mb-0.5">{isNb ? m.nb : m.en}</p>
          <p className="text-[11px]">{isNb ? m.tipNb : m.tipEn}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
