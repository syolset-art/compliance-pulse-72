import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Search, X, SlidersHorizontal, Sparkles, Lock, CheckCircle2 } from "lucide-react";
import { frameworks, categories, type Framework } from "@/lib/frameworkDefinitions";
import { toast } from "sonner";
import { FrameworkOrderConfirmDialog, type FrameworkOrderResult } from "./FrameworkOrderConfirmDialog";

interface Props {
  customerId: string;
  customerName: string;
  customer?: {
    industry?: string | null;
    employees?: string | null;
    country_code?: string | null;
    active_frameworks?: string[] | null;
    compliance_score?: number | null;
  };
}

const STORAGE_PREFIX = "msp.customer.activatedFrameworks.";

interface ActivatedRecord {
  id: string;
  orderedAt: string;
  method: "upload" | "declaration" | "legacy";
  evidenceName?: string;
  evidenceSize?: number;
  declarationText?: string;
}

function mapActiveFrameworkNames(names: string[] | null | undefined): string[] {
  if (!names?.length) return [];
  const ids: string[] = [];
  for (const n of names) {
    const norm = n.toLowerCase().replace(/[\s/-]/g, "");
    const match = frameworks.find((f) => {
      const fn = f.name.toLowerCase().replace(/[\s/-]/g, "");
      const fid = f.id.toLowerCase().replace(/[\s/-]/g, "");
      return fn.includes(norm) || norm.includes(fid) || fid === norm;
    });
    if (match) ids.push(match.id);
  }
  return ids;
}

function loadActivated(customerId: string, fallbackIds: string[]): ActivatedRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + customerId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return [];
        if (typeof parsed[0] === "string") {
          return (parsed as string[]).map((id) => ({
            id,
            orderedAt: new Date(0).toISOString(),
            method: "legacy" as const,
          }));
        }
        return parsed as ActivatedRecord[];
      }
    }
  } catch {}
  return fallbackIds.map((id) => ({
    id,
    orderedAt: new Date(0).toISOString(),
    method: "legacy" as const,
  }));
}

function saveActivated(customerId: string, records: ActivatedRecord[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + customerId, JSON.stringify(records));
  } catch {}
}

interface Recommendation {
  id: string;
  reason: string;
}

function computeRecommendations(customer?: Props["customer"]): Recommendation[] {
  const recs: Recommendation[] = [];
  const push = (id: string, reason: string) => {
    if (!recs.find((r) => r.id === id)) recs.push({ id, reason });
  };

  push("gdpr", "Gjelder alle som behandler personopplysninger");
  push("personopplysningsloven", "Norsk utfyllende lov til GDPR");

  const industry = (customer?.industry || "").toLowerCase();
  const employees = customer?.employees || "";
  const empNum = parseInt(employees.split("-")[0] || employees.replace("+", ""), 10) || 0;

  if (industry.includes("helse")) {
    push("normen", "Obligatorisk bransjenorm for helsesektoren");
    push("iso27701", "Anbefalt for behandling av sensitive helseopplysninger");
  }
  if (industry.includes("finans")) {
    push("dora", "Påkrevd for finanssektoren fra 2025");
    push("hvitvasking", "Rapporteringsplikt for finansforetak");
    push("iso27001", "Forventet standard hos finanskunder");
  }
  if (industry.includes("energi") || industry.includes("transport") || industry.includes("offentlig")) {
    push("nis2", "Kritisk sektor – omfattet av NIS2");
    push("nsm", "NSMs grunnprinsipper anbefales for kritisk infrastruktur");
  }
  if (industry.includes("teknologi")) {
    push("iso27001", "Forventet av B2B-kunder i teknologibransjen");
    push("soc2", "Ofte krevd av internasjonale (særlig amerikanske) kunder");
    push("ai-act", "Relevant hvis virksomheten utvikler eller bruker AI-systemer");
    push("cra", "Gjelder produkter med digitale elementer i EU");
  }
  if (industry.includes("bygg") || industry.includes("anlegg")) {
    push("iso45001", "Anbefalt HMS-standard for bygg og anlegg");
    push("internkontroll", "Pålagt for systematisk HMS-arbeid");
  }
  if (industry.includes("handel")) {
    push("apenhetsloven", "Relevant for leverandørkjeder i handel");
    push("bokforingsloven", "Krav til regnskap og dokumentasjon");
  }
  if (industry.includes("utdanning")) {
    push("normen", "Relevant ved behandling av elev-/studentopplysninger");
  }

  if (empNum >= 50) push("apenhetsloven", "Virksomheter over 50 ansatte kan være omfattet");
  if (empNum >= 200) {
    push("csrd", "Store virksomheter omfattes av bærekraftsrapportering");
    push("iso14001", "Anbefalt miljøledelse for større organisasjoner");
  }
  if (empNum >= 10) {
    push("internkontroll", "Lovpålagt systematisk HMS-arbeid");
    push("arbeidsmiljoloven", "Gjelder alle arbeidsgivere");
  }

  push("bokforingsloven", "Lovpålagt for alle registrerte virksomheter");
  push("hms", "Generell HMS-lovgivning gjelder alle arbeidsgivere");

  return recs;
}

function formatOrderedDate(iso: string) {
  try {
    const d = new Date(iso);
    if (d.getTime() === 0) return null;
    return d.toLocaleDateString("nb-NO", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return null;
  }
}

export function MSPCustomerRegulationsTab({ customerId, customerName, customer }: Props) {
  const customerActiveIds = useMemo(
    () => mapActiveFrameworkNames(customer?.active_frameworks),
    [customer?.active_frameworks]
  );
  const [activated, setActivated] = useState<ActivatedRecord[]>(() =>
    loadActivated(customerId, customerActiveIds)
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [pendingFramework, setPendingFramework] = useState<Framework | null>(null);

  useEffect(() => {
    setActivated(loadActivated(customerId, customerActiveIds));
  }, [customerId, customerActiveIds]);

  const activatedIds = useMemo(() => new Set(activated.map((a) => a.id)), [activated]);
  const activatedById = useMemo(() => {
    const m = new Map<string, ActivatedRecord>();
    activated.forEach((a) => m.set(a.id, a));
    return m;
  }, [activated]);

  const recommendations = useMemo(() => computeRecommendations(customer), [customer]);
  const recommendationMap = useMemo(() => {
    const m = new Map<string, string>();
    recommendations.forEach((r) => m.set(r.id, r.reason));
    return m;
  }, [recommendations]);

  const handleConfirmOrder = (result: FrameworkOrderResult) => {
    if (!pendingFramework) return;
    if (activatedIds.has(pendingFramework.id)) {
      setPendingFramework(null);
      return;
    }
    const record: ActivatedRecord = {
      id: pendingFramework.id,
      orderedAt: new Date().toISOString(),
      method: result.method,
      evidenceName: result.evidenceName,
      evidenceSize: result.evidenceSize,
      declarationText: result.declarationText,
    };
    const next = [...activated, record];
    setActivated(next);
    saveActivated(customerId, next);
    toast.success(`Bestilling registrert — ${pendingFramework.name}`, {
      description: `Regelverket er nå aktivt. Faktureres iht. partneravtalen.`,
    });
    setPendingFramework(null);
  };

  const q = query.trim().toLowerCase();
  const matches = (f: Framework) => {
    if (q && !(f.name.toLowerCase().includes(q) || (f.description || "").toLowerCase().includes(q))) {
      return false;
    }
    if (categoryFilter && f.category !== categoryFilter) return false;
    const isActive = activatedIds.has(f.id);
    if (statusFilter === "active" && !isActive) return false;
    if (statusFilter === "inactive" && isActive) return false;
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
    [q, categoryFilter, statusFilter, activatedIds]
  );

  const totalMatches = visibleCategories.reduce((s, c) => s + c.items.length, 0);

  return (
    <div>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søk regelverk eller standard…"
          className="pl-9 pr-9 h-10 rounded-full"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setQuery("")}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {q && (
        <p className="text-xs text-muted-foreground mt-2">
          {totalMatches} treff for «{query}»
        </p>
      )}

      {/* Filters */}
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
                categoryFilter ? "text-foreground" : ""
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtre
              {categoryFilter && (
                <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  1
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-3">
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Kategori
                </div>
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
              {categoryFilter && (
                <button
                  type="button"
                  onClick={() => setCategoryFilter(null)}
                  className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" /> Nullstill filtre
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-6 space-y-6">
        {visibleCategories.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Ingen regelverk matcher filtrene.
          </p>
        )}
        {visibleCategories.map(({ cat: category, items }) => {
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
                {items.map((f) => {
                  const isActive = activatedIds.has(f.id);
                  const isRecommended = !isActive && recommendationMap.has(f.id);
                  const reason = recommendationMap.get(f.id);
                  const record = isActive ? activatedById.get(f.id) : undefined;
                  const orderedDate = record ? formatOrderedDate(record.orderedAt) : null;

                  return (
                    <div
                      key={f.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                        isActive
                          ? "bg-primary/5 border-primary/20"
                          : "bg-muted/30 border-border"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{f.name}</span>
                          {f.isMandatory && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-status-followup/30 bg-status-followup/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-status-followup">
                              <Lock className="h-2.5 w-2.5" />
                              Påkrevd
                            </span>
                          )}
                          {isRecommended && reason && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  Anbefalt
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs max-w-[240px]">{reason}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {f.description}
                        </p>
                      </div>
                      {isActive ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="gap-1 border-success/40 text-success bg-success/5 shrink-0"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Aktivert
                            </Badge>
                          </TooltipTrigger>
                          {record && record.method !== "legacy" && (
                            <TooltipContent>
                              <p className="text-xs">
                                {orderedDate && <>Bestilt {orderedDate}<br /></>}
                                {record.method === "upload"
                                  ? `Vedlegg: ${record.evidenceName}`
                                  : "Partnerbekreftelse"}
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => setPendingFramework(f)}
                        >
                          Bestill
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <FrameworkOrderConfirmDialog
        open={!!pendingFramework}
        onOpenChange={(o) => !o && setPendingFramework(null)}
        framework={pendingFramework}
        customerName={customerName}
        onConfirm={handleConfirmOrder}
      />
    </div>
  );
}
