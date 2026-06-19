import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreVertical, Database, Trash2, LayoutGrid, Rows3, Search, ArrowUp, ArrowDown, ArrowUpDown, Users, ArrowRight, Filter, X } from "lucide-react";
import { MSPCustomerCard } from "@/components/msp/MSPCustomerCard";
import { AddMSPCustomerDialog } from "@/components/msp/AddMSPCustomerDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { seedDemoMSP, deleteDemoMSP } from "@/lib/demoSeedMSP";
import { toast } from "sonner";

type ViewMode = "cards" | "table";

// Trust Profile (TP) lifecycle status — what stage the customer's TP is in
type TPStatusKey = "draft" | "onboarding" | "claimed" | "published";

function deriveTPStatus(c: any): TPStatusKey {
  // Explicit published flag wins
  if (c.tp_published || c.is_published) return "published";
  // Onboarded + decent maturity → treat as published in demo
  if (c.onboarding_completed && (c.compliance_score || 0) >= 70) return "published";
  // Onboarded but not yet published → customer has claimed/taken over the TP
  if (c.onboarding_completed || c.status === "active") return "claimed";
  if (c.status === "onboarding") return "onboarding";
  return "draft";
}

const TP_STATUS_LABEL: Record<TPStatusKey, string> = {
  draft: "Utkast",
  onboarding: "Aktivert",
  claimed: "Utkast",
  published: "Publisert",
};

const TP_STATUS_TONE: Record<TPStatusKey, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  onboarding: "bg-warning/10 text-warning border-warning/20",
  claimed: "bg-muted text-muted-foreground border-border",
  published: "bg-success/10 text-success border-success/20",
};

const TP_STATUS_ORDER: Record<TPStatusKey, number> = { draft: 0, onboarding: 1, claimed: 2, published: 3 };

// Derived criticality based on industry + size — purely presentational
const HIGH_CRIT_INDUSTRIES = new Set(["Energi", "Helse", "Finans"]);
const MED_CRIT_INDUSTRIES = new Set(["Teknologi", "Transport", "Utdanning"]);
function deriveCriticality(c: any): { key: "high" | "medium" | "low"; label: string; tone: string } {
  const ind = c.industry || "";
  const emp = c.employees || "";
  const big = /201|500|1000|\+/.test(emp);
  if (HIGH_CRIT_INDUSTRIES.has(ind) || big) return { key: "high", label: "Høy", tone: "bg-crit-high-soft text-crit-high-fg border border-crit-high" };
  if (MED_CRIT_INDUSTRIES.has(ind)) return { key: "medium", label: "Moderat", tone: "bg-crit-moderate-soft text-crit-moderate-fg border border-crit-moderate" };
  return { key: "low", label: "Lav", tone: "bg-crit-low-soft text-crit-low-fg border border-crit-low" };
}

// Suggested services Lara recommends — MUST match titles used in MSPMaturityServiceMatrix
// (Anbefalte tjenester på kundens TP-detaljside) slik at klikk fra tabellen lander på riktig kort.
function deriveNeededServices(c: any): string[] {
  const services: string[] = [];
  const score = c.compliance_score || 0;
  const frameworks: string[] = c.active_frameworks || [];
  const ind = c.industry || "";

  // NIS2 — kritiske bransjer eller manglende rammeverk
  if (HIGH_CRIT_INDUSTRIES.has(ind) || ind === "Energi" || ind === "Transport" || ind === "Helse" || ind === "Finans") {
    services.push("NIS2-klargjøring");
  }

  // AI Governance — moden nok til å adressere AI, eller tech/finans
  if (score < 60 || ind === "Finans" || ind === "Teknologi") {
    services.push("AI Governance-rammeverk");
  }

  // Penetrasjonstest — har eller bør ha ISO 27001
  if (frameworks.includes("ISO 27001") || score >= 50) {
    services.push("Penetrasjonstest");
  }

  // Fallback: alltid foreslå noe når kunden er umoden
  if (services.length === 0) {
    services.push("NIS2-klargjøring", "AI Governance-rammeverk");
  }

  return Array.from(new Set(services)).slice(0, 3);
}

// Typical MSP/MSSP groupings — derived from existing customer data
const SECURITY_FRAMEWORKS = new Set(["ISO 27001", "NIS2", "NIS 2", "CIS", "SOC 2", "Cyber Essentials"]);
function deriveServiceType(c: any): "mssp" | "msp" | "hybrid" {
  const frameworks: string[] = c.active_frameworks || [];
  const securityHits = frameworks.filter((f) => SECURITY_FRAMEWORKS.has(f)).length;
  const otherHits = frameworks.length - securityHits;
  if (securityHits >= 2 || (securityHits >= 1 && otherHits === 0 && frameworks.length > 0)) return "mssp";
  if (securityHits >= 1 && otherHits >= 1) return "hybrid";
  return "msp";
}
const SERVICE_TYPE_LABEL: Record<"mssp" | "msp" | "hybrid", string> = {
  mssp: "MSSP (sikkerhet)",
  msp: "MSP (drift/IT)",
  hybrid: "Hybrid",
};

function deriveSegment(c: any): "smb" | "midmarket" | "enterprise" {
  const emp = String(c.employees || "");
  if (/500|1000|\+/.test(emp)) return "enterprise";
  if (/201|51-|11-50/.test(emp)) {
    if (/201|500/.test(emp)) return "midmarket";
  }
  if (/201/.test(emp)) return "midmarket";
  if (/51-200|51-/.test(emp)) return "midmarket";
  return "smb";
}
const SEGMENT_LABEL: Record<"smb" | "midmarket" | "enterprise", string> = {
  smb: "SMB (≤50)",
  midmarket: "Mid-market (51–200)",
  enterprise: "Enterprise (200+)",
};


function ScoreCircle({ score }: { score: number }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score, 0), 100);
  const dash = `${(pct / 100) * c} ${c}`;
  const color =
    pct >= 75 ? "text-success"
    : pct >= 50 ? "text-warning"
    : "text-destructive";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 36, height: 36 }}>
      <svg width="36" height="36" className="-rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
        <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={dash} className={color} strokeLinecap="round" />
      </svg>
      <span className={cn("absolute text-[11px] font-semibold tabular-nums", color)}>{pct}%</span>
    </div>
  );
}

type SortKey = "customer_name" | "country_code" | "tp_status" | "compliance_score";
type SortDir = "asc" | "desc";

function ColumnFilter({
  label,
  options,
  selected,
  onChange,
  iconOnly = false,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  iconOnly?: boolean;
}) {
  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };
  const active = selected.length > 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded text-sm font-medium hover:text-foreground transition-colors",
            active ? "text-primary" : "text-foreground/80",
          )}
        >
          {!iconOnly && <span>{label}</span>}
          <Filter className={cn("h-3.5 w-3.5 shrink-0", active ? "opacity-100" : "opacity-60")} aria-hidden="true" />
          {active && (
            <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary/15 text-primary text-[12px] font-semibold h-4 min-w-4 px-1 tabular-nums">
              {selected.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 max-h-72 overflow-auto">
        <DropdownMenuLabel className="text-xs">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Ingen valg</div>
        ) : (
          options.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={selected.includes(opt.value)}
              onSelect={(e) => { e.preventDefault(); toggle(opt.value); }}
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))
        )}
        {active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onChange([]); }} className="text-xs text-muted-foreground">
              <X className="h-3 w-3 mr-1.5" /> Nullstill
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MSPDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string[]>([]);
  const [countryCodeFilter, setCountryCodeFilter] = useState<string[]>([]);
  const [criticalityFilter, setCriticalityFilter] = useState<string[]>([]);
  const [tpStatusFilter, setTpStatusFilter] = useState<TPStatusKey[]>([]);
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string[]>([]);
  const [planFilter, setPlanFilter] = useState<string[]>([]);
  const [segmentFilter, setSegmentFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("customer_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const queryClient = useQueryClient();

  const { data: customers = [], refetch } = useQuery({
    queryKey: ["msp-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_customers" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Highlight newly added customers for a few seconds (visual nudge in the table)
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const seenIdsRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    const currentIds = new Set((customers as any[]).map((c) => c.id));
    if (seenIdsRef.current === null) {
      // First load — don't highlight existing rows, but wait for actual data
      if (currentIds.size > 0) {
        seenIdsRef.current = currentIds;
      }
      return;
    }
    const newOnes: string[] = [];
    currentIds.forEach((id) => {
      if (!seenIdsRef.current!.has(id)) newOnes.push(id);
    });
    seenIdsRef.current = currentIds;
    if (newOnes.length === 0) return;

    setHighlightIds((prev) => {
      const next = new Set(prev);
      newOnes.forEach((id) => next.add(id));
      return next;
    });
    const timer = setTimeout(() => {
      setHighlightIds((prev) => {
        const next = new Set(prev);
        newOnes.forEach((id) => next.delete(id));
        return next;
      });
    }, 6000);
    return () => clearTimeout(timer);
  }, [customers]);

  // Distinct values for column filter menus
  const industryOptions = useMemo(
    () => Array.from(new Set((customers as any[]).map((c) => c.industry).filter(Boolean))).sort(),
    [customers],
  );
  const countryCodeOptions = useMemo(
    () => Array.from(new Set((customers as any[]).map((c) => c.country_code || "NO").filter(Boolean))).sort(),
    [customers],
  );
  const serviceOptions = useMemo(
    () => Array.from(new Set((customers as any[]).flatMap((c) => deriveNeededServices(c)))).sort(),
    [customers],
  );
  const planOptions = useMemo(
    () => Array.from(new Set((customers as any[]).map((c) => c.subscription_plan || "Gratis").filter(Boolean))).sort(),
    [customers],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (customers as any[]).filter((c) => {
      if (industryFilter.length && !industryFilter.includes(c.industry)) return false;
      if (countryCodeFilter.length && !countryCodeFilter.includes(c.country_code || "NO")) return false;
      if (criticalityFilter.length && !criticalityFilter.includes(deriveCriticality(c).key)) return false;
      if (tpStatusFilter.length && !tpStatusFilter.includes(deriveTPStatus(c))) return false;
      if (serviceTypeFilter.length && !serviceTypeFilter.includes(deriveServiceType(c))) return false;
      if (planFilter.length && !planFilter.includes(c.subscription_plan || "Gratis")) return false;
      if (segmentFilter.length && !segmentFilter.includes(deriveSegment(c))) return false;
      if (serviceFilter.length) {
        const svcs = deriveNeededServices(c);
        if (!serviceFilter.some((s) => svcs.includes(s))) return false;
      }
      if (!q) return true;
      return [c.customer_name, c.industry, c.org_number, c.contact_email, c.country_code]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q));
    });

    const dir = sortDir === "asc" ? 1 : -1;
    const sorted = [...list].sort((a, b) => {
      if (sortKey === "customer_name") {
        return (a.customer_name || "").localeCompare(b.customer_name || "", "nb") * dir;
      }
      if (sortKey === "country_code") {
        return (a.country_code || "NO").localeCompare(b.country_code || "NO", "nb") * dir;
      }
      if (sortKey === "compliance_score") {
        return ((a.compliance_score || 0) - (b.compliance_score || 0)) * dir;
      }
      // tp_status
      const ao = TP_STATUS_ORDER[deriveTPStatus(a)] ?? 99;
      const bo = TP_STATUS_ORDER[deriveTPStatus(b)] ?? 99;
      return (ao - bo) * dir;
    });
    // Float newly added customers to the top while highlighted
    if (highlightIds.size > 0) {
      sorted.sort((a, b) => {
        const ah = highlightIds.has(a.id) ? 0 : 1;
        const bh = highlightIds.has(b.id) ? 0 : 1;
        return ah - bh;
      });
    }
    return sorted;
  }, [customers, search, industryFilter, countryCodeFilter, criticalityFilter, tpStatusFilter, serviceFilter, serviceTypeFilter, planFilter, segmentFilter, sortKey, sortDir, highlightIds]);

  const clearAllFilters = () => {
    setIndustryFilter([]);
    setCountryCodeFilter([]);
    setCriticalityFilter([]);
    setTpStatusFilter([]);
    setServiceFilter([]);
    setServiceTypeFilter([]);
    setPlanFilter([]);
    setSegmentFilter([]);
  };
  const activeFilterCount = industryFilter.length + countryCodeFilter.length + criticalityFilter.length + tpStatusFilter.length + serviceFilter.length + serviceTypeFilter.length + planFilter.length + segmentFilter.length;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3.5 w-3.5" />
      : <ArrowDown className="h-3.5 w-3.5" />;
  };

  const handleSeed = async () => {
    try {
      const r = await seedDemoMSP();
      queryClient.invalidateQueries({ queryKey: ["msp-customers"] });
      queryClient.invalidateQueries({ queryKey: ["msp-licenses"] });
      queryClient.invalidateQueries({ queryKey: ["msp-purchases"] });
      if (r.alreadySeeded) {
        toast.success("Demo-data er allerede lastet");
      } else {
        toast.success(
          `Demo lastet: ${r.customers} kunder, ${r.licenses} lisenser, ${r.purchases} kjøp, ${r.invoices} fakturaer`
        );
      }
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke laste demo-data");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDemoMSP();
      queryClient.invalidateQueries({ queryKey: ["msp-customers"] });
      queryClient.invalidateQueries({ queryKey: ["msp-licenses"] });
      queryClient.invalidateQueries({ queryKey: ["msp-purchases"] });
      toast.success("Demo-data slettet");
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke slette demo-data");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Kunder <span className="text-muted-foreground font-normal">({filtered.length}{filtered.length !== customers.length ? ` av ${customers.length}` : ""})</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSeed}><Database className="h-4 w-4 mr-2" />Last inn demo-data</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Slett demo-data</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Legg til kunde
              </Button>
            </div>
          </div>

          <div className="mt-5 space-y-5">
              {/* Toolbar: search + filter + view toggle */}
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Søk på navn, bransje, landskode, org.nr eller e-post"
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1.5 text-sm font-medium hover:text-foreground transition-colors",
                          (serviceTypeFilter.length || planFilter.length || segmentFilter.length) ? "text-primary border-primary/30" : "text-foreground/80"
                        )}
                      >
                        <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {(serviceTypeFilter.length + planFilter.length + segmentFilter.length) > 0 && (
                          <span className="inline-flex items-center justify-center rounded-full bg-primary/15 text-primary text-[12px] font-semibold h-4 min-w-4 px-1 tabular-nums">
                            {serviceTypeFilter.length + planFilter.length + segmentFilter.length}
                          </span>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-60 max-h-80 overflow-auto">
                      <DropdownMenuLabel className="text-xs">Tjenestetype</DropdownMenuLabel>
                      {[
                        { value: "mssp", label: SERVICE_TYPE_LABEL.mssp },
                        { value: "msp", label: SERVICE_TYPE_LABEL.msp },
                        { value: "hybrid", label: SERVICE_TYPE_LABEL.hybrid },
                      ].map((opt) => (
                        <DropdownMenuCheckboxItem
                          key={opt.value}
                          checked={serviceTypeFilter.includes(opt.value)}
                          onSelect={(e) => {
                            e.preventDefault();
                            setServiceTypeFilter((prev) =>
                              prev.includes(opt.value) ? prev.filter((x) => x !== opt.value) : [...prev, opt.value]
                            );
                          }}
                        >
                          {opt.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs">Abonnement</DropdownMenuLabel>
                      {planOptions.map((v) => (
                        <DropdownMenuCheckboxItem
                          key={v}
                          checked={planFilter.includes(v)}
                          onSelect={(e) => {
                            e.preventDefault();
                            setPlanFilter((prev) =>
                              prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
                            );
                          }}
                        >
                          {v}
                        </DropdownMenuCheckboxItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs">Segment</DropdownMenuLabel>
                      {[
                        { value: "smb", label: SEGMENT_LABEL.smb },
                        { value: "midmarket", label: SEGMENT_LABEL.midmarket },
                        { value: "enterprise", label: SEGMENT_LABEL.enterprise },
                      ].map((opt) => (
                        <DropdownMenuCheckboxItem
                          key={opt.value}
                          checked={segmentFilter.includes(opt.value)}
                          onSelect={(e) => {
                            e.preventDefault();
                            setSegmentFilter((prev) =>
                              prev.includes(opt.value) ? prev.filter((x) => x !== opt.value) : [...prev, opt.value]
                            );
                          }}
                        >
                          {opt.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                      {(serviceTypeFilter.length || planFilter.length || segmentFilter.length) ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={(e) => { e.preventDefault(); setServiceTypeFilter([]); setPlanFilter([]); setSegmentFilter([]); }}
                            className="text-xs text-muted-foreground"
                          >
                            <X className="h-3 w-3 mr-1.5" /> Nullstill grupper
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1.5 text-muted-foreground">
                    <X className="h-3.5 w-3.5" /> Nullstill filtre ({activeFilterCount})
                  </Button>
                )}
                <div className="inline-flex rounded-md border border-border bg-background overflow-hidden md:ml-auto">
                  <button
                    type="button"
                    onClick={() => setView("cards")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 text-sm transition-colors",
                      view === "cards" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                    )}
                    aria-pressed={view === "cards"}
                  >
                    <LayoutGrid className="h-4 w-4" /> Kort
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("table")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 text-sm border-l border-border transition-colors",
                      view === "table" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                    )}
                    aria-pressed={view === "table"}
                  >
                    <Rows3 className="h-4 w-4" /> Tabell
                  </button>
                </div>
              </div>

              {customers.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-lg">Ingen kunder registrert ennå</p>
                  <p className="text-sm mt-1">Klikk «Legg til kunde» for å komme i gang</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-sm">Ingen kunder matcher søket eller filteret</p>
                </div>
              ) : view === "cards" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filtered.map((c: any) => (
                    <MSPCustomerCard key={c.id} customer={c} />
                  ))}
                </div>
              ) : (
                <>
                  {/* Mobile/tablet: compact table-style row list */}
                  <div className="lg:hidden rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
                    {filtered.map((c: any) => {
                      const score = c.compliance_score || 0;
                      const radius = 18;
                      const circ = 2 * Math.PI * radius;
                      const dash = score > 0 ? (score / 100) * circ : 0;
                      const stroke =
                        score >= 75 ? "hsl(var(--success))" :
                        score >= 50 ? "hsl(var(--warning))" :
                        "hsl(var(--destructive))";
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => navigate(`/msp-dashboard/${c.id}`)}
                          className="w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{c.customer_name}</p>
                            <p className="mt-0.5 text-[12px] text-muted-foreground truncate">{c.industry || "—"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="relative flex items-center justify-center" style={{ width: 40, height: 40 }}>
                              <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
                                <circle cx="20" cy="20" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                                {score > 0 && (
                                  <circle cx="20" cy="20" r={radius} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"
                                    strokeDasharray={`${dash} ${circ}`} />
                                )}
                              </svg>
                              <span className={cn(
                                "absolute text-[11px] font-semibold tabular-nums leading-none",
                                score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive"
                              )}>
                                {score > 0 ? `${score}%` : "—"}
                              </span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                <div className="hidden lg:block rounded-lg border border-border bg-card overflow-x-auto">
                  <Table className="table-fixed min-w-[1080px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[220px] text-foreground/80">
                          <button type="button" onClick={() => toggleSort("customer_name")} className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-foreground transition-colors">
                            Kunde <SortIcon k="customer_name" />
                          </button>
                        </TableHead>
                        <TableHead className="w-[120px] text-foreground/80">
                          <ColumnFilter
                            label="Landskode"
                            options={countryCodeOptions.map((v) => ({ value: v, label: v }))}
                            selected={countryCodeFilter}
                            onChange={setCountryCodeFilter}
                          />
                        </TableHead>
                        <TableHead className="w-[160px] text-foreground/80">
                          <ColumnFilter
                            label="Bransje"
                            options={industryOptions.map((v) => ({ value: v, label: v }))}
                            selected={industryFilter}
                            onChange={setIndustryFilter}
                          />
                        </TableHead>
                        <TableHead className="w-[140px] text-foreground/80">
                          <ColumnFilter
                            label="Kritikalitet"
                            options={[
                              { value: "high", label: "Høy" },
                              { value: "medium", label: "Medium" },
                              { value: "low", label: "Lav" },
                            ]}
                            selected={criticalityFilter}
                            onChange={setCriticalityFilter}
                          />
                        </TableHead>
                        <TableHead className="w-auto text-foreground/80">
                          <ColumnFilter
                            label="Lara anbefaler"
                            options={serviceOptions.map((v) => ({ value: v, label: v }))}
                            selected={serviceFilter}
                            onChange={setServiceFilter}
                          />
                        </TableHead>
                        <TableHead className="w-[160px] text-foreground/80">
                          <div className="inline-flex items-center gap-2">
                            <button type="button" onClick={() => toggleSort("tp_status")} className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-foreground transition-colors">
                              TP-status <SortIcon k="tp_status" />
                            </button>
                            <ColumnFilter
                              iconOnly
                              label="TP-status"
                              options={(Object.keys(TP_STATUS_LABEL) as TPStatusKey[]).map((k) => ({ value: k, label: TP_STATUS_LABEL[k] }))}
                              selected={tpStatusFilter}
                              onChange={(v) => setTpStatusFilter(v as TPStatusKey[])}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="w-[120px] text-right text-foreground/80">
                          <button type="button" onClick={() => toggleSort("compliance_score")} className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-foreground transition-colors">
                            Modenhet <SortIcon k="compliance_score" />
                          </button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((c: any) => {
                        const tp = deriveTPStatus(c);
                        const score = c.compliance_score || 0;
                        const crit = deriveCriticality(c);
                        const services = deriveNeededServices(c);
                        const isNew = highlightIds.has(c.id);
                        return (
                          <TableRow
                            key={c.id}
                            className={cn(
                              "cursor-pointer transition-colors duration-1000",
                              isNew && "bg-primary/10 hover:bg-primary/15 ring-1 ring-inset ring-primary/30 animate-fade-in",
                            )}
                            onClick={() => navigate(`/msp-dashboard/${c.id}`)}
                          >
                            <TableCell className="font-medium">
                              <span className="inline-flex items-center gap-2">
                                {c.customer_name}
                                {isNew && (
                                  <Badge variant="outline" className="bg-primary text-primary-foreground border-primary text-[11px] px-1.5 py-0 h-4 font-medium animate-pulse">
                                    Ny
                                  </Badge>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground tabular-nums">{c.country_code || "NO"}</TableCell>
                            <TableCell className="text-muted-foreground">{c.industry || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("font-normal", crit.tone)}>
                                {crit.label}
                              </Badge>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {services.length === 0 ? (
                                <span className="text-muted-foreground text-sm">—</span>
                              ) : (
                                <div className="flex flex-wrap gap-1 max-w-[280px]">
                                  {services.map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => navigate(`/msp-dashboard/${c.id}?tab=assessment&service=${encodeURIComponent(s)}`)}
                                      className="inline-flex"
                                      title={`Åpne tjenester for ${c.customer_name}`}
                                    >
                                      <Badge variant="outline" className="font-normal bg-primary/10 text-foreground dark:text-primary-foreground border-primary/30 dark:border-primary/50 text-[12px] cursor-pointer hover:bg-primary/20 transition-colors">
                                        {s}
                                      </Badge>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("font-normal", TP_STATUS_TONE[tp])}>
                                {TP_STATUS_LABEL[tp]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {score > 0 ? <ScoreCircle score={score} /> : <span className="text-muted-foreground text-sm">—</span>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                </>
              )}
            </div>
          </div>

        <AddMSPCustomerDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={() => refetch()} />
      </main>
    </div>
  );
}
