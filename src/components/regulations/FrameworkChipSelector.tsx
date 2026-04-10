import { useState } from "react";
import { getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface FrameworkChipProps {
  framework: Framework;
  metCount: number;
  totalCount: number;
  isSelected: boolean;
  onClick: () => void;
}

const FrameworkChip = ({ framework, metCount, totalCount, isSelected, onClick }: FrameworkChipProps) => {
  const pct = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border whitespace-nowrap transition-all text-sm font-medium shrink-0 ${
        isSelected
          ? "border-primary bg-primary/10 text-primary shadow-sm"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50"
      }`}
    >
      <span>{framework.name}</span>
      <span className="text-xs text-muted-foreground">{metCount}/{totalCount} krav</span>
      <svg width="32" height="32" className="shrink-0 -mr-1">
        <circle cx="16" cy="16" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
        <circle
          cx="16" cy="16" r={radius}
          fill="none"
          stroke={pct >= 70 ? "hsl(var(--primary))" : pct >= 30 ? "hsl(45 93% 47%)" : "hsl(var(--destructive))"}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 16 16)"
          className="transition-all duration-500"
        />
        <text x="16" y="16" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-[8px] font-bold">
          {pct}%
        </text>
      </svg>
    </button>
  );
};

interface FrameworkChipSelectorProps {
  frameworks: Framework[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getStats: (frameworkId: string) => { met: number; total: number };
}

const VISIBLE_KEY = "regulations_visible_frameworks";

function getStoredVisible(): string[] | null {
  try {
    const raw = localStorage.getItem(VISIBLE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredVisible(ids: string[]) {
  localStorage.setItem(VISIBLE_KEY, JSON.stringify(ids));
}

export const FrameworkChipSelector = ({ frameworks, selectedId, onSelect, getStats }: FrameworkChipSelectorProps) => {
  const [expanded, setExpanded] = useState(false);
  const [visibleIds, setVisibleIds] = useState<string[]>(() => {
    const stored = getStoredVisible();
    // Default: show first 3
    return stored ?? frameworks.slice(0, 3).map((f) => f.id);
  });

  const visibleFrameworks = frameworks.filter((fw) => visibleIds.includes(fw.id));
  const displayedFrameworks = expanded ? frameworks : visibleFrameworks;
  const hiddenCount = frameworks.length - visibleFrameworks.length;

  const toggleVisibility = (fwId: string) => {
    setVisibleIds((prev) => {
      const next = prev.includes(fwId) ? prev.filter((id) => id !== fwId) : [...prev, fwId];
      setStoredVisible(next);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin flex-1">
          {displayedFrameworks.map((fw) => {
            const stats = getStats(fw.id);
            return (
              <FrameworkChip
                key={fw.id}
                framework={fw}
                metCount={stats.met}
                totalCount={stats.total}
                isSelected={selectedId === fw.id}
                onClick={() => onSelect(fw.id)}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Toggle expand/collapse */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Skjul
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Vis alle ({frameworks.length})
              </>
            )}
          </Button>

          {/* Visibility picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Eye className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3">
              <p className="text-sm font-medium text-foreground mb-2">Velg synlige regelverk</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {frameworks.map((fw) => (
                  <label
                    key={fw.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1.5 py-1 transition-colors"
                  >
                    <Checkbox
                      checked={visibleIds.includes(fw.id)}
                      onCheckedChange={() => toggleVisibility(fw.id)}
                    />
                    <span className="text-sm text-foreground">{fw.name}</span>
                  </label>
                ))}
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    const all = frameworks.map((f) => f.id);
                    setVisibleIds(all);
                    setStoredVisible(all);
                  }}
                >
                  Velg alle
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    const first3 = frameworks.slice(0, 3).map((f) => f.id);
                    setVisibleIds(first3);
                    setStoredVisible(first3);
                  }}
                >
                  Tilbakestill
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {!expanded && hiddenCount > 0 && (
        <p className="text-xs text-muted-foreground pl-1">
          Viser {visibleFrameworks.length} av {frameworks.length} regelverk
        </p>
      )}
    </div>
  );
};
