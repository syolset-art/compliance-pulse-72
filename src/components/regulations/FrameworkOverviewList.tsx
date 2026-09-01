import { ChevronRight, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { staggerEntranceClass } from "@/lib/animation";
import { getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
import type { FrameworkAgentStats } from "@/lib/regulationsApprovalQueue";

interface Props {
  frameworks: Framework[];
  getStats: (frameworkId: string) => FrameworkAgentStats;
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

function barColor(percent: number) {
  if (percent >= 75) return "bg-success";
  if (percent >= 50) return "bg-warning";
  return "bg-destructive";
}

/** Rolig liste over aktive regelverk med modenhet og agent-status. */
export function FrameworkOverviewList({ frameworks, getStats, selectedId, onSelect, className }: Props) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      {frameworks.map((fw, i) => {
        const stats = getStats(fw.id);
        const category = getCategoryById(fw.category);
        const CategoryIcon = category?.icon;
        const active = selectedId === fw.id;
        return (
          <button
            key={fw.id}
            type="button"
            onClick={() => onSelect(fw.id)}
            aria-current={active}
            className={cn(
              "flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/40",
              active && "bg-muted/60",
              staggerEntranceClass(Math.min(i + 1, 6)),
            )}
          >
            {CategoryIcon && <CategoryIcon className="h-4 w-4 shrink-0 text-muted-foreground" />}

            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{fw.name}</span>
              </span>
              <span className="mt-1 flex items-center gap-2">
                <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <span
                    className={cn("block h-full rounded-full transition-all", barColor(stats.percent))}
                    style={{ width: `${stats.percent}%` }}
                  />
                </span>
                <span className="text-xs font-semibold text-foreground">{stats.percent}%</span>
              </span>
            </span>

            <span className="hidden shrink-0 items-center gap-3 text-xs text-muted-foreground sm:flex">
              {stats.agentFollowUp > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Lara følger opp {stats.agentFollowUp}
                </span>
              )}
              {stats.waitingYou > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 text-warning" />
                  Venter på deg: {stats.waitingYou}
                </span>
              )}
            </span>

            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        );
      })}
    </div>
  );
}
