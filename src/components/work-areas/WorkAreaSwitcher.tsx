import { useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, Check, Plus, Server, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkArea {
  id: string;
  name: string;
  description: string | null;
  responsible_person: string | null;
  is_active: boolean;
}

const workAreaColors = [
  "bg-primary",
  "bg-warning",
  "bg-accent",
  "bg-primary",
  "bg-status-closed",
  "bg-accent",
];

type OwnershipFilter = "all" | "mine" | "member";
type RiskFilter = "all" | "high" | "low";

interface WorkAreaSwitcherProps {
  workAreas: WorkArea[];
  selectedWorkArea: WorkArea | null;
  workAreaRiskMap: Record<string, string>;
  ownershipFilter: OwnershipFilter;
  riskFilter: RiskFilter;
  onOwnershipFilterChange: (v: OwnershipFilter) => void;
  onRiskFilterChange: (v: RiskFilter) => void;
  onSelect: (area: WorkArea) => void;
  onAddNew: () => void;
}

const riskLabel = (risk?: string) => {
  switch (risk) {
    case "critical":
      return "Kritisk";
    case "high":
      return "Høy";
    case "medium":
      return "Moderat";
    case "low":
      return "Lav";
    default:
      return null;
  }
};

const riskBadgeClass = (risk?: string) => {
  switch (risk) {
    case "critical":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "high":
      return "bg-warning/10 text-warning border-warning/20";
    case "medium":
      return "bg-warning/10 text-warning border-warning/20";
    case "low":
      return "bg-success/10 text-success border-success/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export function WorkAreaSwitcher({
  workAreas,
  selectedWorkArea,
  workAreaRiskMap,
  ownershipFilter,
  riskFilter,
  onOwnershipFilterChange,
  onRiskFilterChange,
  onSelect,
  onAddNew,
}: WorkAreaSwitcherProps) {
  const [open, setOpen] = useState(false);

  const filteredAreas = useMemo(() => {
    let areas = [...workAreas];
    if (ownershipFilter === "mine") {
      areas = areas.filter((a) => a.responsible_person);
    } else if (ownershipFilter === "member") {
      areas = areas.filter((a) => !a.responsible_person);
    }
    if (riskFilter === "high") {
      areas = areas.filter((a) => {
        const r = workAreaRiskMap[a.id];
        return r === "high" || r === "critical";
      });
    } else if (riskFilter === "low") {
      areas = areas.filter((a) => {
        const r = workAreaRiskMap[a.id];
        return !r || r === "low" || r === "medium";
      });
    }
    return areas;
  }, [workAreas, ownershipFilter, riskFilter, workAreaRiskMap]);

  const selectedIndex = selectedWorkArea
    ? workAreas.findIndex((a) => a.id === selectedWorkArea.id)
    : -1;
  const selectedRisk = selectedWorkArea
    ? workAreaRiskMap[selectedWorkArea.id]
    : undefined;
  const selectedRiskLabel = riskLabel(selectedRisk);

  const filtersActive = ownershipFilter !== "all" || riskFilter !== "all";

  const ownershipOptions: { value: OwnershipFilter; label: string }[] = [
    { value: "all", label: "Alle" },
    { value: "mine", label: "Mine" },
    { value: "member", label: "Medlem" },
  ];
  const riskOptions: { value: RiskFilter; label: string }[] = [
    { value: "all", label: "Alle risiko" },
    { value: "high", label: "Høy" },
    { value: "low", label: "Lav" },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-[320px] h-10 justify-between font-normal"
        >
          {selectedWorkArea ? (
            <span className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "h-2 w-2 rounded-full flex-shrink-0",
                  workAreaColors[
                    (selectedIndex >= 0 ? selectedIndex : 0) %
                      workAreaColors.length
                  ]
                )}
                aria-hidden="true"
              />
              <span className="truncate font-medium text-foreground">
                {selectedWorkArea.name}
              </span>
              {selectedRiskLabel && (
                <span className="hidden sm:inline text-xs text-muted-foreground">
                  · {selectedRiskLabel} risiko
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">Velg arbeidsområde…</span>
          )}
          <ChevronsUpDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[320px] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Søk arbeidsområde…" />
          <div className="border-b p-2 space-y-1.5">
            <div className="flex gap-1 bg-muted rounded-md p-0.5">
              {ownershipOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onOwnershipFilterChange(opt.value)}
                  className={cn(
                    "flex-1 px-2 py-1 text-xs font-medium rounded transition-colors",
                    ownershipFilter === opt.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-muted rounded-md p-0.5">
              {riskOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onRiskFilterChange(opt.value)}
                  className={cn(
                    "flex-1 px-2 py-1 text-xs font-medium rounded transition-colors",
                    riskFilter === opt.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {filtersActive && (
              <button
                onClick={() => {
                  onOwnershipFilterChange("all");
                  onRiskFilterChange("all");
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline px-1"
              >
                Nullstill filter
              </button>
            )}
          </div>
          <CommandList className="max-h-[320px]">
            <CommandEmpty>Ingen arbeidsområder funnet.</CommandEmpty>
            <CommandGroup>
              {filteredAreas.map((area) => {
                const idx = workAreas.findIndex((a) => a.id === area.id);
                const risk = workAreaRiskMap[area.id];
                const rLabel = riskLabel(risk);
                const isSelected = selectedWorkArea?.id === area.id;
                return (
                  <CommandItem
                    key={area.id}
                    value={`${area.name} ${area.description ?? ""}`}
                    onSelect={() => {
                      onSelect(area);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full flex-shrink-0",
                        workAreaColors[
                          (idx >= 0 ? idx : 0) % workAreaColors.length
                        ]
                      )}
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate text-sm">
                      {area.name}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Server className="h-3 w-3" />
                      10
                    </span>
                    {rLabel && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          riskBadgeClass(risk)
                        )}
                      >
                        <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                        {rLabel}
                      </Badge>
                    )}
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onAddNew();
                }}
                className="text-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nytt arbeidsområde
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
