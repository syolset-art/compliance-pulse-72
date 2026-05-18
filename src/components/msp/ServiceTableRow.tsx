import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Plus,
  X,
  Eye,
  EyeOff,
  Pencil,
  Library,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFrameworkTheme } from "@/lib/serviceFrameworkTheme";
import { getControlLabel } from "@/lib/serviceControlLabels";
import type { PartnerService } from "@/lib/serviceCatalog";

interface Props {
  service: PartnerService;
  onEdit: () => void;
  onTogglePublished: (value: boolean) => void;
  onDelete?: () => void;
}

interface Activity {
  id: string;
  label: string;
  hours: number;
}

interface ControlPoint {
  key: string; // unique
  frameworkId: string;
  frameworkLabel: string;
  controlId: string;
  title: string;
  activities: Activity[];
}

// Deterministisk Lara-forslag for timer pr aktivitet (1-8t)
function suggestHours(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return 1 + (h % 8);
}

function formatNOK(n: number): string {
  return new Intl.NumberFormat("nb-NO").format(Math.round(n)) + " kr";
}

function buildControlPoints(service: PartnerService): ControlPoint[] {
  const points: ControlPoint[] = [];
  service.frameworkMappings.forEach((m) => {
    m.controlIds.forEach((cid) => {
      points.push({
        key: `${m.frameworkId}:${cid}`,
        frameworkId: m.frameworkId,
        frameworkLabel: m.frameworkLabel,
        controlId: cid,
        title: getControlLabel(m.frameworkId, cid),
        activities: [],
      });
    });
  });
  // Fordel checklist round-robin på kontrollpunktene
  if (points.length === 0) return points;
  service.defaultChecklist.forEach((label, i) => {
    const target = points[i % points.length];
    target.activities.push({
      id: `${target.key}:${i}`,
      label,
      hours: suggestHours(`${target.key}:${label}`),
    });
  });
  return points;
}

export function ServiceTableRow({
  service,
  onEdit,
  onTogglePublished,
  onDelete,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [expandedControl, setExpandedControl] = useState<string | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number>(1500);
  const initialPoints = useMemo(() => buildControlPoints(service), [service]);
  const [points, setPoints] = useState<ControlPoint[]>(initialPoints);

  // Åpne første kontrollpunkt automatisk når raden ekspanderes
  const handleToggleExpand = () => {
    setExpanded((v) => {
      const next = !v;
      if (next && !expandedControl && points.length > 0) {
        setExpandedControl(points[0].key);
      }
      return next;
    });
  };

  const updateActivityHours = (controlKey: string, activityId: string, hours: number) => {
    setPoints((prev) =>
      prev.map((p) =>
        p.key !== controlKey
          ? p
          : {
              ...p,
              activities: p.activities.map((a) =>
                a.id === activityId ? { ...a, hours: Math.max(0, hours) } : a,
              ),
            },
      ),
    );
  };

  const removeActivity = (controlKey: string, activityId: string) => {
    setPoints((prev) =>
      prev.map((p) =>
        p.key !== controlKey
          ? p
          : { ...p, activities: p.activities.filter((a) => a.id !== activityId) },
      ),
    );
  };

  const addActivity = (controlKey: string) => {
    setPoints((prev) =>
      prev.map((p) =>
        p.key !== controlKey
          ? p
          : {
              ...p,
              activities: [
                ...p.activities,
                {
                  id: `${p.key}:new:${Date.now()}`,
                  label: "Ny aktivitet",
                  hours: 2,
                },
              ],
            },
      ),
    );
  };

  const removeControl = (controlKey: string) => {
    setPoints((prev) => prev.filter((p) => p.key !== controlKey));
    if (expandedControl === controlKey) setExpandedControl(null);
  };

  const controlHours = (p: ControlPoint) =>
    p.activities.reduce((s, a) => s + a.hours, 0);
  const totalHours = points.reduce((s, p) => s + controlHours(p), 0);
  const totalPrice = totalHours * hourlyRate;

  return (
    <Card className="overflow-hidden">
      {/* Hovedrad */}
      <div
        className={cn(
          "grid items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors",
          "grid-cols-[1fr_180px_80px_120px_120px_40px]",
        )}
        onClick={handleToggleExpand}
      >
        {/* Tjeneste */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">
              {service.name}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {points.length} kontrollpunkter
            </div>
          </div>
        </div>

        {/* Regelverk-piller */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {service.frameworkMappings.map((m) => {
            const theme = getFrameworkTheme(m.frameworkId);
            return (
              <span
                key={m.frameworkId}
                className={cn(
                  "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border",
                  theme.chip,
                )}
              >
                {m.frameworkLabel}
              </span>
            );
          })}
        </div>

        {/* Timer */}
        <div className="text-sm text-foreground tabular-nums">{totalHours} t</div>

        {/* Timepris */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Input
            type="number"
            min={0}
            step={50}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Math.max(0, Number(e.target.value) || 0))}
            className="h-8 w-20 px-2 text-sm text-right tabular-nums"
          />
          <span className="text-[11px] text-muted-foreground">kr/t</span>
        </div>

        {/* Totalpris */}
        <div className="text-sm font-semibold text-foreground tabular-nums text-right">
          {formatNOK(totalPrice)}
        </div>

        {/* Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-auto"
          aria-label={expanded ? "Skjul detaljer" : "Vis detaljer"}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Ekspandert visning */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-3">
          {/* Sub-header + action-rad */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Kontrollpunkter denne tjenesten dekker
            </span>
            <div className="flex items-center gap-1">
              <label
                className="flex items-center gap-1.5 rounded-md border border-border bg-background px-1.5 py-1 cursor-pointer hover:bg-muted/40 transition-colors"
                title={
                  service.publishedToCustomers
                    ? "Synlig og bestillbar for kunder"
                    : "Skjult — kun synlig for deg"
                }
              >
                {service.publishedToCustomers ? (
                  <Eye className="h-3 w-3 text-primary" />
                ) : (
                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                )}
                <Switch
                  checked={!!service.publishedToCustomers}
                  onCheckedChange={onTogglePublished}
                />
                <span className="text-[11px] text-muted-foreground">
                  {service.publishedToCustomers ? "Synlig" : "Skjult"}
                </span>
              </label>
              <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[11px]" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" /> Rediger
              </Button>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground ml-1">
                <Info className="h-3 w-3" /> Velg fra Mynders bibliotek
              </span>
            </div>
          </div>

          {/* Kontrollpunkter — én per linje */}
          <div className="space-y-1.5">
            {points.map((p) => {
              const open = expandedControl === p.key;
              const hours = controlHours(p);
              const price = hours * hourlyRate;
              const theme = getFrameworkTheme(p.frameworkId);
              return (
                <div
                  key={p.key}
                  className="rounded-md border border-border bg-background overflow-hidden"
                >
                  {/* Kontrollpunkt-rad */}
                  <div
                    className="grid items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors grid-cols-[auto_1fr_auto_auto_auto]"
                    onClick={() => setExpandedControl(open ? null : p.key)}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border",
                        theme.chip,
                      )}
                    >
                      {p.frameworkLabel} {p.controlId}
                    </span>
                    <span className="text-sm text-foreground truncate">
                      {p.title}
                      <span className="text-muted-foreground ml-2 text-[11px]">
                        · {hours} t totalt
                      </span>
                    </span>
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {formatNOK(price)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeControl(p.key);
                      }}
                      aria-label="Fjern kontrollpunkt"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label={open ? "Skjul aktiviteter" : "Vis aktiviteter"}
                    >
                      {open ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>

                  {/* Aktiviteter */}
                  {open && (
                    <div className="border-t border-border/60 px-3 py-2 bg-muted/10 space-y-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pl-2">
                        Aktiviteter
                      </div>
                      <ul className="space-y-1">
                        {p.activities.map((a) => (
                          <li
                            key={a.id}
                            className="grid items-center gap-2 py-1 pl-2 border-l-2 border-border grid-cols-[1fr_auto_auto_auto]"
                          >
                            <span className="text-[13px] text-foreground/90 truncate">
                              {a.label}
                            </span>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                step={0.5}
                                value={a.hours}
                                onChange={(e) =>
                                  updateActivityHours(
                                    p.key,
                                    a.id,
                                    Number(e.target.value) || 0,
                                  )
                                }
                                className="h-7 w-14 px-1.5 text-[12px] text-right tabular-nums"
                              />
                              <span className="text-[11px] text-muted-foreground">t</span>
                            </div>
                            <span className="text-[12px] font-medium text-foreground tabular-nums w-20 text-right">
                              {formatNOK(a.hours * hourlyRate)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => removeActivity(p.key, a.id)}
                              aria-label="Fjern aktivitet"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </li>
                        ))}
                        {p.activities.length === 0 && (
                          <li className="text-[12px] text-muted-foreground pl-2 py-1">
                            Ingen aktiviteter ennå.
                          </li>
                        )}
                      </ul>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-[11px] mt-1"
                        onClick={() => addActivity(p.key)}
                      >
                        <Plus className="h-3 w-3" /> Legg til aktivitet
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legg til kontrollpunkt */}
          <button
            type="button"
            onClick={onEdit}
            className="w-full rounded-md border border-dashed border-border bg-background/40 px-3 py-2 text-[12px] text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Library className="h-3.5 w-3.5" />
            Legg til kontrollpunkt fra Mynders bibliotek
          </button>

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm font-semibold text-foreground">
              Totalt for tjenesten
            </span>
            <div className="flex items-center gap-6">
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {totalHours} t
              </span>
              <span className="text-sm font-bold text-foreground tabular-nums w-24 text-right">
                {formatNOK(totalPrice)}
              </span>
            </div>
          </div>

          {onDelete && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                Slett tjeneste
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
