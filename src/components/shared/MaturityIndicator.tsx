import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getMaturityLevel,
  maturityBgClass,
  maturityExplanation,
  maturityLabelNb,
  maturitySoftClass,
  maturityTextClass,
} from "@/lib/maturityLevel";

interface MaturityIndicatorProps {
  score: number | null | undefined;
  /** inline = prikk + tekst, badge = pille, bar = pille + fremdriftsstripe */
  variant?: "inline" | "badge" | "bar";
  /** Vis info-ikon med forklaring av skalaen */
  showInfo?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function MaturityScaleExplainer({ score }: { score: number | null | undefined }) {
  const info = maturityExplanation(score);
  return (
    <div className="space-y-3 text-xs">
      <div>
        <p className="text-sm font-semibold text-foreground">Modenhet: {info.label}</p>
        <p className="mt-1 text-muted-foreground">{info.summary}</p>
      </div>
      <div className="space-y-1.5">
        {info.scale.map((row) => (
          <div
            key={row.level}
            className={cn(
              "flex items-center justify-between rounded-md px-2 py-1",
              row.level === info.level ? "bg-muted" : "",
            )}
          >
            <span className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", maturityBgClass(row.level === "high" ? 100 : row.level === "medium" ? 60 : 10))} />
              <span className={cn("font-medium", row.level === info.level ? "text-foreground" : "text-muted-foreground")}>
                {row.label}
              </span>
            </span>
            <span className="tabular-nums text-muted-foreground">{row.range}</span>
          </div>
        ))}
      </div>
      {info.nextStep && <p className="text-muted-foreground">{info.nextStep}</p>}
    </div>
  );
}

export function MaturityIndicator({
  score,
  variant = "inline",
  showInfo = false,
  size = "md",
  className,
}: MaturityIndicatorProps) {
  const level = getMaturityLevel(score);
  const label = maturityLabelNb(level);
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";

  const info = showInfo ? (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Slik beregnes modenhet"
          className="text-muted-foreground transition-colors hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <MaturityScaleExplainer score={score} />
      </PopoverContent>
    </Popover>
  ) : null;

  if (variant === "badge") {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium",
            textSize,
            maturitySoftClass(score),
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", maturityBgClass(score))} />
          {label}
        </span>
        {info}
      </span>
    );
  }

  if (variant === "bar") {
    const pct = Math.max(0, Math.min(100, typeof score === "number" ? score : 0));
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center gap-1.5">
          <span className={cn("font-semibold", textSize, maturityTextClass(score))}>{label}</span>
          {info}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full transition-all", maturityBgClass(score))} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", maturityBgClass(score))} />
      <span className={cn("font-semibold", textSize, maturityTextClass(score))}>{label}</span>
      {info}
    </span>
  );
}
