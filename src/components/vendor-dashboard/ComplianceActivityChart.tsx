import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Activity, TrendingUp, TrendingDown, Sparkles, User } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { nb } from "date-fns/locale";

type RangeKey = "7d" | "30d" | "90d";
const RANGE_DAYS: Record<RangeKey, number> = { "7d": 7, "30d": 30, "90d": 90 };

interface DayBucket {
  date: string; // yyyy-MM-dd
  label: string;
  lara: number;
  manual: number;
}

function isLaraAgent(value?: string | null): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return v.includes("lara") || v.includes("ai") || v.includes("agent") || v === "system";
}

export function ComplianceActivityChart() {
  const [range, setRange] = useState<RangeKey>("30d");
  const days = RANGE_DAYS[range];
  const since = useMemo(() => startOfDay(subDays(new Date(), days - 1)).toISOString(), [days]);
  const sincePrev = useMemo(
    () => startOfDay(subDays(new Date(), days * 2 - 1)).toISOString(),
    [days],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["compliance-activity", range],
    queryFn: async () => {
      const [evidenceRes, inboxRes, assetsRes, prioRes] = await Promise.all([
        supabase
          .from("evidence_checks")
          .select("created_at, agent_id")
          .gte("created_at", sincePrev),
        supabase
          .from("lara_inbox")
          .select("processed_at, processed_by, status")
          .gte("processed_at", sincePrev)
          .not("processed_at", "is", null),
        supabase
          .from("assets")
          .select("updated_at")
          .gte("updated_at", sincePrev),
        supabase
          .from("asset_priority_history")
          .select("changed_at, changed_by, source")
          .gte("changed_at", sincePrev),
      ]);

      type Evt = { ts: string; lara: boolean };
      const events: Evt[] = [];

      (evidenceRes.data || []).forEach((r: any) => {
        if (!r.created_at) return;
        events.push({ ts: r.created_at, lara: isLaraAgent(r.agent_id) });
      });
      (inboxRes.data || []).forEach((r: any) => {
        if (!r.processed_at) return;
        events.push({ ts: r.processed_at, lara: isLaraAgent(r.processed_by) });
      });
      (assetsRes.data || []).forEach((r: any) => {
        if (!r.updated_at) return;
        events.push({ ts: r.updated_at, lara: false });
      });
      (prioRes.data || []).forEach((r: any) => {
        if (!r.changed_at) return;
        const lara = r.source ? isLaraAgent(r.source) : isLaraAgent(r.changed_by);
        events.push({ ts: r.changed_at, lara });
      });

      return events;
    },
  });

  const { buckets, total, totalPrev, laraTotal, manualTotal } = useMemo(() => {
    const map = new Map<string, DayBucket>();
    const today = startOfDay(new Date());
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, "yyyy-MM-dd");
      map.set(key, {
        date: key,
        label: format(d, days <= 7 ? "EEE" : "d. MMM", { locale: nb }),
        lara: 0,
        manual: 0,
      });
    }
    const sinceMs = new Date(since).getTime();
    let totalCur = 0;
    let totalPrev = 0;
    let laraCur = 0;
    let manualCur = 0;
    (data || []).forEach((e) => {
      const t = new Date(e.ts).getTime();
      if (t >= sinceMs) {
        const key = format(startOfDay(new Date(e.ts)), "yyyy-MM-dd");
        const b = map.get(key);
        if (b) {
          if (e.lara) {
            b.lara += 1;
            laraCur += 1;
          } else {
            b.manual += 1;
            manualCur += 1;
          }
          totalCur += 1;
        }
      } else {
        totalPrev += 1;
      }
    });
    return {
      buckets: Array.from(map.values()),
      total: totalCur,
      totalPrev,
      laraTotal: laraCur,
      manualTotal: manualCur,
    };
  }, [data, days, since]);

  const trend = totalPrev > 0 ? Math.round(((total - totalPrev) / totalPrev) * 100) : null;
  const trendUp = trend !== null && trend >= 0;

  return (
    <Card variant="flat" className="p-4">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
            Compliance-aktivitet
          </h2>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground tabular-nums">{total}</span>
            <span className="text-xs text-muted-foreground">handlinger</span>
            {trend !== null && (
              <span
                className={`text-xs font-medium inline-flex items-center gap-0.5 ${
                  trendUp ? "text-success" : "text-destructive"
                }`}
                aria-label={`Endring ${trend} prosent vs forrige periode`}
              >
                {trendUp ? (
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3 w-3" aria-hidden="true" />
                )}
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5" role="tablist" aria-label="Tidsperiode">
          {(Object.keys(RANGE_DAYS) as RangeKey[]).map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                range === r
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "7d" ? "7d" : r === "30d" ? "30d" : "90d"}
            </button>
          ))}
        </div>
      </div>

      <div
        className="h-[180px]"
        role="img"
        aria-label={`Compliance-aktivitet siste ${days} dager: ${total} handlinger totalt, ${laraTotal} fra Lara, ${manualTotal} manuelle`}
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            Laster…
          </div>
        ) : total === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            Ingen aktivitet registrert i perioden
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={buckets} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-lara" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="grad-manual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                formatter={(value: number, name: string) => [
                  value,
                  name === "lara" ? "Lara" : "Manuell",
                ]}
              />
              <Area
                type="monotone"
                dataKey="manual"
                stackId="1"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                fill="url(#grad-manual)"
              />
              <Area
                type="monotone"
                dataKey="lara"
                stackId="1"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                fill="url(#grad-lara)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" />
          <span>Lara</span>
          <span className="font-semibold text-foreground tabular-nums">{laraTotal}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <User className="h-3 w-3" aria-hidden="true" />
          <span>Manuell</span>
          <span className="font-semibold text-foreground tabular-nums">{manualTotal}</span>
        </div>
      </div>
    </Card>
  );
}
