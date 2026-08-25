import { useEffect, useMemo, useRef, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
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
import { Plus, RotateCcw, Sparkles, Trash2, Pencil, Check, X, CheckCircle2, Loader2, RefreshCw, Info, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPriceRange } from "@/lib/documentDeliverables";
import { baselineRequirementRows } from "@/lib/frameworkRequirementBaseline";
import { frameworkLicensePrice } from "@/lib/planConstants";
import { estimatePackageHours } from "@/lib/laraPackageHoursEstimate";
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
  /** Om det finnes en lagret pakke for regelverket. */
  isSaved?: boolean;
  /** Brukes kun for å fjerne pakken fra salgsporteføljen (deaktivere). */
  onToggleActive?: (isActive: boolean) => void;
  /** Lagrer pakken (state + totalsummer) til databasen — aktiverer den i salgsporteføljen. */
  onSavePackage?: (pkg: SavedFrameworkPackage, state: FrameworkPackageState) => void;
}

const KINDS: DeliverableKind[] = ["advisory", "technical", "ai-draft"];

const fmtH = (h: number) => h.toLocaleString("nb-NO", { maximumFractionDigits: 1 });

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
  isSaved = false,
  onToggleActive,
  onSavePackage,
}: Props) {
  const [state, setState] = useState<FrameworkPackageState>(EMPTY_PACKAGE_STATE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    name: string;
    kind: DeliverableKind;
    hours: string;
    price: string;
  }>({
    name: "",
    kind: "advisory",
    hours: "",
    price: "",
  });
  const [adding, setAdding] = useState(false);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [estimating, setEstimating] = useState(false);
  const estimateRanFor = useRef<string | null>(null);

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
  const licensePrice = frameworkId ? frameworkLicensePrice(frameworkId) : 0;

  const grouped = useMemo(() => {
    const map = new Map<string, ResolvedTask[]>();
    tasks.forEach((t) => {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    });
    return Array.from(map.entries());
  }, [tasks]);

  /**
   * Lar Lara lage et grovt timeestimat per oppgave.
   * onlyUnedited=true bevarer timer partneren har justert manuelt.
   */
  const runEstimation = async (onlyUnedited: boolean) => {
    if (!frameworkId || estimating || baseTasks.length === 0) return;
    setEstimating(true);
    try {
      const targets = baseTasks.filter((t) => {
        const o = state.overrides[t.id];
        if (o?.removed) return false;
        if (onlyUnedited && o && o.hoursMin != null && !o.estimated) return false;
        return true;
      });
      if (targets.length === 0) return;
      const estimates = await estimatePackageHours(
        frameworkName,
        targets.map((t) => ({
          id: t.id,
          name: t.name,
          kind: t.kind,
          category: t.category,
          requirementCount: t.requirements.length,
        })),
      );
      if (estimates.length === 0) {
        toast.error("Lara klarte ikke å lage estimater — 1 time per oppgave brukes som utgangspunkt.");
        return;
      }
      const next = { ...state.overrides };
      estimates.forEach((e) => {
        next[e.taskId] = {
          ...next[e.taskId],
          hoursMin: e.hoursMin,
          hoursMax: e.hoursMax,
          estimated: true,
          estimateNote: e.rationale,
        };
      });
      // Rydd bort foreldrede rene estimat-overrides som ikke lenger
      // matcher en oppgave (f.eks. fra estimering mot fallback-oppgaver).
      const taskIds = new Set(baseTasks.map((t) => t.id));
      Object.keys(next).forEach((id) => {
        const o = next[id];
        if (
          o?.estimated &&
          !taskIds.has(id) &&
          !o.removed &&
          !o.disabled &&
          !o.name &&
          o.priceOverride == null
        ) {
          delete next[id];
        }
      });
      persist({ ...state, overrides: next });
      toast.success("Lara har estimert timer per kontrollpunkt");
    } catch (e) {
      console.error("Lara-estimering feilet:", e);
      toast.error("Kunne ikke hente estimater fra Lara akkurat nå.");
    } finally {
      setEstimating(false);
    }
  };

  // Kjør estimering automatisk første gang sheetet åpnes for et regelverk
  // som verken har estimater eller manuelle timer fra før.
  useEffect(() => {
    // Vent til kravradene er lastet slik at estimeringen kjøres mot de
    // faktiske oppgavene — ikke fallback-oppgavene.
    if (!open || !frameworkId || isLoading || baseTasks.length === 0) return;
    if (estimateRanFor.current === frameworkId) return;
    const hasHours = Object.values(state.overrides).some((o) => o.hoursMin != null);
    if (hasHours) return;
    estimateRanFor.current = frameworkId;
    void runEstimation(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, frameworkId, baseTasks, isLoading]);

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
    setDraft({
      name: t.name,
      kind: t.kind,
      hours: String(t.hours.min),
      price:
        state.overrides[t.id]?.priceOverride != null
          ? String(state.overrides[t.id]!.priceOverride)
          : "",
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    const hours = Math.max(0, Number(draft.hours) || 0);
    const priceValue = draft.price.trim() === "" ? null : Math.max(0, Number(draft.price) || 0);
    persist({
      ...state,
      overrides: {
        ...state.overrides,
        [editingId]: {
          ...state.overrides[editingId],
          name: draft.name.trim() || undefined,
          kind: draft.kind,
          hoursMin: hours,
          hoursMax: hours,
          priceOverride: priceValue ?? undefined,
          // Manuelle justeringer erstatter Laras estimat
          estimated: false,
          estimateNote: undefined,
        },
      },
    });
    setEditingId(null);
  };

  const addCustom = () => {
    const name = draft.name.trim();
    if (!name) return;
    const hours = Math.max(0, Number(draft.hours) || 1);
    const priceValue = draft.price.trim() === "" ? null : Math.max(0, Number(draft.price) || 0);
    const id = `custom-${slugifyTaskName(name)}-${Date.now()}`;
    const nextCustom = {
      id,
      name,
      kind: draft.kind,
      hours: { min: hours, max: hours },
      note: "Egendefinert aktivitet.",
      laraDraft: false,
      category: "Egne aktiviteter",
      requirements: [],
      custom: true,
    };
    const nextOverrides =
      priceValue != null
        ? { ...state.overrides, [id]: { ...state.overrides[id], priceOverride: priceValue } }
        : state.overrides;
    const nextState = {
      ...state,
      overrides: nextOverrides,
      custom: [...state.custom, nextCustom],
    };
    const nextTotal = summarizePackage(resolveTasks(baseTasks, nextState, hourlyRate));
    persist(nextState);
    setAdding(false);
    setDraft({ name: "", kind: "advisory", hours: "", price: "" });
    toast.success(
      `Aktivitet «${name}» lagt til. Sluttsum oppdatert til ${formatPriceRange(nextTotal.price, currency)}.`,
    );
  };


  const effectiveName = (state.customName ?? "").trim() || `${frameworkName} rådgivning`;

  const buildPackage = (): SavedFrameworkPackage => ({
    frameworkId: frameworkId ?? "",
    frameworkName,
    name: effectiveName,
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
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_80px_110px_auto] gap-2 items-end rounded-md border border-border p-2 bg-muted/30">
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
        <Label className="text-[11px]">Timer</Label>
        <Input
          type="number"
          min={0}
          value={draft.hours}
          onChange={(e) => setDraft({ ...draft, hours: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px]">Fastpris</Label>
        <Input
          type="number"
          min={0}
          value={draft.price}
          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
          placeholder="Fra timer"
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
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0 space-y-1">
              <SheetTitle className="text-lg">Opprett tjenestepakke</SheetTitle>
              <p className="text-xs text-muted-foreground">Regelverk: {frameworkName}</p>
            </div>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="mt-1 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>
                    Gå gjennom krav og tilhørende oppgaver, juster antall timer, fjern det som ikke
                    er relevant, legg til egne aktiviteter og sett pris. Sluttsummen oppdateres
                    automatisk.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="mt-3 space-y-1">
            <Label htmlFor="pkg-name" className="text-[11px]">
              Lag ditt eget produktnavn på denne tjenestepakken
            </Label>
            <Input
              id="pkg-name"
              value={effectiveName}
              onChange={(e) => persist({ ...state, customName: e.target.value })}
              className="h-9 text-sm"
              placeholder={`${frameworkName} rådgivning`}
            />
          </div>
        </SheetHeader>

        <div className="sticky top-0 z-10 -mx-6 mt-0 px-6 py-3 border-b border-border bg-background/95 backdrop-blur space-y-1.5">
          <div className="flex items-end justify-between gap-3">
            {onSavePackage && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      className="h-9 shrink-0"
                      disabled={totals.tasks === 0}
                      onClick={() => onSavePackage(buildPackage(), state)}
                    >
                      Lagre pakke
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>
                      Pakken lagres med navn, timer og pris, og aktiveres i salgsporteføljen. Deretter kan du legge den til i tilbud til kunder.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              Koblet til aktivering av {frameworkName}. Når du lagrer, aktiveres pakken i
              salgsporteføljen og kan legges i tilbud til kunder.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {isActive && (
                <>
                  <Badge className="text-[10px] font-normal gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Aktivert i salgsporteføljen
                  </Badge>
                  {onToggleActive && (
                    <button
                      type="button"
                      className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                      onClick={() => onToggleActive(false)}
                    >
                      Fjern fra salgsporteføljen
                    </button>
                  )}
                </>
              )}
              {isSaved && !isActive && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  Pakke lagret
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2 rounded-md border border-border bg-muted/50 p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">Aktiveringspris</p>
              <p className="text-sm font-semibold text-foreground shrink-0">
                {formatPriceRange({ min: licensePrice, max: licensePrice }, currency)}/mnd
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">Oppgaver og timer</p>
              <p className="text-sm text-foreground shrink-0">
                {totals.tasks} oppgaver ·{" "}
                {totals.hours.min === totals.hours.max
                  ? `${fmtH(totals.hours.min)} timer`
                  : `${fmtH(totals.hours.min)}–${fmtH(totals.hours.max)} timer`}{" "}
                · {formatPriceRange(totals.price, currency)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-1.5">
              <p className="text-sm font-medium text-foreground">Sluttsum</p>
              <p className="text-sm font-semibold text-foreground shrink-0">
                {formatPriceRange(totals.price, currency)}
                {licensePrice > 0 && (
                  <>
                    {" "}+ {formatPriceRange({ min: licensePrice, max: licensePrice }, currency)}
                    /mnd aktivering
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-[10px] font-normal gap-1 cursor-help">
                    <Sparkles className="h-2.5 w-2.5" /> Timer foreslått av Lara
                  </Badge>
                </TooltipTrigger>

                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  Lara lager et grovt estimat per kontrollpunkt basert på type leveranse og hvor
                  mange krav som dekkes. Tallene er et utgangspunkt — juster dem etter egen
                  erfaring, og fjern oppgaver du ikke vil levere.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {estimating ? (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Lara estimerer timer…
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void runEstimation(true)}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline underline-offset-2"
              >
                <RefreshCw className="h-3 w-3" /> Estimer på nytt
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-5 pb-32">
          {isLoading && <p className="text-sm text-muted-foreground">Henter krav…</p>}

          {!isLoading && tasks.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted-foreground">
                Fjern haken på krav du ikke vil levere på — de tas ikke med i sluttsummen.
              </p>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs shrink-0"
                      onClick={() => {
                        setEditingId(null);
                        setDraft({ name: "", kind: "advisory", hours: "", price: "" });
                        setAdding(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Legg til aktivitet
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>
                      Legger til en egendefinert aktivitet med navn, type, timer og fastpris. Når du
                      lagrer, oppdateres sluttsummen automatisk.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {!isLoading && tasks.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Vi har ingen krav registrert for dette regelverket ennå.
              </p>
              <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Legg til aktivitet
              </Button>
            </div>
          )}

          {grouped.map(([category, items]) => (
            <Collapsible
              key={category}
              open={openCategories.has(category)}
              onOpenChange={(isOpen) => {
                setOpenCategories((prev) => {
                  const next = new Set(prev);
                  if (isOpen) next.add(category);
                  else next.delete(category);
                  return next;
                });
              }}
              className="space-y-2"
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-md border border-transparent px-1 py-1 text-left hover:bg-muted/40 transition-colors"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {category}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      openCategories.has(category) && "rotate-180",
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1.5 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xs font-medium text-foreground cursor-default">
                                {t.hours.min === t.hours.max
                                  ? `${fmtH(t.hours.min)} t`
                                  : `${fmtH(t.hours.min)}–${fmtH(t.hours.max)} t`}
                                {t.estimated && !t.edited && (
                                  <span className="ml-1 inline-flex items-center rounded border border-primary/20 bg-primary/5 px-1 text-[9px] font-normal text-primary align-middle">
                                    Lara
                                  </span>
                                )}
                              </p>
                            </TooltipTrigger>
                            {t.estimated && t.estimateNote && (
                              <TooltipContent side="left" className="max-w-xs text-xs">
                                Laras estimat: {t.estimateNote}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
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
              </CollapsibleContent>
            </Collapsible>
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
                    setDraft({ name: "", kind: "advisory", hours: "", price: "" });
                    setAdding(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Legg til aktivitet
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={reset}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Nullstill til forslag
                </Button>
              </div>
            )
          )}
        </div>

        <div className="sticky bottom-0 -mx-6 px-6 py-3 border-t border-border bg-background/95 backdrop-blur">
          <div className="flex items-center justify-end gap-3 flex-wrap">
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
