import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatKr } from "@/lib/planConstants";

import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreVertical, Database, Trash2, LayoutGrid, Rows3, Search, ArrowUp, ArrowDown, ArrowUpDown, Users, ArrowRight, Filter, X, Columns3, ScanSearch, Info } from "lucide-react";
import { MSPCustomerCard } from "@/components/msp/MSPCustomerCard";
import { AddMSPCustomerDialog } from "@/components/msp/AddMSPCustomerDialog";
import { NeedsAnalysisWizardDialog } from "@/components/msp/NeedsAnalysisWizardDialog";
import { MSPCreateOfferDialog } from "@/components/msp/MSPCreateOfferDialog";
import { ActivateRecommendationsDialog } from "@/components/msp/ActivateRecommendationsDialog";
import { EnterCustomerContextDialog } from "@/components/msp/EnterCustomerContextDialog";
import type { CustomerEntryTarget } from "@/lib/customerEntryRoutes";


import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { seedDemoMSP, deleteDemoMSP } from "@/lib/demoSeedMSP";
import { toast } from "sonner";
import { getOffersForCustomer, normalizeServiceKey } from "@/lib/customerOffers";
import { SERVICE_LIBRARY } from "@/lib/serviceLibrary";

type ViewMode = "cards" | "table";

const getCountryName = (code: string) => {
  const mapping: Record<string, string> = {
    NO: "Norge",
    SE: "Sverige",
    DK: "Danmark",
    FI: "Finland",
    IS: "Island",
    DE: "Tyskland",
    NL: "Nederland",
    GB: "Storbritannia",
    US: "USA",
  };
  return mapping[code.toUpperCase()] || code;
};

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


// Suggested services Lara recommends — MUST match titles used in MSPMaturityServiceMatrix
// (Anbefalte tjenester på kundens TP-detaljside) slik at klikk fra tabellen lander på riktig kort.
function deriveNeededServices(c: any): string[] {
  const services: string[] = [];
  const score = c.compliance_score || 0;
  const frameworks: string[] = c.active_frameworks || [];
  const ind = c.industry || "";
  const highCritIndustries = new Set(["Energi", "Helse", "Finans"]);

  // NIS2 — kritiske bransjer eller manglende rammeverk
  if (highCritIndustries.has(ind) || ind === "Energi" || ind === "Transport" || ind === "Helse" || ind === "Finans") {
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

// Aktive (leverte) tjenester for denne kunden — vises grønt i kolonnen.
function deriveActiveServices(c: any): string[] {
  const delivered = getOffersForCustomer(c.id).filter((o) => o.status === "delivered");
  const names = new Set<string>();
  for (const o of delivered) {
    for (const tid of o.templateIds || []) {
      const tpl = SERVICE_LIBRARY.find((t) => t.id === tid);
      names.add(tpl ? tpl.name : tid);
    }
    for (const key of o.serviceKeys || []) {
      const tpl = SERVICE_LIBRARY.find((t) => normalizeServiceKey(t.name) === key);
      names.add(tpl ? tpl.name : key);
    }
  }
  return Array.from(names);
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
  label: React.ReactNode;
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

// ===== Anbefalte produkter og tjenester (salgbare forslag) =====
export interface OfferSuggestion {
  id: string;
  label: string;
  kind: "framework" | "service" | "module";
  hours: number;
  activatable: boolean;
  frameworkId?: string;
  moduleKey?: string;
  price?: number | null;
}

function deriveOfferSuggestions(c: any): OfferSuggestion[] {
  const toLabel = (f: any): string => (typeof f === "string" ? f : (f?.label ?? f?.frameworkId ?? ""));
  const active: string[] = (c.active_frameworks || []).map(toLabel).filter(Boolean);
  const recommended: string[] = (c.recommended_frameworks || [])
    .map(toLabel)
    .filter((f: string) => f && !active.includes(f));
  const score = c.compliance_score || 0;
  const modules: string[] = c.active_modules || [];

  const out: OfferSuggestion[] = [];

  // Regelverk som bør aktiveres
  for (const f of recommended) {
    out.push({
      id: `fw-${f}`,
      label: f,
      kind: "framework",
      hours: 6,
      activatable: true,
      frameworkId: f,
      price: 490,
    });
  }

  // Mynder-moduler som ikke er aktivert
  const moduleCandidates: { key: string; label: string; price: number; hours: number }[] = [
    { key: "core", label: "Mynder Core", price: 995, hours: 4 },
    { key: "vendors", label: "Leverandørmodul", price: 1089, hours: 5 },
    { key: "assets", label: "Assets", price: 490, hours: 3 },
  ];
  for (const m of moduleCandidates) {
    if (modules.includes(m.key)) continue;
    out.push({
      id: `mod-${m.key}`,
      label: m.label,
      kind: "module",
      hours: m.hours,
      activatable: true,
      moduleKey: m.key,
      price: m.price,
    });
  }

  // Partnerens egne tjenester
  const activeServices = new Set(deriveActiveServices(c));
  const serviceHours: Record<string, number> = {
    Modenhetsvurdering: 8,
    "Gap-analyse": 10,
    Penetrasjonstest: 24,
    "NIS2-klargjøring": 16,
    "AI Governance-rammeverk": 12,
  };
  const serviceNames: string[] = [];
  if (!score) serviceNames.push("Modenhetsvurdering");
  if (score > 0 && score < 60) serviceNames.push("Gap-analyse");
  for (const s of deriveNeededServices(c)) serviceNames.push(s);

  for (const name of Array.from(new Set(serviceNames))) {
    if (activeServices.has(name)) continue;
    out.push({
      id: `svc-${normalizeServiceKey(name)}`,
      label: name,
      kind: "service",
      hours: serviceHours[name] ?? 8,
      activatable: false,
    });
  }

  const seen = new Set<string>();
  return out.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
}

// Alt kunden allerede har aktivert — regelverk, moduler og leverte tjenester.
function deriveActivatedItems(c: any): string[] {
  const toLabel = (f: any): string => (typeof f === "string" ? f : (f?.label ?? f?.frameworkId ?? ""));
  const frameworks: string[] = (c.active_frameworks || []).map(toLabel).filter(Boolean);
  const moduleLabels: Record<string, string> = {
    core: "Mynder Core",
    vendors: "Leverandørmodul",
    assets: "Assets",
    trust: "Trust Profile",
    frameworks: "Regelverk",
  };
  const modules: string[] = (c.active_modules || []).map((m: string) => moduleLabels[m] || m);
  return Array.from(new Set([...frameworks, ...modules, ...deriveActiveServices(c)]));
}

function RecommendationCell({
  suggestions,
  picked,
  onToggle,
  onOffer,
  onActivate,
}: {
  suggestions: OfferSuggestion[];
  picked: string[];
  onToggle: (id: string) => void;
  onOffer: () => void;
  onActivate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (suggestions.length === 0) return <span className="text-muted-foreground text-sm">—</span>;

  const shown = expanded ? suggestions : suggestions.slice(0, 4);
  const hidden = suggestions.length - shown.length;
  const activatableCount = suggestions.filter((s) => picked.includes(s.id) && s.activatable).length;

  return (
    <div className="flex flex-wrap items-center gap-1 max-w-[284px]">
      {shown.map((s) => {
        const on = picked.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onToggle(s.id)}
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-recommend focus-visible:ring-offset-1",
              on
                ? "border-recommend bg-recommend text-recommend-foreground"
                : "border-recommend/60 bg-recommend/15 text-recommend dark:text-recommend hover:bg-recommend/25 hover:border-recommend",
            )}
          >
            {s.label}
          </button>
        );
      })}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          +{hidden}
        </button>
      )}
      {picked.length > 0 && (
        <button
          type="button"
          onClick={onOffer}
          className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Tilbud ({picked.length})
        </button>
      )}
      {activatableCount > 0 && (
        <button
          type="button"
          onClick={onActivate}
          className="inline-flex items-center rounded-full bg-warning px-2 py-0.5 text-[11px] font-medium text-warning-foreground hover:bg-warning/90 transition-colors"

        >
          Aktiver ({activatableCount})
        </button>
      )}
    </div>
  );
}



// ===== Salgspotensial =====
const DEFAULT_HOURLY_RATE = 1500;

/** Førsteårs salgspotensial: tjenestetimer + 12 mnd abonnement på anbefalte produkter/regelverk. */
function customerSalesPotential(c: any): { total: number; services: number; recurring: number } {
  const suggestions = deriveOfferSuggestions(c);
  let services = 0;
  let recurring = 0;
  for (const s of suggestions) {
    if (s.activatable) recurring += (s.price ?? 0) * 12;
    else services += (s.hours ?? 0) * DEFAULT_HOURLY_RATE;
  }
  return { total: services + recurring, services, recurring };
}

// ===== Responsive column config =====
type ColumnKey = "customer" | "country" | "industry" | "recommendations" | "activated" | "potential" | "score";


const COLUMN_LABELS: Record<ColumnKey, string> = {
  customer: "Kunde",
  country: "Land",
  industry: "Bransje",
  recommendations: "Anbefalte produkter og tjenester",
  activated: "Aktivert",
  potential: "Salgspotensial",
  score: "Modenhet",
};

const COLUMN_ORDER: ColumnKey[] = ["customer", "country", "industry", "recommendations", "activated", "potential", "score"];

// Min Tailwind breakpoint (in px) where each column becomes visible by default.
// 0 = always shown; 640=sm, 768=md, 1024=lg, 1280=xl
const COLUMN_MIN_BP: Record<ColumnKey, number> = {
  customer: 0,
  potential: 0,
  score: 0,
  recommendations: 1024,
  activated: 1024,
  industry: 1024,
  country: 1280,
};



const COLUMN_STORAGE_KEY = "msp_dashboard_columns_v6";




function defaultVisibilityForViewport(): Record<ColumnKey, boolean> {
  const w = typeof window !== "undefined" ? window.innerWidth : 1280;
  const out = {} as Record<ColumnKey, boolean>;
  for (const k of COLUMN_ORDER) out[k] = w >= COLUMN_MIN_BP[k];
  return out;
}

function useColumnVisibility() {
  const [visible, setVisible] = useState<Record<ColumnKey, boolean>>(() => {
    if (typeof window === "undefined") return defaultVisibilityForViewport();
    try {
      const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const base = defaultVisibilityForViewport();
        for (const k of COLUMN_ORDER) if (typeof parsed?.[k] === "boolean") base[k] = parsed[k];
        return base;
      }
    } catch {}
    return defaultVisibilityForViewport();
  });

  const toggle = (key: ColumnKey) => {
    setVisible((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const isVisible = (key: ColumnKey) => !!visible[key];
  return { visible, toggle, isVisible };
}

function ColumnsMenu({ visible, onToggle }: { visible: Record<ColumnKey, boolean>; onToggle: (k: ColumnKey) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
          title="Velg kolonner"
        >
          <Columns3 className="h-4 w-4" /> Kolonner
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-2">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Vis kolonner</div>
        <div className="space-y-0.5">
          {COLUMN_ORDER.map((k) => (
            <label
              key={k}
              className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted/60 cursor-pointer text-sm"
            >
              <Checkbox
                checked={visible[k]}
                onCheckedChange={() => onToggle(k)}
                disabled={k === "customer"}
              />
              <span className={cn(k === "customer" && "text-muted-foreground")}>{COLUMN_LABELS[k]}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}



export default function MSPDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [gapOpen, setGapOpen] = useState(false);
  const [offerSelection, setOfferSelection] = useState<Record<string, string[]>>({});
  const [offerFor, setOfferFor] = useState<any | null>(null);
  const [activateFor, setActivateFor] = useState<any | null>(null);
  const [enterCustomer, setEnterCustomer] = useState<{
    id: string;
    name: string;
    orgNumber?: string | null;
    items: CustomerEntryTarget[];
  } | null>(null);

  const toggleSuggestion = (customerId: string, suggestionId: string) => {
    setOfferSelection((prev) => {
      const cur = prev[customerId] || [];
      return {
        ...prev,
        [customerId]: cur.includes(suggestionId) ? cur.filter((x) => x !== suggestionId) : [...cur, suggestionId],
      };
    });
  };

  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string[]>([]);
  const [countryCodeFilter, setCountryCodeFilter] = useState<string[]>([]);
  const [tpStatusFilter, setTpStatusFilter] = useState<TPStatusKey[]>([]);
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string[]>([]);
  const [planFilter, setPlanFilter] = useState<string[]>([]);
  const [segmentFilter, setSegmentFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("customer_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const { visible: colVisible, toggle: toggleColumn, isVisible } = useColumnVisibility();
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
  }, [customers, search, industryFilter, countryCodeFilter, tpStatusFilter, serviceFilter, serviceTypeFilter, planFilter, segmentFilter, sortKey, sortDir, highlightIds]);

  const clearAllFilters = () => {
    setIndustryFilter([]);
    setCountryCodeFilter([]);
    setTpStatusFilter([]);
    setServiceFilter([]);
    setServiceTypeFilter([]);
    setPlanFilter([]);
    setSegmentFilter([]);
  };
  const activeFilterCount = industryFilter.length + countryCodeFilter.length + tpStatusFilter.length + serviceFilter.length + serviceTypeFilter.length + planFilter.length + segmentFilter.length;

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
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => setGapOpen(true)} className="gap-2">
                      <ScanSearch className="h-4 w-4" />
                      Behovsanalyse
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    Finn hvilke kunder som matcher valgte regelverk, se hvilke tjenester som dekker behovet – og opprett tilbud til alle i én kampanje.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                <div className="md:ml-auto inline-flex items-center gap-2">
                  {view === "table" && (
                    <ColumnsMenu visible={colVisible} onToggle={toggleColumn} />
                  )}
                  <div className="inline-flex rounded-md border border-border bg-background overflow-hidden">
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
                  {/* Active filters for columns that are currently hidden */}
                  {(() => {
                    const hiddenFilters: React.ReactNode[] = [];
                    if (!isVisible("country")) hiddenFilters.push(
                      <ColumnFilter key="f-country" label="Land"
                        options={countryCodeOptions.map((v) => ({ value: v, label: v }))}
                        selected={countryCodeFilter} onChange={setCountryCodeFilter} />
                    );
                    if (!isVisible("industry")) hiddenFilters.push(
                      <ColumnFilter key="f-industry" label="Bransje"
                        options={industryOptions.map((v) => ({ value: v, label: v }))}
                        selected={industryFilter} onChange={setIndustryFilter} />
                    );
                    hiddenFilters.push(
                      <ColumnFilter key="f-services" label="Lara anbefaler"
                        options={serviceOptions.map((v) => ({ value: v, label: v }))}
                        selected={serviceFilter} onChange={setServiceFilter} />
                    );
                    if (hiddenFilters.length === 0) return null;
                    return (
                      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2">
                        <span className="text-[12px] uppercase tracking-wider text-muted-foreground">Skjulte kolonner</span>
                        {hiddenFilters}
                      </div>
                    );
                  })()}
                <div className="rounded-lg border border-border bg-card overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {isVisible("customer") && (
                          <TableHead className="w-[200px] text-foreground/80 align-middle">
                            <button type="button" onClick={() => toggleSort("customer_name")} className="inline-flex h-8 items-center gap-1.5 text-sm font-medium hover:text-foreground transition-colors">
                              Kunde <SortIcon k="customer_name" />
                            </button>
                          </TableHead>
                        )}
                        {isVisible("country") && (
                          <TableHead className="w-[72px] text-foreground/80 align-middle">
                            <div className="inline-flex h-8 items-center">
                              <ColumnFilter
                                label="Land"
                                options={countryCodeOptions.map((v) => ({ value: v, label: v }))}
                                selected={countryCodeFilter}
                                onChange={setCountryCodeFilter}
                              />
                            </div>
                          </TableHead>
                        )}
                        {isVisible("industry") && (
                          <TableHead className="w-[100px] text-foreground/80 align-middle">
                            <div className="inline-flex h-8 items-center">
                              <ColumnFilter
                                label="Bransje"
                                options={industryOptions.map((v) => ({ value: v, label: v }))}
                                selected={industryFilter}
                                onChange={setIndustryFilter}
                              />
                            </div>
                          </TableHead>
                        )}
                        {isVisible("recommendations") && (
                          <TableHead className="w-[300px] max-w-[300px] text-foreground/80 align-middle">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex h-8 items-center gap-1.5 text-sm font-medium cursor-help">
                                  Anbefalte produkter og tjenester <Info className="h-3.5 w-3.5 text-foreground/50" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[260px]">
                                <p>Regelverk, Mynder-moduler og egne tjenester som kan selges inn. Velg og lag tilbud eller aktiver direkte. Forslagene er utarbeidet av en KI-agent.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableHead>
                        )}
                        {isVisible("activated") && (
                          <TableHead className="w-[200px] max-w-[200px] text-foreground/80 align-middle">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex h-8 items-center gap-1.5 text-sm font-medium cursor-help">
                                  Aktivert <Info className="h-3.5 w-3.5 text-foreground/50" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[240px]">
                                <p>Regelverk, moduler og tjenester kunden allerede har.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableHead>
                        )}
                        {isVisible("potential") && (
                          <TableHead className="w-[120px] text-right text-foreground/80 align-middle">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex h-8 items-center gap-1.5 text-sm font-medium cursor-help">
                                  Salgspotensial <Info className="h-3.5 w-3.5 text-foreground/50" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[260px]">
                                <p>KI-estimert førsteårs verdi av anbefalte produkter og tjenester, eks. mva.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableHead>
                        )}


                        {isVisible("score") && (
                          <TableHead className="w-[96px] text-right text-foreground/80 align-middle">
                            <button type="button" onClick={() => toggleSort("compliance_score")} className="inline-flex h-8 items-center gap-1.5 text-sm font-medium hover:text-foreground transition-colors">
                              Modenhet <SortIcon k="compliance_score" />
                            </button>
                          </TableHead>
                        )}

                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((c: any) => {
                        const tp = deriveTPStatus(c);
                        const score = c.compliance_score || 0;
                        const services = deriveNeededServices(c);
                        const activeServices = deriveActiveServices(c);
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
                            {isVisible("customer") && (
                              <TableCell className="font-medium">
                                <span className="inline-flex items-center gap-2 min-w-0">
                                  <span className="truncate">{c.customer_name}</span>
                                  {isNew && (
                                    <Badge variant="outline" className="bg-primary text-primary-foreground border-primary text-[11px] px-1.5 py-0 h-4 font-medium animate-pulse shrink-0">
                                      Ny
                                    </Badge>
                                  )}
                                </span>
                              </TableCell>
                            )}
                            {isVisible("country") && (
                              <TableCell
                                className="text-muted-foreground tabular-nums cursor-help"
                                title={getCountryName(c.country_code || "NO")}
                              >
                                {c.country_code || "NO"}
                              </TableCell>
                            )}
                            {isVisible("industry") && (
                              <TableCell className="text-muted-foreground max-w-[100px]">
                                <span className="block truncate" title={c.industry || "—"}>{c.industry || "—"}</span>
                              </TableCell>
                            )}
                            {isVisible("recommendations") && (
                              <TableCell onClick={(e) => e.stopPropagation()} className="align-top max-w-[300px]">

                                <RecommendationCell
                                  suggestions={deriveOfferSuggestions(c)}
                                  picked={offerSelection[c.id] || []}
                                  onToggle={(id) => toggleSuggestion(c.id, id)}
                                  onOffer={() => setOfferFor(c)}
                                  onActivate={() => setActivateFor(c)}
                                />
                              </TableCell>
                            )}
                            {isVisible("activated") && (
                              <TableCell className="align-top max-w-[200px]">

                                {(() => {
                                  const items = deriveActivatedItems(c);
                                  if (items.length === 0) {
                                    return <span className="text-muted-foreground text-sm">—</span>;
                                  }
                                  return (
                                    <div className="flex flex-wrap items-center gap-1 max-w-[184px]">
                                      {items.slice(0, 4).map((label) => (
                                        <Badge
                                          key={label}
                                          variant="outline"
                                          className="font-normal bg-success/10 text-foreground border-success/30 text-[11px]"
                                        >
                                          {label}
                                        </Badge>
                                      ))}
                                      {items.length > 4 && (
                                        <span className="text-[11px] text-muted-foreground">+{items.length - 4}</span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </TableCell>
                            )}

                            {isVisible("potential") && (
                              <TableCell className="text-right align-top">
                                {(() => {
                                  const p = customerSalesPotential(c);
                                  if (p.total <= 0) return <span className="text-muted-foreground text-sm">—</span>;
                                  return (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-sm font-medium tabular-nums text-foreground cursor-help">
                                          {formatKr(p.total)}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[240px] text-xs">
                                        <p>Estimert førsteårs potensial eks. mva.</p>
                                        <p className="mt-1">Tjenester: {formatKr(p.services)} (1 500 kr/t)</p>
                                        <p>Produkter og regelverk: {formatKr(p.recurring)} (12 mnd)</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })()}
                              </TableCell>
                            )}


                            {isVisible("score") && (
                              <TableCell className="text-right">
                                {score > 0 ? <ScoreCircle score={score} /> : <span className="text-muted-foreground text-sm">—</span>}
                              </TableCell>
                            )}
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
        <NeedsAnalysisWizardDialog open={gapOpen} onOpenChange={setGapOpen} customers={filtered} />
        {activateFor && (() => {
          const picked = offerSelection[activateFor.id] || [];
          const items = deriveOfferSuggestions(activateFor).filter((s) => picked.includes(s.id));
          return (
            <ActivateRecommendationsDialog
              open={!!activateFor}
              onOpenChange={(o) => !o && setActivateFor(null)}
              customerId={activateFor.id}
              customerName={activateFor.customer_name}
              items={items}
              activeFrameworks={(activateFor.active_frameworks || []).map((f: any) => (typeof f === "string" ? f : (f?.label ?? f?.frameworkId ?? ""))).filter(Boolean)}
              activeModules={activateFor.active_modules || []}
              onActivated={() => {
                setOfferSelection((prev) => ({
                  ...prev,
                  [activateFor.id]: picked.filter((id) => !items.some((s) => s.id === id && s.activatable)),
                }));
                setActivateFor(null);
                refetch();
              }}
              onEnterCustomer={(activated) =>
                setEnterCustomer({
                  id: activateFor.id,
                  name: activateFor.customer_name,
                  orgNumber: (activateFor as any).org_number ?? null,
                  items: activated.map((a) => ({
                    id: a.id,
                    label: a.label,
                    kind: a.kind,
                    moduleKey: a.moduleKey,
                    frameworkId: a.frameworkId,
                  })),
                })
              }
              onMoveToOffer={() => {
                const target = activateFor;
                setActivateFor(null);
                setOfferFor(target);
              }}
            />
          );
        })()}

        {enterCustomer && (
          <EnterCustomerContextDialog
            open={!!enterCustomer}
            onOpenChange={(o) => !o && setEnterCustomer(null)}
            customerId={enterCustomer.id}
            customerName={enterCustomer.name}
            customerOrgNumber={enterCustomer.orgNumber}
            items={enterCustomer.items}
          />
        )}


        {offerFor && (() => {
          const picked = offerSelection[offerFor.id] || [];
          const items = deriveOfferSuggestions(offerFor).filter((s) => picked.includes(s.id));
          return (
            <MSPCreateOfferDialog
              open={!!offerFor}
              onOpenChange={(o) => !o && setOfferFor(null)}
              customerId={offerFor.id}
              customerName={offerFor.customer_name}
              customerContactName={offerFor.customer_name}
              serviceTitle={`Anbefalte produkter og tjenester for ${offerFor.customer_name}`}
              offeredServiceNames={items.map((s) => s.label)}
              activeFrameworks={(offerFor.active_frameworks || []).map((f: any) => (typeof f === "string" ? f : (f?.label ?? f?.frameworkId ?? ""))).filter(Boolean)}
              defaultTasks={items.map((s) => ({
                label: s.label,
                hours: s.hours,
                owner: "Partner" as const,
              }))}
            />
          );
        })()}

      </main>
    </div>
  );
}
