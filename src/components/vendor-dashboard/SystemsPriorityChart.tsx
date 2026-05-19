import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = "A" | "B" | "C" | "D";

interface SystemRow {
  id: string;
  name: string;
  priority?: string | null;
  criticality?: string | null;
  compliance_score?: number | null;
}

const PRIO_META: Record<Priority, { label: string; helper: string; bar: string; barCritical: string; ring: string }> = {
  A: {
    label: "Prioritet A",
    helper: "Kritisk",
    bar: "bg-destructive/20",
    barCritical: "bg-destructive",
    ring: "ring-destructive/30",
  },
  B: {
    label: "Prioritet B",
    helper: "Høy",
    bar: "bg-warning/20",
    barCritical: "bg-warning",
    ring: "ring-warning/30",
  },
  C: {
    label: "Prioritet C",
    helper: "Medium",
    bar: "bg-primary/20",
    barCritical: "bg-primary",
    ring: "ring-primary/30",
  },
  D: {
    label: "Prioritet D",
    helper: "Lav",
    bar: "bg-muted",
    barCritical: "bg-muted-foreground/70",
    ring: "ring-border",
  },
};

/** Map raw asset row into a normalised priority bucket. */
function toPriority(s: SystemRow): Priority {
  const raw = (s.priority || "").toString().toUpperCase().trim();
  if (raw === "A" || raw === "P0" || raw === "0" || raw === "CRITICAL") return "A";
  if (raw === "B" || raw === "P1" || raw === "1" || raw === "HIGH") return "B";
  if (raw === "C" || raw === "P2" || raw === "2" || raw === "MEDIUM") return "C";
  if (raw === "D" || raw === "P3" || raw === "3" || raw === "LOW") return "D";
  // Derive when not set: criticality + score signal
  const crit = (s.criticality || "").toLowerCase();
  const score = s.compliance_score ?? 100;
  if (crit === "high" && score < 60) return "A";
  if (crit === "high") return "B";
  if (crit === "medium") return "C";
  return "D";
}

export function SystemsPriorityChart() {
  const navigate = useNavigate();

  const { data: systems = [] } = useQuery({
    queryKey: ["vendors-priority-chart"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, priority, criticality, compliance_score, asset_type")
        .eq("asset_type", "vendor");
      if (error) throw error;
      return (data || []) as SystemRow[];
    },
  });

  const { buckets, total } = useMemo(() => {
    const b: Record<Priority, { total: number; items: SystemRow[] }> = {
      A: { total: 0, items: [] },
      B: { total: 0, items: [] },
      C: { total: 0, items: [] },
      D: { total: 0, items: [] },
    };
    systems.forEach((s) => {
      const p = toPriority(s);
      b[p].total += 1;
      b[p].items.push(s);
    });
    return {
      buckets: b,
      total: systems.length,
    };
  }, [systems]);

  const maxBar = Math.max(buckets.A.total, buckets.B.total, buckets.C.total, buckets.D.total, 1);
  const orderedKeys: Priority[] = ["A", "B", "C", "D"];

  return (
    <Card variant="flat" className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            <span className="truncate">Leverandører per prioritet</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 hidden lg:block">
            Sortering etter Mynder-prioritet · kritiske er uthevet
          </p>
        </div>
        <Badge variant="outline" className="text-xs shrink-0 gap-1 whitespace-nowrap">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          {total}
        </Badge>
      </div>

      {/* Chart */}
      <div
        className="grid grid-cols-4 gap-3 h-[160px] items-end"
        role="img"
        aria-label={
          `Leverandører per prioritet: ` +
          orderedKeys
            .map((k) => `${PRIO_META[k].label} ${buckets[k].total}`)
            .join(", ")
        }
      >
        {orderedKeys.map((k) => {
          const meta = PRIO_META[k];
          const t = buckets[k].total;
          const heightPct = (t / maxBar) * 100;
          return (
            <div key={k} className="flex flex-col items-center justify-end h-full gap-2">
              {/* Count above bar */}
              <span className="text-base font-bold text-foreground tabular-nums leading-none">{t}</span>

              {/* Bar */}
              <div className="w-full flex-1 flex flex-col justify-end">
                <div
                  className={cn(
                    "relative w-full rounded-md overflow-hidden ring-1 transition-all",
                    meta.bar,
                    meta.ring
                  )}
                  style={{ height: `${Math.max(heightPct, t > 0 ? 6 : 0)}%`, minHeight: t > 0 ? 6 : 0 }}
                  title={`${t} leverandører`}
                />
              </div>

              {/* X-axis label */}
              <div className="text-center">
                <p className="text-xs font-bold text-foreground tracking-wide">{k}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{meta.helper}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
