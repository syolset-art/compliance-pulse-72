import { Filter, X, Cpu, Building2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ViewFilter = "alle" | "mine";
export type TaskCategory = "system" | "leverandør" | "behandling" | "dokument";
export type CategoryFilter = "alle" | TaskCategory;
export type TaskPriority = "høy" | "middels" | "lav";
export type PriorityFilter = "alle" | TaskPriority;

interface Counts {
  alle: number;
  mine: number;
  system: number;
  leverandør: number;
  behandling: number;
}

interface TasksFilterBarProps {
  viewFilter: ViewFilter;
  categoryFilter: CategoryFilter;
  priorityFilter: PriorityFilter;
  counts: Counts;
  resultCount: number;
  totalCount: number;
  onViewChange: (v: ViewFilter) => void;
  onCategoryChange: (c: CategoryFilter) => void;
  onPriorityChange: (p: PriorityFilter) => void;
  onReset: () => void;
}

const categoryLabels: Record<CategoryFilter, string> = {
  alle: "Alle typer",
  system: "System",
  leverandør: "Leverandør",
  behandling: "Behandling",
  dokument: "Dokument",
};

const priorityLabels: Record<PriorityFilter, string> = {
  alle: "Alle prioriteter",
  høy: "Høy",
  middels: "Middels",
  lav: "Lav",
};

export function TasksFilterBar({
  viewFilter,
  categoryFilter,
  priorityFilter,
  counts,
  resultCount,
  totalCount,
  onViewChange,
  onCategoryChange,
  onPriorityChange,
  onReset,
}: TasksFilterBarProps) {
  const activeCount =
    (viewFilter !== "alle" ? 1 : 0) +
    (categoryFilter !== "alle" ? 1 : 0) +
    (priorityFilter !== "alle" ? 1 : 0);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {/* Mine / Alle toggle — most-used, kept inline */}
      <div className="inline-flex rounded-full bg-muted p-0.5">
        {(["alle", "mine"] as ViewFilter[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              viewFilter === v
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v === "alle" ? `Alle (${counts.alle})` : `Mine (${counts.mine})`}
          </button>
        ))}
      </div>

      {/* Filter popover for category + priority */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full text-xs"
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
            {activeCount > 0 && (
              <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground">
                {activeCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Type
            </label>
            <Select
              value={categoryFilter}
              onValueChange={(v) => onCategoryChange(v as CategoryFilter)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle typer</SelectItem>
                <SelectItem value="system">System ({counts.system})</SelectItem>
                <SelectItem value="leverandør">
                  Leverandør ({counts.leverandør})
                </SelectItem>
                <SelectItem value="behandling">
                  Behandling ({counts.behandling})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Prioritet
            </label>
            <Select
              value={priorityFilter}
              onValueChange={(v) => onPriorityChange(v as PriorityFilter)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle prioriteter</SelectItem>
                <SelectItem value="høy">Høy</SelectItem>
                <SelectItem value="middels">Middels</SelectItem>
                <SelectItem value="lav">Lav</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="w-full h-8 text-xs gap-1.5"
            >
              <X className="h-3 w-3" />
              Nullstill filter
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* Active filter chips */}
      {categoryFilter !== "alle" && (
        <Badge
          variant="secondary"
          className="h-7 gap-1 rounded-full pl-2.5 pr-1 text-xs font-normal"
        >
          {categoryLabels[categoryFilter]}
          <button
            onClick={() => onCategoryChange("alle")}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
            aria-label="Fjern filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {priorityFilter !== "alle" && (
        <Badge
          variant="secondary"
          className="h-7 gap-1 rounded-full pl-2.5 pr-1 text-xs font-normal"
        >
          {priorityLabels[priorityFilter]}
          <button
            onClick={() => onPriorityChange("alle")}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
            aria-label="Fjern filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Result count, right-aligned */}
      <p className="ml-auto text-xs text-muted-foreground">
        Viser <span className="font-medium text-foreground">{resultCount}</span>{" "}
        av {totalCount}
      </p>
    </div>
  );
}
