import { useTranslation } from "react-i18next";
import { Sparkles, Info } from "lucide-react";
import { TIER_CONFIG, type TierLevel, type TierSignal } from "@/lib/evidenceTier";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  tier: TierLevel;
  signals?: TierSignal[];
  size?: "sm" | "md";
  className?: string;
}

/** Liten pille som viser tier + kort forklaring i popover. */
export function TierBadge({ tier, signals = [], size = "md", className }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const cfg = TIER_CONFIG[tier];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors",
            "bg-accent/30 hover:bg-accent/60 border-border text-foreground",
            size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
            className,
          )}
        >
          <Sparkles className={size === "sm" ? "h-3 w-3 text-primary" : "h-3.5 w-3.5 text-primary"} />
          <span>{isNb ? cfg.labelNb : cfg.labelEn}</span>
          <span className="text-muted-foreground tabular-nums">
            {cfg.weight.toFixed(2).replace(".", isNb ? "," : ".")}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 text-sm space-y-2">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              {isNb ? "Hvorfor denne vektingen?" : "Why this weight?"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isNb ? cfg.descriptionNb : cfg.descriptionEn}
            </p>
          </div>
        </div>
        {signals.length > 0 && (
          <div className="border-t pt-2 space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {isNb ? "Signaler funnet i dokumentet" : "Signals found in the document"}
            </p>
            <ul className="text-xs space-y-0.5">
              {signals.map((s) => (
                <li key={s.key} className="flex gap-1.5">
                  <span className="text-primary">·</span>
                  <span>{isNb ? s.labelNb : s.labelEn}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground border-t pt-2">
          {isNb
            ? "Vekting utledes automatisk av dokumenttype og signaler. Kan ikke velges."
            : "Weight is derived automatically from document type and signals. Not user-selectable."}
        </p>
      </PopoverContent>
    </Popover>
  );
}
