import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Diamond } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Dot,
} from "recharts";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { cn } from "@/lib/utils";

type Range = "7d" | "30d" | "90d" | "12m";

const RANGES: { key: Range; label: string }[] = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "12m", label: "12m" },
];

interface ScoreActivity {
  type: "lara-approved" | "lara-auto" | "person";
  who_initials: string;
  who_name: string;
  approver?: string;
  title_no: string;
  title_en: string;
  date: string;
  delta: number;
  domain_no?: string;
  domain_en?: string;
  hasReport?: boolean;
}

const ACTIVITIES: ScoreActivity[] = [
  {
    type: "lara-approved",
    who_initials: "LA",
    who_name: "Lara",
    approver: "Synnøve",
    title_no: "DPA opprettet for Visma Software AS",
    title_en: "DPA created for Visma Software AS",
    date: "i dag",
    delta: 5,
    hasReport: true,
  },
  {
    type: "person",
    who_initials: "SJ",
    who_name: "Sue Janne Alsaker",
    title_no: "Avvik registrert: Manglende DPA",
    title_en: "Deviation logged: Missing DPA",
    date: "14. april",
    delta: -3,
    domain_no: "Leverandører og økosystem",
    domain_en: "Vendors & Ecosystem",
  },
  {
    type: "lara-auto",
    who_initials: "LA",
    who_name: "Lara",
    title_no: "Risikovurdering oppdatert — HR-systemer",
    title_en: "Risk assessment updated — HR systems",
    date: "8. april",
    delta: 1,
    hasReport: true,
  },
  {
    type: "person",
    who_initials: "SO",
    who_name: "Synnøve Olset",
    title_no: "Kontroll godkjent: Tilgangsstyring",
    title_en: "Control approved: Access management",
    date: "29. mars",
    delta: 2,
    domain_no: "Identitet og tilgang",
    domain_en: "Identity & Access",
  },
];

function generateSeries(range: Range, currentScore: number) {
  const points = range === "7d" ? 7 : range === "30d" ? 8 : range === "90d" ? 9 : 12;
  const data: { label: string; score: number; impact?: "pos" | "neg" }[] = [];
  for (let i = 0; i < points; i++) {
    const factor = (i / (points - 1)) * 0.15 + 0.85;
    const jitter = Math.sin(i * 1.7) * 2;
    const score = Math.round(Math.max(60, Math.min(100, currentScore * factor + jitter)));
    data.push({
      label: i === 0 ? "28. mar" : i === Math.floor(points / 2) ? "12. apr" : i === points - 1 ? "i dag" : "",
      score,
      impact: i === Math.floor(points / 2) ? "neg" : i === points - 2 || i === points - 1 ? "pos" : undefined,
    });
  }
  return data;
}

export function DashboardMaturityOverTime() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const [range, setRange] = useState<Range>("30d");
  const { stats } = useComplianceRequirements();
  const overall = Math.round(stats.overallScore?.score || 82);

  const series = useMemo(() => generateSeries(range, overall), [range, overall]);
  const delta = 4;

  const rangeLabelMap: Record<Range, string> = {
    "7d": isNb ? "siste 7 dager" : "last 7 days",
    "30d": isNb ? "siste 30 dager" : "last 30 days",
    "90d": isNb ? "siste 90 dager" : "last 90 days",
    "12m": isNb ? "siste 12 mnd" : "last 12 months",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-1">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {isNb ? "Modenhet over tid" : "Maturity over time"}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isNb
              ? "Samlet score med aktiviteter som har flyttet den"
              : "Overall score with activities that moved it"}
          </p>
        </div>
        <div className="flex items-center rounded-full border border-border bg-muted/30 p-0.5 self-start">
          {RANGES.map((r) => {
            const active = range === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Score + delta */}
      <div className="flex items-center gap-3 mt-4 mb-3">
        <span className="text-4xl font-bold text-foreground tracking-tight">{overall}%</span>
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-success/15 text-success">
          +{delta}
        </span>
        <span className="text-sm text-muted-foreground">{rangeLabelMap[range]}</span>
      </div>

      {/* Chart */}
      <div className="h-[200px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[60, 100]}
              ticks={[70, 80, 90]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value}%`, isNb ? "Score" : "Score"]}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#scoreFill)"
              dot={(props: any) => {
                const { cx, cy, payload, index } = props;
                if (payload.impact === "pos")
                  return <Dot key={index} cx={cx} cy={cy} r={4} fill="hsl(var(--success))" stroke="hsl(var(--card))" strokeWidth={2} />;
                if (payload.impact === "neg")
                  return <Dot key={index} cx={cx} cy={cy} r={4} fill="hsl(var(--destructive))" stroke="hsl(var(--card))" strokeWidth={2} />;
                return <Dot key={index} cx={cx} cy={cy} r={0} />;
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Activities */}
      <div className="mt-5">
        <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
          {isNb ? "Aktiviteter som påvirket score" : "Activities that affected the score"}
        </p>
        <div className="divide-y divide-border">
          {ACTIVITIES.map((a, i) => {
            const isLara = a.type !== "person";
            return (
              <div key={i} className="flex items-start sm:items-center gap-3 py-3">
                <div
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                    isLara ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  {isLara ? <Diamond className="h-4 w-4" /> : a.who_initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2 sm:truncate">
                    {isNb ? a.title_no : a.title_en}
                  </p>
                  <div className="flex items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1 flex-wrap">
                    {isLara ? (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        Lara · {a.type === "lara-approved"
                          ? `${isNb ? "godkjent av" : "approved by"} ${a.approver}`
                          : isNb ? "automatisk" : "automatic"}
                      </span>
                    ) : (
                      <span className="font-medium text-foreground">{a.who_name}</span>
                    )}
                    <span>· {a.date}</span>
                    {a.domain_no && (
                      <span className="hidden sm:inline">· {isNb ? a.domain_no : a.domain_en}</span>
                    )}
                    {a.hasReport && (
                      <button className="text-primary hover:text-primary/80 font-medium">
                        {isNb ? "Se rapport →" : "View report →"}
                      </button>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums px-2.5 py-1 rounded-full shrink-0",
                    a.delta >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  )}
                >
                  {a.delta >= 0 ? "+" : ""}
                  {a.delta}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
