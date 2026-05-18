import { useState, useMemo } from "react";
import { Pencil, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ServiceFrameworkMapping } from "@/lib/serviceCatalog";
import { getFrameworkTheme } from "@/lib/serviceFrameworkTheme";

interface Props {
  mappings: ServiceFrameworkMapping[];
  onConnect?: () => void;
  compact?: boolean;
}

const MAX_VISIBLE = 4;

// Deterministisk Lara-forslag: 1-4 timer pr kontrollpunkt basert på id-hash
function suggestHours(frameworkId: string, controlId: string): number {
  const key = `${frameworkId}:${controlId}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return 1 + (h % 4); // 1, 2, 3 eller 4 timer
}

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

  const suggested = useMemo(() => {
    const map: Record<string, number> = {};
    mapping.controlIds.forEach((id) => {
      map[id] = suggestHours(mapping.frameworkId, id);
    });
    return map;
  }, [mapping.frameworkId, mapping.controlIds]);

  const [hours, setHours] = useState<Record<string, number>>(suggested);

  const total = mapping.controlIds.length;
  const visible = expanded ? mapping.controlIds : mapping.controlIds.slice(0, MAX_VISIBLE);
  const hidden = total - visible.length;
  const sumHours = mapping.controlIds.reduce((s, id) => s + (hours[id] ?? 0), 0);

  return (
    <div className="rounded-md border border-border bg-background/40 p-2 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border shrink-0",
            theme.chip,
          )}
        >
          {mapping.frameworkLabel}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {total} kontrollpunkt{total === 1 ? "" : "er"} · {sumHours}t totalt
        </span>
      </div>

      <ul className="divide-y divide-border/60">
        {visible.map((id) => {
          const isOverride = hours[id] !== suggested[id];
          return (
            <li
              key={id}
              className="flex items-center justify-between gap-2 py-1"
            >
              <span
                className="text-[11px] text-foreground/80 font-mono truncate"
                title={`${mapping.frameworkLabel} ${id}`}
              >
                {id}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {!isOverride && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                    title="Foreslått av Lara"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    Lara
                  </span>
                )}
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={hours[id] ?? 0}
                  onChange={(e) =>
                    setHours((prev) => ({
                      ...prev,
                      [id]: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="h-6 w-14 px-1.5 text-[11px] text-right"
                />
                <span className="text-[10px] text-muted-foreground w-3">t</span>
              </div>
            </li>
          );
        })}
      </ul>

      {total > MAX_VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Vis færre
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Vis {hidden} flere
            </>
          )}
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
