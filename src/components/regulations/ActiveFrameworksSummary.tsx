import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Framework } from "@/lib/frameworkDefinitions";

interface CategoryStat {
  id: string;
  label: string;
  met: number;
  total: number;
  percent: number;
  colorClass: string; // tailwind bg- class using semantic tokens
  dotClass: string;
}

interface Props {
  frameworks: Framework[];
  getStats: (fwId: string) => { met: number; total: number };
  expanded?: boolean;
  onToggle?: () => void;
}

// Map framework category -> display bucket
function bucketFor(cat: string): "privacy" | "security" | "ai" | "other" {
  const c = cat.toLowerCase();
  if (c.includes("privacy") || c.includes("personvern") || c === "gdpr") return "privacy";
  if (c.includes("security") || c.includes("sikkerhet") || c.includes("info")) return "security";
  if (c.includes("ai")) return "ai";
  return "other";
}

const BUCKET_META: Record<string, { label: string; bg: string; dot: string }> = {
  privacy:  { label: "Personvern", bg: "bg-mynder-blue",   dot: "bg-mynder-blue" },
  security: { label: "Sikkerhet",  bg: "bg-status-closed", dot: "bg-status-closed" },
  ai:       { label: "AI",         bg: "bg-purple-accent", dot: "bg-purple-accent" },
  other:    { label: "Øvrige",     bg: "bg-status-followup", dot: "bg-status-followup" },
};

export function ActiveFrameworksSummary({ frameworks, getStats, expanded, onToggle }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = expanded ?? internalOpen;
  const handleToggle = () => {
    if (onToggle) onToggle();
    else setInternalOpen((v) => !v);
  };

  const { totalMet, totalReqs, overallPct, categories } = useMemo(() => {
    const buckets: Record<string, { met: number; total: number }> = {
      privacy: { met: 0, total: 0 },
      security: { met: 0, total: 0 },
      ai: { met: 0, total: 0 },
      other: { met: 0, total: 0 },
    };
    let met = 0;
    let total = 0;
    frameworks.forEach((fw) => {
      const s = getStats(fw.id);
      const b = bucketFor(fw.category);
      buckets[b].met += s.met;
      buckets[b].total += s.total;
      met += s.met;
      total += s.total;
    });

    const cats: CategoryStat[] = (["privacy", "security", "ai", "other"] as const)
      .map((id) => {
        const meta = BUCKET_META[id];
        const b = buckets[id];
        return {
          id,
          label: meta.label,
          met: b.met,
          total: b.total,
          percent: b.total > 0 ? Math.round((b.met / b.total) * 100) : 0,
          colorClass: meta.bg,
          dotClass: meta.dot,
        };
      })
      .filter((c) => c.total > 0);

    return {
      totalMet: met,
      totalReqs: total,
      overallPct: total > 0 ? Math.round((met / total) * 100) : 0,
      categories: cats,
    };
  }, [frameworks, getStats]);

  // Segmented bar: each segment width proportional to its share of total reqs
  const totalForBar = categories.reduce((acc, c) => acc + c.total, 0);

  // Donut: SVG ring
  const donutSize = 64;
  const donutStroke = 6;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCirc = 2 * Math.PI * donutRadius;
  const donutOffset = donutCirc - (overallPct / 100) * donutCirc;
  const ringColor =
    overallPct >= 70 ? "hsl(var(--success))" : overallPct >= 30 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative shrink-0" style={{ width: donutSize, height: donutSize }}>
          <svg width={donutSize} height={donutSize}>
            <circle
              cx={donutSize / 2}
              cy={donutSize / 2}
              r={donutRadius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={donutStroke}
            />
            <circle
              cx={donutSize / 2}
              cy={donutSize / 2}
              r={donutRadius}
              fill="none"
              stroke={ringColor}
              strokeWidth={donutStroke}
              strokeDasharray={donutCirc}
              strokeDashoffset={donutOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${donutSize / 2} ${donutSize / 2})`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground">{overallPct}%</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-semibold text-foreground">
            {frameworks.length} aktive regelverk · {totalMet} av {totalReqs} krav oppfylt
          </p>

          {/* Segmented bar */}
          {totalForBar > 0 && (
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-muted">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className={c.colorClass}
                  style={{ width: `${(c.total / totalForBar) * 100}%` }}
                  title={`${c.label}: ${c.percent}%`}
                />
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-1.5 text-xs">
                <span className={`h-2 w-2 rounded-full ${c.dotClass}`} />
                <span className="text-muted-foreground">{c.label}</span>
                <span className="font-semibold text-foreground">{c.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Toggle */}
        <button
          type="button"
          onClick={handleToggle}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={isOpen ? "Skjul detaljer" : "Vis detaljer"}
          aria-expanded={isOpen}
        >
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>
    </div>
  );
}
