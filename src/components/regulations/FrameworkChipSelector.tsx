import { useState, useMemo } from "react";
import { getCategoryById, categories, type Framework } from "@/lib/frameworkDefinitions";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FrameworkChipSelectorProps {
  frameworks: Framework[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getStats: (frameworkId: string) => { met: number; total: number };
  hideSummary?: boolean;
}

const ProgressRing = ({ pct, size = 36 }: { pct: number; size?: number }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
      <circle
        cx={center} cy={center} r={radius}
        fill="none"
        stroke={pct >= 70 ? "hsl(var(--success))" : pct >= 30 ? "hsl(var(--warning))" : "hsl(var(--destructive))"}
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-all duration-500"
      />
      <text x={center} y={center} textAnchor="middle" dominantBaseline="central" className="fill-foreground text-[13px] font-bold">
        {pct}%
      </text>
    </svg>
  );
};

const CategorySection = ({
  categoryId,
  frameworkItems,
  selectedId,
  onSelect,
}: {
  categoryId: string;
  frameworkItems: { fw: Framework; met: number; total: number; pct: number }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) => {
  const cat = getCategoryById(categoryId);
  if (!cat) return null;
  const CatIcon = cat.icon;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <CatIcon className={cn("h-4 w-4", cat.color)} />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat.name}</span>
        <span className="text-[13px] text-muted-foreground">({frameworkItems.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {frameworkItems.map(({ fw, met, total, pct }) => {
          const isSelected = selectedId === fw.id;
          return (
            <button
              key={fw.id}
              onClick={() => onSelect(fw.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              <ProgressRing pct={pct} size={36} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {fw.name}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  {met} av {total} krav oppfylt
                </p>
              </div>
              {fw.isMandatory && (
                <span className="text-[13px] font-semibold text-white bg-status-followup uppercase tracking-wider shrink-0 rounded-pill px-2 py-0.5">Påkrevd</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const FrameworkChipSelector = ({ frameworks, selectedId, onSelect, getStats }: FrameworkChipSelectorProps) => {
  const [expanded, setExpanded] = useState(false);

  const enriched = useMemo(
    () =>
      frameworks.map((fw) => {
        const s = getStats(fw.id);
        return { fw, met: s.met, total: s.total, pct: s.total > 0 ? Math.round((s.met / s.total) * 100) : 0 };
      }),
    [frameworks, getStats]
  );

  const selectedItem = enriched.find((e) => e.fw.id === selectedId);

  const grouped = useMemo(() => {
    const map: Record<string, typeof enriched> = {};
    enriched.forEach((item) => {
      const cat = item.fw.category;
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    });
    // Sort by category order
    const order = categories.map((c) => c.id);
    return order
      .filter((catId) => map[catId]?.length > 0)
      .map((catId) => ({ categoryId: catId, items: map[catId] }));
  }, [enriched]);

  const overallMet = enriched.reduce((s, e) => s + e.met, 0);
  const overallTotal = enriched.reduce((s, e) => s + e.total, 0);
  const overallPct = overallTotal > 0 ? Math.round((overallMet / overallTotal) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Summary bar — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
      >
        <ProgressRing pct={overallPct} size={44} />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {frameworks.length} aktive krav
            </span>
            <span className="text-xs text-muted-foreground">
              · {overallMet} av {overallTotal} krav oppfylt
            </span>
          </div>
          {selectedItem && !expanded && (
            <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              Viser: {selectedItem.fw.name}
            </p>
          )}
        </div>

        {/* Category dots */}
        <div className="hidden sm:flex items-center gap-3">
          {grouped.map(({ categoryId, items }) => {
            const cat = getCategoryById(categoryId);
            if (!cat) return null;
            const catPct = items.reduce((s, e) => s + e.met, 0) / Math.max(items.reduce((s, e) => s + e.total, 0), 1);
            return (
              <div key={categoryId} className="flex items-center gap-1.5">
                <div className={cn("h-2.5 w-2.5 rounded-full", cat.bgColor, cat.color.replace("text-", "bg-").replace("500", "500"))} />
                <span className="text-[13px] text-muted-foreground">{cat.name.split(' ')[0]}</span>
                <span className="text-[13px] font-medium text-foreground">{Math.round(catPct * 100)}%</span>
              </div>
            );
          })}
        </div>

        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform shrink-0",
          expanded && "rotate-180"
        )} />
      </button>

      {/* Expanded grid */}
      {expanded && (
        <div className="space-y-5 px-1 animate-in slide-in-from-top-2 duration-200">
          {grouped.map(({ categoryId, items }) => (
            <CategorySection
              key={categoryId}
              categoryId={categoryId}
              frameworkItems={items}
              selectedId={selectedId}
              onSelect={(id) => {
                onSelect(id);
                setExpanded(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
