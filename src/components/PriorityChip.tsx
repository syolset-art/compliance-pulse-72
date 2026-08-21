import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getPriorityMeta,
  isPriorityDeviation,
  priorityLabel,
  type PriorityKey,
} from "@/lib/derivedPriority";

interface PriorityChipProps {
  value: string | null | undefined;
  suggested?: string | null;
  source?: "lara" | "manual" | null;
  reason?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
  /** Vis kortnavn (f.eks. "Høy") i stedet for "P1 – Høy". */
  short?: boolean;
  /** Overstyrte visningsnavn per nivå (brukes av leverandørmodulen). */
  labelOverrides?: Partial<Record<PriorityKey, string>>;
}

export function PriorityChip({
  value,
  suggested,
  source,
  reason,
  updatedBy,
  updatedAt,
  size = "sm",
  showIcon = true,
  className,
  short = false,
  labelOverrides,
}: PriorityChipProps) {
  const meta = getPriorityMeta(value);
  if (!meta) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground",
          className,
        )}
      >
        Ikke satt
      </span>
    );
  }

  const deviation = isPriorityDeviation(value, suggested);
  const override = labelOverrides?.[meta.key];
  const label = override
    ? short
      ? override
      : `${meta.key} – ${override}`
    : short
      ? meta.shortNb
      : meta.labelNb;
  const Icon = source === "manual" ? User : Sparkles;

  const chip = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        meta.pillClass,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className,
      )}
    >
      {showIcon && <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5", "opacity-70")} />}
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} aria-hidden />
      {label}
      {deviation && (
        <span
          className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-warning"
          aria-label="Avvik fra Laras forslag"
        />
      )}
    </span>
  );

  const hasTooltip = source || reason || suggested || updatedBy;
  if (!hasTooltip) return chip;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex">{chip}</button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs space-y-1.5 text-xs">
          <div className="font-semibold">{label}</div>
          {suggested && (
            <div className="text-muted-foreground">
              Laras forslag: <span className="font-medium text-foreground">{priorityLabel(suggested)}</span>
              {deviation && <span className="ml-1 text-warning">(avvik)</span>}
            </div>
          )}
          {source === "manual" && (
            <div className="text-muted-foreground">Overstyrt manuelt</div>
          )}
          {source === "lara" && (
            <div className="text-muted-foreground">Satt av Lara</div>
          )}
          {reason && (
            <div className="border-t border-border pt-1.5">
              <span className="text-muted-foreground">Begrunnelse:</span> {reason}
            </div>
          )}
          {(updatedBy || updatedAt) && (
            <div className="text-muted-foreground">
              {updatedBy ? `Endret av ${updatedBy}` : "Endret"}
              {updatedAt && ` • ${new Date(updatedAt).toLocaleDateString("nb-NO")}`}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export type { PriorityKey };
