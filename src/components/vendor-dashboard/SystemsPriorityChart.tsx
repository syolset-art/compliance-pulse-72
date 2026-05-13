import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
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

  const { buckets, total, criticalForBusiness } = useMemo(() => {
    const b: Record<Priority, { total: number; critical: number; items: SystemRow[] }> = {
      A: { total: 0, critical: 0, items: [] },
      B: { total: 0, critical: 0, items: [] },
      C: { total: 0, critical: 0, items: [] },
      D: { total: 0, critical: 0, items: [] },
    };
    systems.forEach((s) => {
      const p = toPriority(s);
      b[p].total += 1;
      if ((s.criticality || "").toLowerCase() === "high") b[p].critical += 1;
      b[p].items.push(s);
    });
    const critList = systems
      .filter((s) => (s.criticality || "").toLowerCase() === "high")
      .sort((a, b2) => (a.compliance_score ?? 100) - (b2.compliance_score ?? 100));
    return {
      buckets: b,
      total: systems.length,
      criticalForBusiness: critList,
    };
  }, [systems]);

  const maxBar = Math.max(buckets.A.total, buckets.B.total, buckets.C.total, buckets.D.total, 1);
  const orderedKeys: Priority[] = ["A", "B", "C", "D"];

  return (
    <Card variant="flat" className="p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
            Leverandører per prioritet
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sortering etter Mynder-prioritet · andelen som er kritisk for virksomheten er uthevet
          </p>
        </div>
        <Badge variant="outline" className="text-xs shrink-0 gap-1">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          {total} leverandører
        </Badge>
      </div>

      {/* Chart */}
      <div
        className="grid grid-cols-4 gap-3 h-[160px] items-end"
        role="img"
        aria-label={
          `Leverandører per prioritet: ` +
          orderedKeys
            .map((k) => `${PRIO_META[k].label} ${buckets[k].total} (${buckets[k].critical} kritiske)`)
            .join(", ")
        }
      >
        {orderedKeys.map((k) => {
          const meta = PRIO_META[k];
          const { total: t, critical } = buckets[k];
          const heightPct = (t / maxBar) * 100;
          const critPct = t > 0 ? (critical / t) * 100 : 0;
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
                  title={`${t} leverandører · ${critical} kritiske`}
                >
                  {/* Critical-for-business segment */}
                  {critical > 0 && (
                    <div
                      className={cn("absolute bottom-0 left-0 right-0", meta.barCritical)}
                      style={{ height: `${critPct}%` }}
                    />
                  )}
                </div>
              </div>

              {/* X-axis label */}
              <div className="text-center">
                <p className="text-xs font-bold text-foreground tracking-wide">{k}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{meta.helper}</p>
                {critical > 0 && (
                  <p className="text-[11px] text-destructive font-medium mt-0.5 tabular-nums">
                    {critical} kritisk
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-sm bg-foreground/70" aria-hidden="true" />
          Kritisk for virksomheten
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-sm bg-muted ring-1 ring-border" aria-hidden="true" />
          Øvrige
        </div>
      </div>

      {/* Critical systems list */}
      {criticalForBusiness.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
              Kritisk for vår virksomhet
            </h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              {criticalForBusiness.length}
            </span>
          </div>
          <div className="space-y-1">
            {criticalForBusiness.slice(0, 4).map((s) => {
              const p = toPriority(s);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigate(`/assets/${s.id}`)}
                  aria-label={`Åpne leverandør ${s.name}, prioritet ${p}`}
                  className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                >
                  <span
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold shrink-0",
                      p === "A" ? "bg-destructive/15 text-destructive" :
                      p === "B" ? "bg-warning/15 text-warning" :
                      p === "C" ? "bg-primary/15 text-primary" :
                      "bg-muted text-muted-foreground"
                    )}
                  >
                    {p}
                  </span>
                  <span className="text-sm text-foreground truncate flex-1">{s.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
