import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, RotateCcw, Sparkles, Trash2, Pencil, Check, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { formatPriceRange } from "@/lib/documentDeliverables";
import { baselineRequirementRows } from "@/lib/frameworkRequirementBaseline";
import {
  buildFrameworkTasks,
  resolveTasks,
  summarizePackage,
  loadPackageState,
  savePackageState,
  clearPackageState,
  packageHours,
  packagePrice,
  slugifyTaskName,
  TASK_KIND_LABEL,
  EMPTY_PACKAGE_STATE,
  type DeliverableKind,
  type FrameworkPackageState,
  type FrameworkTask,
  type RequirementRow,
  type ResolvedTask,
} from "@/lib/frameworkTaskPackage";

export interface SavedFrameworkPackage {
  frameworkId: string;
  frameworkName: string;
  name: string;
  hours: number;
  price: number;
  tasks: { label: string; hours: number }[];
  requirementIds: string[];
}

interface Props {
  frameworkId: string | null;
  frameworkName: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  hourlyRate: number;
  currency: string;
  onSaveAsService?: (pkg: SavedFrameworkPackage) => void;
  onUseInOffer?: (pkg: SavedFrameworkPackage) => void;
  /** Lagret pakke fra databasen — brukes i stedet for localStorage når den finnes. */
  initialState?: FrameworkPackageState | null;
  /** Om regelverket er aktivert i partnerens salgsportefølje. */
  isActive?: boolean;
  onToggleActive?: (isActive: boolean) => void;
  /** Lagrer pakken (state + totalsummer) til databasen. */
  onSavePackage?: (pkg: SavedFrameworkPackage, state: FrameworkPackageState) => void;
}

const KINDS: DeliverableKind[] = ["advisory", "technical", "ai-draft"];

export function MSPFrameworkTaskPackageSheet({
  frameworkId,
  frameworkName,
  open,
  onOpenChange,
  hourlyRate,
  currency,
  onSaveAsService,
  onUseInOffer,
  initialState = null,
  isActive = false,
  onToggleActive,
  onSavePackage,
}: Props) {
  const [state, setState] = useState<FrameworkPackageState>(EMPTY_PACKAGE_STATE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; kind: DeliverableKind; min: string; max: string }>({
    name: "",
    kind: "advisory",
    min: "",
    max: "",
  });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (frameworkId) setState(initialState ?? loadPackageState(frameworkId));
    setEditingId(null);
    setAdding(false);
    // initialState lastes kun når sheetet åpnes for et nytt regelverk
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameworkId, open]);

  const persist = (next: FrameworkPackageState) => {
    setState(next);
    if (frameworkId) savePackageState(frameworkId, next);
  };

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["framework-requirements", frameworkId],
    enabled: Boolean(frameworkId) && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_requirements")
        .select("framework_id, requirement_id, name_no, category")
        .eq("framework_id", frameworkId as string);
      if (error) return [] as RequirementRow[];
      return (data ?? []) as unknown as RequirementRow[];
    },
  });

  const effectiveRows = useMemo<RequirementRow[]>(
    () => (rows.length > 0 || !frameworkId ? rows : baselineRequirementRows(frameworkId)),
    [rows, frameworkId],
  );
  const baseTasks = useMemo<FrameworkTask[]>(
    () => buildFrameworkTasks(effectiveRows),
    [effectiveRows],
  );
  const tasks = useMemo(
    () => resolveTasks(baseTasks, state, hourlyRate),
    [baseTasks, state, hourlyRate],
  );
  const totals = useMemo(() => summarizePackage(tasks), [tasks]);

  const grouped = useMemo(() => {
    const map = new Map<string, ResolvedTask[]>();
    tasks.forEach((t) => {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    });
    return Array.from(map.entries());
  }, [tasks]);

  const toggle = (id: string, enabled: boolean) =>
    persist({
      ...state,
      overrides: { ...state.overrides, [id]: { ...state.overrides[id], disabled: !enabled } },
    });

  const remove = (id: string) =>
    persist({
      ...state,
      overrides: { ...state.overrides, [id]: { ...state.overrides[id], removed: true } },
    });

  const startEdit = (t: ResolvedTask) => {
    setAdding(false);
    setEditingId(t.id);
    setDraft({ name: t.name, kind: t.kind, min: String(t.hours.min), max: String(t.hours.max) });
  };

  const saveEdit = () => {
    if (!editingId) return;
    const min = Number(draft.min) || 0;
    const max = Math.max(min, Number(draft.max) || min);
    persist({
      ...state,
      overrides: {
        ...state.overrides,
        [editingId]: {
          ...state.overrides[editingId],
          name: draft.name.trim() || undefined,
          kind: draft.kind,
          hoursMin: min,
          hoursMax: max,
        },
      },
    });
    setEditingId(null);
  };

  const addCustom = () => {
    const name = draft.name.trim();
    if (!name) return;
    const min = Number(draft.min) || 1;
    const max = Math.max(min, Number(draft.max) || min);
    const id = `custom-${slugifyTaskName(name)}-${Date.now()}`;
    persist({
      ...state,
      custom: [
        ...state.custom,
        {
          id,
          name,
          kind: draft.kind,
          hours: { min, max },
          note: "Egendefinert oppgave.",
          laraDraft: draft.kind === "advisory",
          category: "Egendefinerte oppgaver",
          requirements: [],
          custom: true,
        },
      ],
    });
    setAdding(false);
    setDraft({ name: "", kind: "advisory", min: "", max: "" });
  };

  const buildPackage = (): SavedFrameworkPackage => ({
    frameworkId: frameworkId ?? "",
    frameworkName,
    name: `${frameworkName} — full leveranse`,
    hours: packageHours(totals),
    price: packagePrice(totals),
    tasks: tasks
      .filter((t) => t.enabled)
      .map((t) => ({ label: t.name, hours: Math.round((t.hours.min + t.hours.max) / 2) })),
    requirementIds: Array.from(new Set(tasks.filter((t) => t.enabled).flatMap((t) => t.requirements))),
  });

  const reset = () => {
    if (frameworkId) clearPackageState(frameworkId);
    setState({ overrides: {}, custom: [] });
    toast.success("Nullstilt til forslag");
  };

  const editor = (onSave: () => void, onCancel: () => void) => (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_80px_80px_auto] gap-2 items-end rounded-md border border-border p-2 bg-muted/30">
      <div className="space-y-1">
        <Label className="text-[11px]">Navn</Label>
        <Input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px]">Type</Label>
        <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v as DeliverableKind })}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KINDS.map((k) => (
              <SelectItem key={k} value={k}>
                {TASK_KIND_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-[11px]">Timer fra</Label>
        <Input
          type="number"
          min={0}
          value={draft.min}
          onChange={(e) => setDraft({ ...draft, min: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px]">Til</Label>
        <Input
          type="number"
          min={0}
          value={draft.max}
          onChange={(e) => setDraft({ ...draft, max: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" className="h-8" onClick={onSave}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-8" onClick={onCancel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{frameworkName}</SheetTitle>
          <SheetDescription>
            Alle krav med tilhørende oppgaver som må leveres. Juster timer, fjern det som ikke er
            relevant, eller legg til egne oppgaver. Pris beregnes fra timeprisen din (
            {hourlyRate.toLocaleString("nb-NO")} {currency}).
          </SheetDescription>
        </SheetHeader>

        <div className="mt-3 space-y-2">
          {onToggleActive && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
              <div>
                <Label htmlFor="fw-active" className="text-sm font-medium text-foreground">
                  Aktivert i salgsporteføljen
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Regelverket telles med i salgspotensialet og kan legges i tilbud.
                </p>
              </div>
              <Switch
                id="fw-active"
                checked={isActive}
                onCheckedChange={(v) => onToggleActive(v === true)}
              />
            </div>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-[10px] font-normal gap-1 cursor-help">
                  <Sparkles className="h-2.5 w-2.5" /> Timer foreslått av Lara
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Timene per kontrollpunkt er et AI-forslag fra Lara, beregnet fra kravets omfang og
                typisk dokumentasjonsbehov. Du kan endre alle timer og fjerne krav du ikke vil
                jobbe med — forslaget er kun et utgangspunkt.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="mt-4 space-y-5 pb-32">
          {isLoading && <p className="text-sm text-muted-foreground">Henter krav…</p>}

          {!isLoading && tasks.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Vi har ingen krav registrert for dette regelverket ennå.
              </p>
              <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Legg til egen oppgave
              </Button>
            </div>
          )}

          {grouped.map(([category, items]) => (
            <div key={category} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {category}
              </p>
              <div className="space-y-1.5">
                {items.map((t) =>
                  editingId === t.id ? (
                    <div key={t.id}>{editor(saveEdit, () => setEditingId(null))}</div>
                  ) : (
                    <div
                      key={t.id}
                      className="flex items-start gap-3 rounded-md border border-border px-3 py-2 hover:bg-muted/40 transition-colors"
                    >
                      <Checkbox
                        checked={t.enabled}
                        onCheckedChange={(v) => toggle(t.id, v === true)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{t.name}</span>
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {TASK_KIND_LABEL[t.kind]}
                          </Badge>
                          {t.laraDraft && (
                            <Badge variant="outline" className="text-[10px] font-normal gap-1">
                              <Sparkles className="h-2.5 w-2.5" /> Lara-utkast
                            </Badge>
                          )}
                          {t.edited && (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              Justert
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {t.requirements.length > 0
                            ? `Dekker: ${t.requirements.slice(0, 4).join(", ")}${t.requirements.length > 4 ? ` +${t.requirements.length - 4}` : ""}`
                            : t.note}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-foreground">
                          {t.hours.min === t.hours.max ? `${t.hours.min} t` : `${t.hours.min}–${t.hours.max} t`}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatPriceRange(t.price, currency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(t)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => remove(t.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}

          {adding ? (
            editor(addCustom, () => setAdding(false))
          ) : (
            tasks.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => {
                    setEditingId(null);
                    setDraft({ name: "", kind: "advisory", min: "", max: "" });
                    setAdding(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Legg til egen oppgave
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={reset}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Nullstill til forslag
                </Button>
              </div>
            )
          )}
        </div>

        <div className="sticky bottom-0 -mx-6 px-6 py-3 border-t border-border bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{totals.tasks} oppgaver</span> ·{" "}
              {totals.hours.min}–{totals.hours.max} timer · {formatPriceRange(totals.price, currency)}
            </p>
            <div className="flex items-center gap-2">
              {onUseInOffer && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  disabled={totals.tasks === 0}
                  onClick={() => onUseInOffer(buildPackage())}
                >
                  Bruk i tilbud
                </Button>
              )}
              {onSavePackage && (
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  disabled={totals.tasks === 0}
                  onClick={() => onSavePackage(buildPackage(), state)}
                >
                  Lagre pakke
                </Button>
              )}
              {onSaveAsService && (
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  disabled={totals.tasks === 0}
                  onClick={() => {
                    onSaveAsService(buildPackage());
                    onOpenChange(false);
                  }}
                >
                  Lagre som tjeneste
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
