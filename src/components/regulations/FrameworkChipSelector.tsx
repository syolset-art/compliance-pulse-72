import { getCategoryById, type Framework } from "@/lib/frameworkDefinitions";

interface FrameworkChipProps {
  framework: Framework;
  metCount: number;
  totalCount: number;
  isSelected: boolean;
  onClick: () => void;
}

const FrameworkChip = ({ framework, metCount, totalCount, isSelected, onClick }: FrameworkChipProps) => {
  const category = getCategoryById(framework.category);
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
      {/* Mini circular progress */}
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

export const FrameworkChipSelector = ({ frameworks, selectedId, onSelect, getStats }: FrameworkChipSelectorProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
      {frameworks.map((fw) => {
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
  );
};
