import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Lock, AlertTriangle, Search, X, ChevronDown } from "lucide-react";
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

interface EditActiveFrameworksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFrameworkIds: Set<string>;
  onToggle: (frameworkId: string, currentlyActive: boolean) => void;
  updatingId: string | null;
  countryScope?: CountryScope;
  onEditCountries?: () => void;
}

export const EditActiveFrameworksDialog = ({
  open,
  onOpenChange,
  activeFrameworkIds,
  onToggle,
  updatingId,
  countryScope,
  onEditCountries,
}: EditActiveFrameworksDialogProps) => {
  const [search, setSearch] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [jurExpanded, setJurExpanded] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const q = search.trim().toLowerCase();
  const matches = (fw: Framework) => {
    if (q && !(
      fw.name.toLowerCase().includes(q) ||
      (fw.description || "").toLowerCase().includes(q) ||
      (fw.id || "").toLowerCase().includes(q)
    )) return false;
    if (categoryFilter && fw.category !== categoryFilter) return false;
    if (countryFilter) {
      const ids = new Set(getCountry(countryFilter)?.frameworkIds ?? []);
      if (!ids.has(fw.id)) return false;
    }
    if (statusFilter === "active" && !activeFrameworkIds.has(fw.id)) return false;
    if (statusFilter === "inactive" && activeFrameworkIds.has(fw.id)) return false;
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
  const hasActiveFilter = !!categoryFilter || !!countryFilter || statusFilter !== "all";
  const availableCountries = countryScope?.countries?.length
    ? SUPPORTED_COUNTRIES.filter((c) => countryScope.countries.includes(c.code))
    : SUPPORTED_COUNTRIES;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Rediger aktive regelverk og standarder</SheetTitle>
          <SheetDescription>
            Aktiver eller deaktiver regelverk og standarder for din virksomhet
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
              <span className="text-sm font-semibold text-foreground">Jurisdiksjon</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${jurExpanded ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {jurExpanded && (
              <div className="border-t border-border/70 px-3 py-2.5">
                <CountryScopeBar scope={countryScope} onEdit={onEditCountries} onRequest={() => setRequestOpen(true)} />
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

        {/* Filters */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mr-1">Filter</span>

          {/* Status */}
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                statusFilter === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {s === "all" ? "Alle" : s === "active" ? "Aktive" : "Ikke aktive"}
            </button>
          ))}

          <span aria-hidden className="mx-1 h-4 w-px bg-border" />

          {/* Categories */}
          {categories.map((cat) => {
            const active = categoryFilter === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(active ? null : cat.id)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
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

          {availableCountries.length > 0 && (
            <span aria-hidden className="mx-1 h-4 w-px bg-border" />
          )}

          {/* Countries */}
          {availableCountries.map((c) => {
            const active = countryFilter === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setCountryFilter(active ? null : c.code)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
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

          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => { setCategoryFilter(null); setCountryFilter(null); setStatusFilter("all"); }}
              className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-3 w-3" />
              Nullstill
            </button>
          )}
        </div>


        <div className="mt-6 space-y-6">
          {visibleCategories.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Ingen regelverk matcher søket.
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
                    const isMandatory = fw.isMandatory;
                    const isMandatoryButOff = isMandatory && !isActive;

                    return (
                      <div
                        key={fw.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                          isMandatoryButOff
                            ? "bg-destructive/5 border-destructive/30"
                            : isActive
                              ? "bg-primary/5 border-primary/20"
                              : "bg-muted/30 border-border"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium text-sm ${isMandatoryButOff ? "text-destructive" : ""}`}>
                              {fw.name}
                            </span>
                            {isMandatory && (
                              <Tooltip>
                                <TooltipTrigger>
                                  {countryScope?.mode === "multi" ? (
                                    <span
                                      className="inline-flex items-center gap-1 rounded-md border border-status-followup/30 bg-status-followup/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-status-followup"
                                      aria-label="Påkrevd ved lov"
                                    >
                                      <Lock className="h-2.5 w-2.5" />
                                      Påkrevd
                                    </span>
                                  ) : (
                                    <Badge
                                      className="text-[13px] px-2 py-0.5 gap-1 bg-status-followup text-white hover:bg-status-followup/90 uppercase tracking-wider rounded-pill border-transparent font-semibold"
                                    >
                                      <Lock className="h-2.5 w-2.5" />
                                      Påkrevd ved lov
                                    </Badge>
                                  )}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">
                                    {isMandatoryButOff
                                      ? "⚠️ Dette regelverket er lovpålagt men er deaktivert. Du bør aktivere det."
                                      : "Lovpålagt for alle norske virksomheter"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{fw.description}</p>
                          {isMandatoryButOff && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                              <span className="text-[13px] text-destructive font-medium">
                                Lovpålagt regelverk er deaktivert — anbefales å aktivere
                              </span>
                            </div>
                          )}
                        </div>
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => onToggle(fw.id, isActive)}
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
      </SheetContent>
      <RequestCountrySupportDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </Sheet>
  );
};
