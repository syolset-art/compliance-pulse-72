import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";

interface MaturityHistoryChartProps {
  assetId: string;
  baselinePercent: number;
  enrichmentPercent: number;
}

type EventType = "positive" | "negative" | "neutral";

interface TimelineEvent {
  month: string;
  labelEn: string;
  labelNb: string;
  type: EventType;
}

function generateDemoData(assetId: string, currentBaseline: number, currentEnrichment: number) {
  // Deterministic seed from assetId
  let seed = 0;
  for (let i = 0; i < assetId.length; i++) seed = ((seed << 5) - seed + assetId.charCodeAt(i)) | 0;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0x7fffffff) / 2147483647; };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const currentMonth = now.getMonth();

  // Build 12 months of history
  const data: { month: string; baseline: number; enrichment: number; total: number }[] = [];

  // Baseline starts at a fixed value and stays relatively flat
  const baseStart = Math.max(10, currentBaseline - Math.round(rand() * 8));

  // Enrichment grows from 0 to current
  for (let i = 0; i < 12; i++) {
    const mi = (currentMonth - 11 + i + 12) % 12;
    const progress = i / 11;
    const baseline = i < 2 ? baseStart : Math.min(currentBaseline, baseStart + Math.round((currentBaseline - baseStart) * Math.min(1, progress * 0.5)));
    
    // Enrichment ramps up with some variance
    let enrichment = Math.round(currentEnrichment * Math.pow(progress, 1.3));
    // Add a dip at month ~7 if random says so
    if (i === 7 && rand() > 0.4) {
      enrichment = Math.max(0, enrichment - Math.round(rand() * 12 + 5));
    }
    enrichment = Math.min(enrichment, currentEnrichment);

    data.push({
      month: months[mi],
      baseline,
      enrichment,
      total: baseline + enrichment,
    });
  }

  // Ensure last point matches current
  data[11].baseline = currentBaseline;
  data[11].enrichment = currentEnrichment;
  data[11].total = currentBaseline + currentEnrichment;

  // Generate events
  const events: (TimelineEvent & { index: number })[] = [];

  const eventPool: { en: string; nb: string; type: EventType; minMonth: number }[] = [
    { en: "System registered", nb: "System registrert", type: "neutral", minMonth: 0 },
    { en: "DPA verified", nb: "DPA verifisert", type: "positive", minMonth: 2 },
    { en: "Owner assigned", nb: "Eier tildelt", type: "positive", minMonth: 3 },
    { en: "Risk assessment", nb: "Risikovurdering", type: "positive", minMonth: 5 },
    { en: "Security incident", nb: "Sikkerhetshendelse", type: "negative", minMonth: 7 },
    { en: "Review completed", nb: "Gjennomgang fullført", type: "positive", minMonth: 9 },
  ];

  for (const ev of eventPool) {
    if (rand() > 0.35 || ev.minMonth === 0) {
      events.push({
        index: ev.minMonth,
        month: data[ev.minMonth].month,
        labelEn: ev.en,
        labelNb: ev.nb,
        type: ev.type,
      });
    }
  }

  return { data, events };
}

const EVENT_COLORS: Record<EventType, string> = {
  positive: "hsl(142, 71%, 45%)",
  negative: "hsl(0, 84%, 60%)",
  neutral: "hsl(45, 93%, 47%)",
};

export function MaturityHistoryChart({ assetId, baselinePercent, enrichmentPercent }: MaturityHistoryChartProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const { data, events } = useMemo(
    () => generateDemoData(assetId, baselinePercent, enrichmentPercent),
    [assetId, baselinePercent, enrichmentPercent]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          {isNb ? "Modenhetshistorikk" : "Maturity History"}
        </h4>
        <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "hsl(142, 71%, 45%)" }} />
            {isNb ? "Tiltak" : "Action"}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "hsl(0, 84%, 60%)" }} />
            {isNb ? "Hendelse" : "Incident"}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "hsl(45, 93%, 47%)" }} />
            {isNb ? "Revisjon" : "Audit"}
          </span>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                const event = events.find(e => e.month === label);
                return (
                  <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-lg">
                    <p className="font-medium mb-1">{label}</p>
                    <p className="text-muted-foreground">
                      {isNb ? "Baseline" : "Baseline"}: {d?.baseline}%
                    </p>
                    <p className="text-muted-foreground">
                      {isNb ? "Eget arbeid" : "Enrichment"}: {d?.enrichment}%
                    </p>
                    <p className="font-semibold">
                      {isNb ? "Total" : "Total"}: {d?.total}%
                    </p>
                    {event && (
                      <p className="mt-1 pt-1 border-t border-border" style={{ color: EVENT_COLORS[event.type] }}>
                        {isNb ? event.labelNb : event.labelEn}
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="baseline"
              stackId="1"
              fill="hsl(var(--muted-foreground) / 0.15)"
              stroke="hsl(var(--muted-foreground) / 0.4)"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="enrichment"
              stackId="1"
              fill="hsl(var(--primary) / 0.15)"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
            />
            {events.map((ev, i) => (
              <ReferenceDot
                key={i}
                x={ev.month}
                y={data[ev.index]?.total || 0}
                r={5}
                fill={EVENT_COLORS[ev.type]}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend for areas */}
      <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted-foreground/40" />
          {isNb ? "Leverandørens baseline" : "Vendor baseline"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
          {isNb ? "Eget arbeid" : "Your enrichment"}
        </span>
      </div>
    </div>
  );
}
