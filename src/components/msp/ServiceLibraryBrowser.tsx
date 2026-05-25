import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, Check, Clock, Plus, Search, Globe, LayoutGrid, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SERVICE_LIBRARY,
  curateServiceLibrary,
  tierLabel,
  scopeLabel,
  industryLabel,
  deliveryLabel,
  formatEstimatedPrice,
  formatHoursRange,
  type ServiceTemplate,
  type ServiceTier,
  type ServiceScope,
  type ServicePartnerType,
  type ServiceIndustry,
  type PartnerContext,
} from "@/lib/serviceLibrary";

interface Props {
  context: PartnerContext;
  adoptedIds: Set<string>;
  onAdopt: (template: ServiceTemplate) => void;
  /** Partnerens egen timepris — alle priser beregnes herfra. */
  hourlyRate: number;
}

const TIER_ORDER: ServiceTier[] = ["universal", "msp", "mssp", "regional"];
const ALL_SCOPES: ServiceScope[] = ["global", "EU", "NO", "SE", "NL", "AU", "US"];
const ALL_INDUSTRIES: ServiceIndustry[] = ["healthcare", "finance", "public", "critical-infrastructure"];

export function ServiceLibraryBrowser({ context, adoptedIds, onAdopt, hourlyRate }: Props) {
  const [search, setSearch] = useState("");
  const [partnerFilter, setPartnerFilter] = useState<ServicePartnerType | "any">(context.partnerType ?? "any");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [industryFilter, setIndustryFilter] = useState<ServiceIndustry | "all">("all");
  const [tierFilter, setTierFilter] = useState<ServiceTier | "all">("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");


  const ranked = useMemo(() => {
    const effectiveCtx: PartnerContext = {
      ...context,
      partnerType: partnerFilter === "any" ? context.partnerType : partnerFilter,
    };
    return curateServiceLibrary(effectiveCtx).filter(({ template }) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !template.name.toLowerCase().includes(q) &&
          !template.shortDescription.toLowerCase().includes(q) &&
          !template.code.toLowerCase().includes(q)
        ) return false;
      }
      if (partnerFilter !== "any" && template.partnerType !== "all" && template.partnerType !== partnerFilter) return false;
      if (scopeFilter !== "all" && !template.scopes.includes(scopeFilter)) return false;
      if (industryFilter !== "all" && !(template.industries ?? []).includes(industryFilter)) return false;
      if (tierFilter !== "all" && template.tier !== tierFilter) return false;
      return true;
    });
  }, [context, search, partnerFilter, scopeFilter, industryFilter, tierFilter]);

  // Top picks: top 3 by score
  const topPicks = ranked.slice(0, 3);

  // Grouped by tier
  const byTier = useMemo(() => {
    const map = new Map<ServiceTier, typeof ranked>();
    TIER_ORDER.forEach((t) => map.set(t, []));
    ranked.forEach((r) => map.get(r.template.tier)!.push(r));
    return map;
  }, [ranked]);

  return (
    <div className="space-y-5">
      {/* Filter / søk */}
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk i biblioteket..."
            className="h-9 pl-8 text-sm"
          />
        </div>
        <FilterSelect
          label="Type"
          value={partnerFilter}
          onChange={(v) => setPartnerFilter(v as ServicePartnerType | "any")}
          options={[
            { value: "any", label: "Alle" },
            { value: "msp", label: "MSP" },
            { value: "mssp", label: "MSSP" },
            { value: "all", label: "Universell" },
          ]}
        />
        <FilterSelect
          label="Marked"
          value={scopeFilter}
          onChange={(v) => setScopeFilter(v as ScopeFilter)}
          options={[
            { value: "all", label: "Alle" },
            ...ALL_SCOPES.map((s) => ({ value: s, label: scopeLabel(s) })),
          ]}
        />
        <FilterSelect
          label="Bransje"
          value={industryFilter}
          onChange={(v) => setIndustryFilter(v as ServiceIndustry | "all")}
          options={[
            { value: "all", label: "Alle" },
            ...ALL_INDUSTRIES.map((i) => ({ value: i, label: industryLabel(i) })),
          ]}
        />
        <FilterSelect
          label="Lag"
          value={tierFilter}
          onChange={(v) => setTierFilter(v as ServiceTier | "all")}
          options={[
            { value: "all", label: "Alle" },
            ...TIER_ORDER.map((t) => ({ value: t, label: tierLabel(t) })),
          ]}
        />
        <div className="ml-auto inline-flex items-center rounded-md border border-border bg-background p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
              viewMode === "table" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={viewMode === "table"}
          >
            <Rows3 className="h-3.5 w-3.5" /> Tabell
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
              viewMode === "cards" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={viewMode === "cards"}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Bokser
          </button>
        </div>
      </Card>

      {/* Lara top picks */}
      {topPicks.length > 0 && (search === "" && partnerFilter === (context.partnerType ?? "any") && scopeFilter === "all" && industryFilter === "all" && tierFilter === "all") && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">Lara anbefaler for deg</h3>
            <span className="text-xs text-muted-foreground">basert på partnertype og kundeportefølje</span>
          </div>
          {viewMode === "cards" ? (
            <div className="grid gap-3 md:grid-cols-3">
              {topPicks.map(({ template, reasons }) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  adopted={adoptedIds.has(template.id)}
                  onAdopt={() => onAdopt(template)}
                  reasons={reasons}
                  highlighted
                  hourlyRate={hourlyRate}
                />
              ))}
            </div>
          ) : (
            <TemplateTable
              items={topPicks}
              adoptedIds={adoptedIds}
              onAdopt={onAdopt}
              hourlyRate={hourlyRate}
              highlighted
            />
          )}
        </section>
      )}

      {/* Grupper per lag */}
      {TIER_ORDER.map((tier) => {
        const items = byTier.get(tier) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={tier} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{tierLabel(tier)}</h3>
              <span className="text-xs text-muted-foreground tabular-nums">{items.length} tjenester</span>
            </div>
            {viewMode === "cards" ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map(({ template }) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    adopted={adoptedIds.has(template.id)}
                    onAdopt={() => onAdopt(template)}
                    hourlyRate={hourlyRate}
                  />
                ))}
              </div>
            ) : (
              <TemplateTable
                items={items}
                adoptedIds={adoptedIds}
                onAdopt={onAdopt}
                hourlyRate={hourlyRate}
              />
            )}
          </section>
        );
      })}

      {ranked.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Ingen tjenester matchet filterne dine.
        </Card>
      )}
    </div>
  );
}

type ScopeFilter = ServiceScope | "all";

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function TemplateCard({
  template, adopted, onAdopt, reasons, highlighted, hourlyRate,
}: {
  template: ServiceTemplate;
  adopted: boolean;
  onAdopt: () => void;
  reasons?: string[];
  highlighted?: boolean;
  hourlyRate: number;
}) {
  return (
    <Card className={cn(
      "p-3 flex flex-col gap-2 transition-colors",
      highlighted && "border-primary/30 bg-primary/[0.03]",
      adopted && "opacity-70",
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {template.code}
            </span>
            <Badge variant="outline" className="text-xs h-5">
              {deliveryLabel(template.delivery)}
            </Badge>
            {template.partnerType !== "all" && (
              <Badge variant="secondary" className="text-xs h-5">
                {template.partnerType.toUpperCase()}
              </Badge>
            )}
          </div>
          <h4 className="text-sm font-semibold text-foreground mt-1.5 leading-tight">{template.name}</h4>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-snug line-clamp-3">{template.shortDescription}</p>

      {/* Scope og bransje */}
      <div className="flex flex-wrap items-center gap-1">
        {template.scopes.map((s) => (
          <span key={s} className="inline-flex items-center gap-0.5 rounded-full bg-muted/60 px-1.5 py-0.5 text-xs text-muted-foreground">
            <Globe className="h-2.5 w-2.5" /> {scopeLabel(s)}
          </span>
        ))}
        {(template.industries ?? []).map((i) => (
          <span key={i} className="inline-flex items-center rounded-full bg-accent/40 px-1.5 py-0.5 text-xs text-foreground">
            {industryLabel(i)}
          </span>
        ))}
      </div>

      {/* KP-mapping */}
      <div className="flex flex-wrap gap-1">
        {template.mappings.map((m, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{m.frameworkLabel}</span>
            <span className="text-[9px]">{m.controlIds.slice(0, 2).join(", ")}{m.controlIds.length > 2 ? "…" : ""}</span>
          </span>
        ))}
      </div>

      {/* Lara-grunner */}
      {reasons && reasons.length > 0 && (
        <div className="rounded-md bg-primary/5 border border-primary/15 px-2 py-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary inline-flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" /> Hvorfor relevant
          </p>
          <ul className="text-xs text-foreground mt-0.5 space-y-0.5">
            {reasons.slice(0, 2).map((r, i) => <li key={i}>· {r}</li>)}
          </ul>
        </div>
      )}

      {/* Footer: pris, adopter */}
      <div className="mt-auto pt-2 border-t border-border space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Estimert pris</span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatEstimatedPrice(template.estimatedHours, hourlyRate)}
          </span>
        </div>
        <Button
          size="sm"
          variant={adopted ? "outline" : "default"}
          className="w-full h-8 text-xs gap-1"
          onClick={onAdopt}
          disabled={adopted}
        >
          {adopted ? <><Check className="h-3.5 w-3.5" /> Adoptert</> : <><Plus className="h-3.5 w-3.5" /> Adopter</>}
        </Button>
      </div>
    </Card>
  );
}

function TemplateTable({
  items,
  adoptedIds,
  onAdopt,
  hourlyRate,
  highlighted,
}: {
  items: { template: ServiceTemplate; reasons?: string[] }[];
  adoptedIds: Set<string>;
  onAdopt: (template: ServiceTemplate) => void;
  hourlyRate: number;
  highlighted?: boolean;
}) {
  return (
    <Card className={cn("overflow-hidden", highlighted && "border-l-2 border-l-primary/50")}>
      <table className="w-full text-[13px]">
        <colgroup>
          <col className="w-[72px]" />
          <col />
          <col className="w-[220px]" />
          <col className="w-[110px]" />
          <col className="w-[110px]" />
          <col className="w-[110px]" />
        </colgroup>
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
            <th className="h-8 px-3 text-left font-medium">Kode</th>
            <th className="h-8 px-3 text-left font-medium">Tjeneste</th>
            <th className="h-8 px-3 text-left font-medium hidden lg:table-cell">Regelverk</th>
            <th className="h-8 px-3 text-left font-medium hidden md:table-cell">Marked</th>
            <th className="h-8 px-3 text-right font-medium">Estimert pris</th>
            <th className="h-8 px-3 text-right font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {items.map(({ template, reasons }) => {
            const adopted = adoptedIds.has(template.id);
            const isLara = reasons && reasons.length > 0;
            const frameworks = template.mappings.map((m) => m.frameworkLabel);
            const fwShown = frameworks.slice(0, 3).join(", ");
            const fwMore = frameworks.length > 3 ? ` +${frameworks.length - 3}` : "";
            const scopes = template.scopes.slice(0, 3).map((s) => scopeLabel(s)).join(" · ");
            return (
              <tr
                key={template.id}
                className={cn(
                  "transition-colors hover:bg-muted/30",
                  adopted && "opacity-50",
                )}
              >
                <td className="px-3 py-2 align-top">
                  <span className="font-mono text-[11px] text-muted-foreground">{template.code}</span>
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isLara && (
                      <Sparkles
                        className="h-3 w-3 text-primary shrink-0"
                        aria-label="Lara anbefaler"
                      />
                    )}
                    <span className="font-medium text-foreground truncate">{template.name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {template.shortDescription}
                  </p>
                </td>
                <td className="px-3 py-2 align-top hidden lg:table-cell text-[12px] text-muted-foreground">
                  {fwShown || "—"}
                  {fwMore && <span className="text-muted-foreground/70">{fwMore}</span>}
                </td>
                <td className="px-3 py-2 align-top hidden md:table-cell text-[12px] text-muted-foreground">
                  {scopes || "—"}
                </td>
                <td className="px-3 py-2 align-top text-right tabular-nums font-semibold text-foreground">
                  {formatEstimatedPrice(template.estimatedHours, hourlyRate)}
                </td>
                <td className="px-3 py-2 align-top text-right">
                  <Button
                    size="sm"
                    variant={adopted ? "ghost" : "outline"}
                    className="h-7 text-xs gap-1"
                    onClick={() => onAdopt(template)}
                    disabled={adopted}
                    aria-label={adopted ? "Adoptert" : "Adopter tjeneste"}
                  >
                    {adopted ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" /> Adopter
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

