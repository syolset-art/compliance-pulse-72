import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Sparkles, Check, Plus, X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFrameworkTheme } from "@/lib/serviceFrameworkTheme";
import {
  type CoverageLevel,
  type FrameworkDefinition,
} from "@/lib/frameworkCoverageCatalog";

export interface ControlSelection {
  enabled: boolean;
  level: CoverageLevel;
  hours: number;
  /** True = bruker har overstyrt timer manuelt */
  hoursOverridden?: boolean;
  /** Partner-tillagte aktiviteter utover de typiske som ligger i katalogen. */
  extraActivities?: string[];
}

export type CustomCostKind = "fixed" | "hourly";

export interface CustomCost {
  id: string;
  label: string;
  kind: CustomCostKind;
  /** kr (fixed) eller kr/t (hourly) */
  amount: number;
  /** kun for hourly */
  hours?: number;
  /** Inkluderes i tilbud */
  includeInOffer: boolean;
}

export interface FrameworkSelection {
  controls: Record<string, ControlSelection>;
  customCosts: CustomCost[];
}

interface Props {
  framework: FrameworkDefinition;
  hourlyRate: number;
  selection: FrameworkSelection;
  onSelectionChange: (next: FrameworkSelection) => void;
}

function formatNOK(n: number): string {
  return new Intl.NumberFormat("nb-NO").format(Math.round(n)) + " kr";
}

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cc_${Math.random().toString(36).slice(2, 10)}`;
}

export function customCostAmount(c: CustomCost): number {
  return c.kind === "fixed" ? c.amount : c.amount * (c.hours ?? 0);
}

export function FrameworkCoverageCard({
  framework,
  hourlyRate,
  selection,
  onSelectionChange,
}: Props) {
  const theme = getFrameworkTheme(framework.id);
  const [expanded, setExpanded] = useState(false);

  const controls = selection.controls ?? {};
  const customCosts = selection.customCosts ?? [];

  const { controlHours, controlPrice, enabledCount, customPrice, includedCustomCount } = useMemo(() => {
    let h = 0;
    let n = 0;
    framework.controlPoints.forEach((cp) => {
      const s = controls[cp.id];
      if (s?.enabled) {
        h += s.hours;
        n += 1;
      }
    });
    let cp = 0;
    let cn = 0;
    customCosts.forEach((c) => {
      if (c.includeInOffer) {
        cp += customCostAmount(c);
        cn += 1;
      }
    });
    return {
      controlHours: h,
      controlPrice: h * hourlyRate,
      enabledCount: n,
      customPrice: cp,
      includedCustomCount: cn,
    };
  }, [framework, controls, customCosts, hourlyRate]);

  const totalPrice = controlPrice + customPrice;
  const partnerDelivers = enabledCount > 0 || expanded;

  const updateSelection = (patch: Partial<FrameworkSelection>) => {
    onSelectionChange({
      controls: selection.controls ?? {},
      customCosts: selection.customCosts ?? [],
      ...patch,
    });
  };

  const updateControl = (cpId: string, patch: Partial<ControlSelection>) => {
    const cp = framework.controlPoints.find((c) => c.id === cpId)!;
    const current = controls[cpId] ?? {
      enabled: false,
      level: "partial" as CoverageLevel,
      hours: cp.hoursByLevel.partial,
      hoursOverridden: false,
    };
    const merged: ControlSelection = { ...current, ...patch };
    if (patch.level && !merged.hoursOverridden) {
      merged.hours = cp.hoursByLevel[merged.level];
    }
    updateSelection({ controls: { ...controls, [cpId]: merged } });
  };

  const toggleAll = (enabled: boolean) => {
    const next: Record<string, ControlSelection> = { ...controls };
    framework.controlPoints.forEach((cp) => {
      const current = next[cp.id];
      next[cp.id] = {
        enabled,
        level: current?.level ?? "partial",
        hours: current?.hours ?? cp.hoursByLevel[current?.level ?? "partial"],
        hoursOverridden: current?.hoursOverridden ?? false,
      };
    });
    updateSelection({ controls: next });
    if (enabled) setExpanded(true);
  };

  // --- Custom cost handlers ---
  const addCustomCost = () => {
    const c: CustomCost = {
      id: genId(),
      label: "",
      kind: "fixed",
      amount: 0,
      hours: 0,
      includeInOffer: true,
    };
    updateSelection({ customCosts: [...customCosts, c] });
  };

  const updateCustomCost = (id: string, patch: Partial<CustomCost>) => {
    updateSelection({
      customCosts: customCosts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const removeCustomCost = (id: string) => {
    updateSelection({ customCosts: customCosts.filter((c) => c.id !== id) });
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
            {includedCustomCount > 0 && (
              <span className="ml-1 text-[10px] font-medium text-muted-foreground">
                + {includedCustomCount} tillegg
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Timer</div>
          <div className="text-sm font-semibold text-foreground tabular-nums">{controlHours} t</div>
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

          {/* Lara-estimat info */}
          <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
            <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Lara estimerer omfang basert på valgte kontrollpunkter og kompleksitet —
              <span className="font-semibold text-foreground"> ~{controlHours} t × {hourlyRate.toLocaleString("nb-NO")} kr</span>.
              Bruk dette som utgangspunkt; detaljér timer og pris i selve tilbudet til kunden.
            </p>
          </div>

          <ul className="space-y-1">
            {framework.controlPoints.map((cp) => {
              const s = controls[cp.id];
              const enabled = !!s?.enabled;
              const builtinActivities = cp.typicalActivities ?? [];
              const extraActivities = s?.extraActivities ?? [];

              const addActivity = (label: string) => {
                const v = label.trim();
                if (!v) return;
                updateControl(cp.id, {
                  extraActivities: [...extraActivities, v],
                });
              };
              const removeExtra = (idx: number) => {
                updateControl(cp.id, {
                  extraActivities: extraActivities.filter((_, i) => i !== idx),
                });
              };

              return (
                <li
                  key={cp.id}
                  className={cn(
                    "rounded-md border bg-background",
                    enabled ? "border-border" : "border-border/40 opacity-70",
                  )}
                >
                  <div className="flex items-center gap-3 px-2 py-2">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => updateControl(cp.id, { enabled: e.target.checked })}
                      className="h-4 w-4 rounded border-border accent-primary flex-shrink-0"
                      aria-label={`Velg ${cp.id}`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-foreground truncate">
                        <span className="text-muted-foreground mr-1.5">{cp.id}</span>
                        {cp.label}
                      </div>
                    </div>
                  </div>

                  {/* Typiske aktiviteter — kun synlig når KP er valgt */}
                  {enabled && (
                    <div className="px-2 pb-2 pl-8">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
                          Typiske aktiviteter
                        </span>
                        {builtinActivities.map((act, i) => (
                          <span
                            key={`b-${i}`}
                            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/80"
                          >
                            {act}
                          </span>
                        ))}
                        {extraActivities.map((act, i) => (
                          <span
                            key={`e-${i}`}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px]"
                          >
                            {act}
                            <button
                              type="button"
                              onClick={() => removeExtra(i)}
                              className="hover:text-destructive"
                              aria-label={`Fjern ${act}`}
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                        <AddActivityInline onAdd={addActivity} />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>



          {/* Egendefinerte kostnader */}
          <div className="pt-3 mt-1 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
                <Tag className="h-3 w-3" />
                Egendefinerte kostnader
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-primary"
                onClick={addCustomCost}
              >
                <Plus className="h-3 w-3 mr-1" /> Legg til kostnad
              </Button>
            </div>

            {customCosts.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic px-2 py-2">
                Legg til etableringsgebyr, drift, prosjektledelse e.l. — kunden velger om de skal med i tilbudet.
              </p>
            ) : (
              <>
                {/* Kolonneoverskrifter */}
                <div className="grid items-center gap-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground grid-cols-[auto_1fr_140px_100px_70px_110px_auto]">
                  <span className="w-4" />
                  <span>Navn</span>
                  <span>Type</span>
                  <span className="text-right">Beløp</span>
                  <span className="text-right">Timer</span>
                  <span className="text-right">Sum</span>
                  <span className="w-7" />
                </div>
                <ul className="space-y-1">
                  {customCosts.map((c) => {
                    const isHourly = c.kind === "hourly";
                    const sum = customCostAmount(c);
                    return (
                      <li
                        key={c.id}
                        className={cn(
                          "grid items-center gap-2 px-2 py-2 rounded-md border bg-background grid-cols-[auto_1fr_140px_100px_70px_110px_auto]",
                          c.includeInOffer ? "border-border" : "border-border/40 opacity-70",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={c.includeInOffer}
                          onChange={(e) =>
                            updateCustomCost(c.id, { includeInOffer: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-border accent-primary"
                          aria-label="Ta med i tilbud"
                        />

                        <Input
                          type="text"
                          value={c.label}
                          placeholder="F.eks. Etableringsgebyr"
                          onChange={(e) => updateCustomCost(c.id, { label: e.target.value })}
                          className="h-7 px-2 text-[12px]"
                        />

                        {/* Type-toggle */}
                        <div className="inline-flex rounded-md border border-border overflow-hidden h-7">
                          <button
                            type="button"
                            onClick={() => updateCustomCost(c.id, { kind: "fixed" })}
                            className={cn(
                              "flex-1 text-[11px] px-2 transition-colors",
                              !isHourly
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground hover:bg-muted",
                            )}
                          >
                            Fast
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCustomCost(c.id, { kind: "hourly" })}
                            className={cn(
                              "flex-1 text-[11px] px-2 transition-colors border-l border-border",
                              isHourly
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground hover:bg-muted",
                            )}
                          >
                            Pr time
                          </button>
                        </div>

                        {/* Beløp */}
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            min={0}
                            step={isHourly ? 50 : 100}
                            value={c.amount}
                            onChange={(e) =>
                              updateCustomCost(c.id, {
                                amount: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="h-7 w-20 px-1.5 text-[12px] text-right tabular-nums"
                          />
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {isHourly ? "kr/t" : "kr"}
                          </span>
                        </div>

                        {/* Timer (kun hourly) */}
                        <div className="flex items-center justify-end gap-1">
                          {isHourly ? (
                            <>
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                value={c.hours ?? 0}
                                onChange={(e) =>
                                  updateCustomCost(c.id, {
                                    hours: Math.max(0, Number(e.target.value) || 0),
                                  })
                                }
                                className="h-7 w-12 px-1.5 text-[12px] text-right tabular-nums"
                              />
                              <span className="text-[10px] text-muted-foreground">t</span>
                            </>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </div>

                        {/* Sum */}
                        <div className="text-right text-sm font-semibold text-foreground tabular-nums">
                          {c.includeInOffer ? formatNOK(sum) : "—"}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeCustomCost(c.id)}
                          aria-label="Fjern kostnad"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          {/* Sum */}
          <div className="pt-3 mt-2 border-t border-border space-y-1.5">
            {customPrice > 0 && (
              <>
                <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                  <span>Kontrollpunkter</span>
                  <div className="flex items-center gap-6">
                    <span className="tabular-nums">{controlHours} t</span>
                    <span className="tabular-nums w-28 text-right">{formatNOK(controlPrice)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                  <span>Tillegg ({includedCustomCount})</span>
                  <div className="flex items-center gap-6">
                    <span className="tabular-nums" />
                    <span className="tabular-nums w-28 text-right">{formatNOK(customPrice)}</span>
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" />
                {customPrice > 0 ? "Totalt" : "Inntektspotensial"} for {framework.shortName}
              </span>
              <div className="flex items-center gap-6">
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {controlHours} t
                </span>
                <span className="text-base font-bold text-foreground tabular-nums w-28 text-right">
                  {formatNOK(totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function AddActivityInline({ onAdd }: { onAdd: (label: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
      >
        <Plus className="h-2.5 w-2.5" /> Legg til aktivitet
      </button>
    );
  }

  const commit = () => {
    const v = value.trim();
    if (v) onAdd(v);
    setValue("");
    setEditing(false);
  };

  return (
    <span className="inline-flex items-center gap-1">
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setValue("");
            setEditing(false);
          }
        }}
        placeholder="F.eks. Månedlig statusmøte"
        className="h-6 w-44 px-2 text-[11px]"
      />
    </span>
  );
}

