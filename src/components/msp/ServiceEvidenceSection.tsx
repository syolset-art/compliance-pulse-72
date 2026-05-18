import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ServiceFrameworkMapping } from "@/lib/serviceCatalog";
import { getFrameworkTheme } from "@/lib/serviceFrameworkTheme";

interface Props {
  mappings: ServiceFrameworkMapping[];
  onConnect?: () => void;
  compact?: boolean;
}

const MAX_VISIBLE = 4;

export function ServiceEvidenceSection({ mappings, onConnect, compact }: Props) {
  if (mappings.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 flex items-center justify-between gap-2">
        <span className="text-[12px] text-muted-foreground">
          Lara har ikke koblet denne tjenesten til regelverk ennå.
        </span>
        {onConnect && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px] gap-1.5"
            onClick={onConnect}
          >
            <Pencil className="h-3 w-3" />
            Koble til regelverk
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", compact ? "pt-1" : "pt-1.5")}>
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
        Evidens på
      </span>
      <div className="space-y-1">
        {mappings.map((m) => (
          <FrameworkRow key={m.frameworkId} mapping={m} />
        ))}
      </div>
    </div>
  );
}

function FrameworkRow({ mapping }: { mapping: ServiceFrameworkMapping }) {
  const [expanded, setExpanded] = useState(false);
  const theme = getFrameworkTheme(mapping.frameworkId);
  const total = mapping.controlIds.length;
  const visible = expanded ? mapping.controlIds : mapping.controlIds.slice(0, MAX_VISIBLE);
  const hidden = total - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span
        className={cn(
          "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border shrink-0",
          theme.chip,
        )}
      >
        {mapping.frameworkLabel}
      </span>
      {visible.map((id) => (
        <span
          key={id}
          className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] bg-background border border-border text-foreground/80"
          title={`${mapping.frameworkLabel} ${id}`}
        >
          {id}
        </span>
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          +{hidden} flere
        </button>
      )}
    </div>
  );
}

export function totalControlCount(mappings: ServiceFrameworkMapping[]): number {
  return mappings.reduce((sum, m) => sum + m.controlIds.length, 0);
}

export function primaryFrameworkId(mappings: ServiceFrameworkMapping[]): string | undefined {
  if (mappings.length === 0) return undefined;
  // Velg det med flest kontrollpunkter, tie-break: første
  return [...mappings].sort((a, b) => b.controlIds.length - a.controlIds.length)[0].frameworkId;
}
