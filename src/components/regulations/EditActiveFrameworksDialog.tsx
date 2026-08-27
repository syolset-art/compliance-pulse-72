import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Search, X, ChevronDown, SlidersHorizontal, Sparkles, Eye } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { frameworks, categories, type Framework } from "@/lib/frameworkDefinitions";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CountryScopeBar } from "./CountryScopeBar";
import { RequestCountrySupportDialog } from "./RequestCountrySupportDialog";
import { SUPPORTED_COUNTRIES, getCountry, type CountryScope } from "./countryScopeData";
import { FrameworkCountryTag } from "./FrameworkCountryTag";

interface EditActiveFrameworksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFrameworkIds: Set<string>;
  onToggle: (frameworkId: string, currentlyActive: boolean) => void;
  updatingId: string | null;
  countryScope?: CountryScope;
  onEditCountries?: () => void;
  /** MSP: per-framework recommendation reasons keyed by framework id */
  recommendations?: Map<string, string>;
  /** MSP: when provided, shows a "Forhåndsvis gap-analyse" button per inactive framework */
  onPreview?: (framework: Framework) => void;
  /** Override the sheet title (e.g. for partner context) */
  title?: string;
  /** Override the sheet description */
  description?: string;
  /** Aktiver flere regelverk samtidig. Når satt, vises avkryssingsbokser. */
  onActivateMany?: (frameworkIds: string[]) => void;
}

export const EditActiveFrameworksDialog = ({
  open,
  onOpenChange,
  activeFrameworkIds,
  onToggle,
  updatingId,
  countryScope,
  onEditCountries,
  recommendations,
  onPreview,
  title,
  description,
  onActivateMany,
}: EditActiveFrameworksDialogProps) => {
  const [multiSelected, setMultiSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [jurExpanded, setJurExpanded] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  // IDs that the user toggled during this session — kept visible regardless of status filter
  // so frameworks don't disappear from the list when activated/deactivated.
  const [stickyIds, setStickyIds] = useState<Set<string>>(new Set());

  const handleToggle = (frameworkId: string, currentlyActive: boolean) => {
    setStickyIds((prev) => {
      const next = new Set(prev);
      next.add(frameworkId);
      return next;
    });
    onToggle(frameworkId, currentlyActive);
  };

  const toggleMulti = (frameworkId: string) => {
    setMultiSelected((prev) => {
      const next = new Set(prev);
      if (next.has(frameworkId)) next.delete(frameworkId);
      else next.add(frameworkId);
      return next;
    });
  };

  const q = search.trim().toLowerCase();
  const matches = (fw: Framework) => {
    if (q && !(
      fw.name.toLowerCase().includes(q) ||
      (fw.description || "").toLowerCase().includes(q) ||
      (fw.id || "").toLowerCase().includes(q)
    )) return false;
    if (categoryFilter && fw.category !== categoryFilter) return false;
    if (countryFilter.length) {
      const allowedIds = new Set<string>();
      countryFilter.forEach((code) => {
        getCountry(code)?.frameworkIds.forEach((id) => allowedIds.add(id));
      });
      if (!allowedIds.has(fw.id)) return false;
    }
    if (!stickyIds.has(fw.id)) {
      if (statusFilter === "active" && !activeFrameworkIds.has(fw.id)) return false;
      if (statusFilter === "inactive" && activeFrameworkIds.has(fw.id)) return false;
    }
    return true;
  };

  const visibleCategories = useMemo(
    () =>
      categories
        .map((cat) => ({
          cat,
          items: frameworks.filter((f) => f.category === cat.id && matches(f)),
        }))
        .filter((c) => c.items.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, categoryFilter, countryFilter, statusFilter, activeFrameworkIds]
  );

  const totalMatches = visibleCategories.reduce((s, c) => s + c.items.length, 0);
  const hasActiveFilter = !!categoryFilter || countryFilter.length > 0 || statusFilter !== "all";
  const availableCountries = countryScope?.countries?.length
    ? SUPPORTED_COUNTRIES.filter((c) => countryScope.countries.includes(c.code))
    : SUPPORTED_COUNTRIES;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title ?? "Rediger aktive regelverk og standarder"}</SheetTitle>
          <SheetDescription>
            {description ?? "Aktiver eller deaktiver regelverk og standarder for din virksomhet"}
          </SheetDescription>
        </SheetHeader>

        {/* Country scope — collapsed by default */}
        {countryScope && onEditCountries && (
          <div className="mt-5 border border-border/70 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setJurExpanded((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
            >
              <span className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-foreground">Land</span>
                <span className="text-[12px] text-muted-foreground">
                  {countryScope.countries.length} valgt
                </span>
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${jurExpanded ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {jurExpanded && (
              <div className="border-t border-border/70 px-3 py-2.5">
                <CountryScopeBar scope={countryScope} onEdit={onEditCountries} />
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="mt-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk regelverk eller standard…"
            className="pl-9 pr-9 h-10 rounded-full"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSearch("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {q && (
          <p className="text-xs text-muted-foreground mt-2">
            {totalMatches} treff for «{search}»
          </p>
        )}

        {/* Filters — status inline, rest behind icon */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
          <div className="flex items-center gap-2">
            {(["active", "inactive", "all"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`transition-colors hover:text-foreground ${
                  statusFilter === s ? "text-foreground font-medium" : ""
                }`}
              >
                {s === "all" ? "Alle" : s === "active" ? "Aktive" : "Ikke aktive"}
              </button>
            ))}
          </div>

          <span aria-hidden className="h-3 w-px bg-border" />

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Flere filtre"
                className={`relative inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:text-foreground hover:bg-muted ${
                  categoryFilter || countryFilter.length ? "text-foreground" : ""
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtre
                {(categoryFilter || countryFilter.length) && (
                  <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                    {(categoryFilter ? 1 : 0) + countryFilter.length}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-3">
              <div className="space-y-3">
                <div>
                  <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Kategori</div>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat) => {
                      const active = categoryFilter === cat.id;
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryFilter(active ? null : cat.id)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] transition-colors ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {availableCountries.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Land</div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableCountries.map((c) => {
                        const active = countryFilter.includes(c.code);
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() =>
                              setCountryFilter((prev) =>
                                active ? prev.filter((x) => x !== c.code) : [...prev, c.code]
                              )
                            }
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] transition-colors ${
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:bg-muted"
                            }`}
                          >
                            <span aria-hidden>{c.flag}</span>
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(categoryFilter || countryFilter.length) && (
                  <button
                    type="button"
                    onClick={() => { setCategoryFilter(null); setCountryFilter([]); }}
                    className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" /> Nullstill filtre
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>


        {/* Country detail panel — when one or more country filters are active */}
        {countryFilter.length > 0 && (
          <div className="mt-3 space-y-2">
            {countryFilter.map((code) => {
              const c = getCountry(code);
              if (!c) return null;
              const ids = c.frameworkIds;
              const inCatalog = frameworks.filter((f) => ids.includes(f.id));
              const activeCount = inCatalog.filter((f) => activeFrameworkIds.has(f.id)).length;
              return (
                <div key={code} className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <span aria-hidden>{c.flag}</span>
                      {c.name}
                    </div>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {inCatalog.length} regelverk i katalogen · {activeCount} aktive
                    </p>
                  </div>
                  {inCatalog.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1">
                      {inCatalog.map((f) => {
                        const on = activeFrameworkIds.has(f.id);
                        return (
                          <li
                            key={f.id}
                            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[12px] ${
                              on
                                ? "border-primary/30 bg-primary/10 text-foreground"
                                : "border-border bg-background text-muted-foreground"
                            }`}
                            title={on ? "Aktiv" : "Ikke aktiv"}
                          >
                            <span
                              aria-hidden
                              className={`h-1.5 w-1.5 rounded-full ${on ? "bg-primary" : "bg-muted-foreground/40"}`}
                            />
                            {f.name}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 space-y-6">

          {visibleCategories.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Ingen regelverk matcher filtrene.
            </p>
          )}
          {visibleCategories.map(({ cat: category, items: categoryFrameworks }) => {
            const CategoryIcon = category.icon;

            return (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${category.bgColor}`}>
                    <CategoryIcon className={`h-4 w-4 ${category.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">{category.name}</h3>
                </div>
                <div className="space-y-2">
                  {categoryFrameworks.map((fw) => {
                    const isActive = activeFrameworkIds.has(fw.id);

                    return (
                      <div
                        key={fw.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                          isActive
                            ? "bg-primary/5 border-primary/20"
                            : "bg-muted/30 border-border"
                        }`}
                      >
                        {onActivateMany && !isActive && (
                          <Checkbox
                            checked={multiSelected.has(fw.id)}
                            onCheckedChange={() => toggleMulti(fw.id)}
                            aria-label={`Velg ${fw.name} for aktivering`}
                            className="mt-0.5 shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {(() => {
                              const scopeCodes = (countryScope?.countries ?? []).filter((cc) =>
                                getCountry(cc)?.frameworkIds.includes(fw.id)
                              );
                              return scopeCodes.length > 0
                                ? <FrameworkCountryTag codes={scopeCodes} />
                                : <FrameworkCountryTag frameworkId={fw.id} />;
                            })()}
                            <span className={`font-medium text-sm`}>
                              {fw.name}
                            </span>
                            <PinBadge pin={getFrameworkPin(fw.id)} size="xs" />

                            {recommendations?.has(fw.id) && !isActive && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    Anbefalt
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-[240px]">{recommendations.get(fw.id)}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{fw.description}</p>
                          {onPreview && !isActive && (
                            <button
                              type="button"
                              onClick={() => onPreview(fw)}
                              className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Eye className="h-3 w-3" />
                              Forhåndsvis gap-analyse
                            </button>
                          )}
                        </div>
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => handleToggle(fw.id, isActive)}
                          disabled={updatingId === fw.id}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    );
                  })}
                </div>
                <Separator className="mt-4" />
              </div>
            );
          })}
        </div>
        {onActivateMany && multiSelected.size > 0 && (
          <div className="sticky bottom-0 -mx-6 mt-4 border-t border-border bg-background px-6 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-foreground">
                {multiSelected.size} valgt{multiSelected.size === 1 ? "" : "e"} regelverk
              </p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setMultiSelected(new Set())}>
                  Nullstill
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onActivateMany(Array.from(multiSelected));
                    setMultiSelected(new Set());
                  }}
                >
                  Aktiver valgte
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
      <RequestCountrySupportDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </Sheet>
  );
};
