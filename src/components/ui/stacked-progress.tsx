import * as React from "react";
import { cn } from "@/lib/utils";

interface StackedProgressProps {
  baselinePercent: number;
  enrichmentPercent: number;
  className?: string;
  height?: string;
}

export function StackedProgress({ baselinePercent, enrichmentPercent, className, height = "h-1.5" }: StackedProgressProps) {
  return (
    <div className={cn("w-full rounded-full bg-muted overflow-hidden flex", height, className)}>
      {baselinePercent > 0 && (
        <div
          className="h-full bg-muted-foreground/40 transition-all duration-500"
          style={{ width: `${baselinePercent}%` }}
        />
      )}
      {enrichmentPercent > 0 && (
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${enrichmentPercent}%` }}
        />
      )}
    </div>
  );
}
