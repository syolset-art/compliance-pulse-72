import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFrameworkTheme } from "@/lib/serviceFrameworkTheme";
import {
  COVERAGE_LEVELS,
  type CoverageLevel,
  type FrameworkDefinition,
} from "@/lib/frameworkCoverageCatalog";

export interface ControlSelection {
  enabled: boolean;
  level: CoverageLevel;
  hours: number;
  /** True = bruker har overstyrt timer manuelt */
  hoursOverridden?: boolean;
}

export type FrameworkSelection = Record<string, ControlSelection>;

interface Props {
  framework: FrameworkDefinition;
  hourlyRate: number;
  selection: FrameworkSelection;
  onSelectionChange: (next: FrameworkSelection) => void;
}

function formatNOK(n: number): string {
  return new Intl.NumberFormat("nb-NO").format(Math.round(n)) + " kr";
}

export function FrameworkCoverageCard({
  framework,
  hourlyRate,
  selection,
  onSelectionChange,
}: Props) {
  const theme = getFrameworkTheme(framework.id);
  const [expanded, setExpanded] = useState(false);

  const { totalHours, totalPrice, enabledCount } = useMemo(() => {
    let h = 0;
    let n = 0;
    framework.controlPoints.forEach((cp) => {
      const s = selection[cp.id];
      if (s?.enabled) {
        h += s.hours;
        n += 1;
      }
    });
    return { totalHours: h, totalPrice: h * hourlyRate, enabledCount: n };
  }, [framework, selection, hourlyRate]);

  const partnerDelivers = enabledCount > 0 || expanded;

  const updateControl = (cpId: string, patch: Partial<ControlSelection>) => {
    const cp = framework.controlPoints.find((c) => c.id === cpId)!;
    const current = selection[cpId] ?? {
      enabled: false,
      level: "partial" as CoverageLevel,
      hours: cp.hoursByLevel.partial,
      hoursOverridden: false,
    };
    const merged: ControlSelection = { ...current, ...patch };
    // Når nivå endres og brukeren ikke har overstyrt timer — bruk Lara-forslag
    if (patch.level && !merged.hoursOverridden) {
      merged.hours = cp.hoursByLevel[merged.level];
    }
    onSelectionChange({ ...selection, [cpId]: merged });
  };

  const toggleAll = (enabled: boolean) => {
    const next: FrameworkSelection = { ...selection };
    framework.controlPoints.forEach((cp) => {
      const current = next[cp.id];
      next[cp.id] = {
        enabled,
        level: current?.level ?? "partial",
        hours: current?.hours ?? cp.hoursByLevel[current?.level ?? "partial"],
        hoursOverridden: current?.hoursOverridden ?? false,
      };
    });
    onSelectionChange(next);
    if (enabled) setExpanded(true);
  };

  return (
    <Card className={cn("overflow-hidden border-l-4", theme.border)}>
      {/* Header */}
      <div
        className="grid items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors grid-cols-[auto_1fr_auto_auto_auto_auto]"
        onClick={() => setExpanded((v) => !v)}
      >
        <span
          className={cn(
            "inline-flex items-center rounded px-2 py-1 text-[11px] font-semibold border",
            theme.chip,
          )}
        >
          {framework.shortName}
        </span>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{framework.label}</div>
          <div className="text-[11px] text-muted-foreground truncate">{framework.summary}</div>
        </div>

        <div
          className="flex items-center gap-2 text-[11px] text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <span>Vi leverer</span>
          <Switch
            checked={partnerDelivers}
            onCheckedChange={(v) => {
              setExpanded(v);
              if (!v) toggleAll(false);
            }}
          />
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">KP valgt</div>
          <div className="text-sm font-semibold text-foreground tabular-nums">
            {enabledCount} / {framework.controlPoints.length}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Timer</div>
          <div className="text-sm font-semibold text-foreground tabular-nums">{totalHours} t</div>
        </div>

        <div className="text-right min-w-[110px]">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Inntekt</div>
          <div className="text-sm font-bold text-foreground tabular-nums">
            {formatNOK(totalPrice)}
          </div>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Vis kontrollpunkter">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Kontrollpunkter */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Velg kontrollpunkter dere leverer på
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={() => toggleAll(true)}
              >
                Velg alle
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-muted-foreground"
                onClick={() => toggleAll(false)}
              >
                Fjern alle
              </Button>
            </div>
          </div>

          {/* Kolonneoverskrifter */}
          <div className="grid items-center gap-3 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground grid-cols-[auto_1fr_90px_110px]">
            <span className="w-4" />
            <span>Kontrollpunkt</span>
            <span className="text-right">Timer</span>
            <span className="text-right">Inntekt</span>
          </div>

          <ul className="space-y-1">
            {framework.controlPoints.map((cp) => {
              const s = selection[cp.id];
              const enabled = !!s?.enabled;
              const level = s?.level ?? "partial";
              const hours = s?.hours ?? cp.hoursByLevel[level];
              const price = hours * hourlyRate;
              const suggested = cp.hoursByLevel[level];
              const overridden = s?.hoursOverridden && hours !== suggested;
              return (
                <li
                  key={cp.id}
                  className={cn(
                    "grid items-center gap-3 px-2 py-2 rounded-md border bg-background grid-cols-[auto_1fr_90px_110px]",
                    enabled ? "border-border" : "border-border/40 opacity-70",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => updateControl(cp.id, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-border accent-primary"
                    aria-label={`Velg ${cp.id}`}
                  />

                  <div className="min-w-0">
                    <div className="text-sm text-foreground truncate">
                      <span className="text-muted-foreground mr-1.5">{cp.id}</span>
                      {cp.label}
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="flex items-center justify-end gap-1">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      disabled={!enabled}
                      value={hours}
                      onChange={(e) =>
                        updateControl(cp.id, {
                          hours: Math.max(0, Number(e.target.value) || 0),
                          hoursOverridden: true,
                        })
                      }
                      className="h-7 w-14 px-1.5 text-[12px] text-right tabular-nums"
                    />
                    <span className="text-[10px] text-muted-foreground">t</span>
                  </div>

                  {/* Inntekt */}
                  <div className="text-right">
                    <div className="text-sm font-semibold text-foreground tabular-nums">
                      {enabled ? formatNOK(price) : "—"}
                    </div>
                    {enabled && (
                      <div className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5 justify-end">
                        {overridden ? (
                          <>justert · Lara {suggested} t</>
                        ) : (
                          <>
                            <Sparkles className="h-2.5 w-2.5" /> Lara-forslag
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Sum */}
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
            <span className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" />
              Inntektspotensial for {framework.shortName}
            </span>
            <div className="flex items-center gap-6">
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {totalHours} t
              </span>
              <span className="text-base font-bold text-foreground tabular-nums w-28 text-right">
                {formatNOK(totalPrice)}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
