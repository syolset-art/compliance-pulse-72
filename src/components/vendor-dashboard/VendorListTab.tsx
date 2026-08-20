import { useState, useMemo } from "react";
import { SENSITIVE_DATA_STATUS_OPTIONS, normalizeSensitiveDataStatus, sensitiveDataStatusLabel } from "@/lib/sensitiveData";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VendorCard } from "./VendorCard";
import { VendorStatusRow } from "./VendorStatusRow";
import { AssetRowActionMenu } from "@/components/shared/AssetRowActionMenu";
import { ALL_VENDOR_STATUSES, deriveVendorStatus } from "@/lib/vendorStatus";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  LayoutGrid,
  List,
  Table as TableIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  SlidersHorizontal,
  X,
  Percent,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConnectSourcesCallout } from "@/components/integrations/ConnectSourcesCallout";
import { VendorTableView } from "./VendorTableView";
import { staggerEntranceClass } from "@/lib/animation";


export type ScoreDisplayMode = "percent" | "label";

export function scoreToLabel(score: number, isNb = true): string {
  if (score <= 0) return isNb ? "Ikke vurdert" : "Not assessed";
  if (score >= 75) return isNb ? "Høy" : "High";
  if (score >= 50) return isNb ? "Middels" : "Medium";
  return isNb ? "Lav" : "Low";
}

export function scoreLabelColor(score: number): string {
  if (score <= 0) return "text-muted-foreground";
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

interface Asset {
  id: string;
  name: string;
  asset_type: string;
  category: string | null;
  compliance_score: number | null;
  risk_level: string | null;
  country?: string | null;
  region?: string | null;
  vendor?: string | null;
  asset_owner?: string | null;
  created_at?: string;
  vendor_category?: string | null;
  gdpr_role?: string | null;
  sensitive_data_status?: string | null;
  work_area_id?: string | null;
  lifecycle_status?: string | null;
  priority?: string | null;
}

interface WorkArea {
  id: string;
  name: string;
  responsible_person?: string | null;
}

interface VendorListTabProps {
  vendors: Asset[];
  allAssets: Asset[];
  relationships: { source_asset_id: string; target_asset_id: string }[];
  onDelete: (id: string) => void;
  newlyAddedId?: string | null;
}

export function VendorListTab({ vendors, allAssets, relationships, onDelete, newlyAddedId }: VendorListTabProps) {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const tl = (k: string) => t(`vendorDashboard.list.${k}`);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: workAreas = [] } = useQuery({
    queryKey: ["work_areas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_areas").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const assignOwner = useMutation({
    mutationFn: async ({ id, workAreaId }: { id: string; workAreaId: string }) => {
      const workArea = workAreas.find((wa: WorkArea) => wa.id === workAreaId);
      const { error } = await supabase.from("assets").update({
        work_area_id: workAreaId,
        asset_owner: workArea?.responsible_person || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(tl("ownerSet"));
    },
  });

  const archiveAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").update({ lifecycle_status: "archived" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(tl("vendorArchived"));
    },
  });

  const { data: inboxCounts = {} } = useQuery({
    queryKey: ["lara-inbox-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lara_inbox")
        .select("matched_asset_id, id")
        .in("status", ["new", "auto_matched"]);
      const counts: Record<string, number> = {};
      data?.forEach(item => {
        if (item.matched_asset_id) {
          counts[item.matched_asset_id] = (counts[item.matched_asset_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const { data: expiredCounts = {} } = useQuery({
    queryKey: ["expired-docs-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_documents")
        .select("asset_id, valid_to")
        .not("valid_to", "is", null);
      const now = new Date();
      const counts: Record<string, number> = {};
      data?.forEach(doc => {
        if (new Date(doc.valid_to!) < now) {
          counts[doc.asset_id] = (counts[doc.asset_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [scoreDisplay, setScoreDisplay] = useState<ScoreDisplayMode>("percent");
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState("");
  const [gdprRoleFilter, setGdprRoleFilter] = useState("");
  const [sensitiveFilter, setSensitiveFilter] = useState("");
  const [searchParams] = useSearchParams();
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get("priority") || "");
  const [statusFilter, setStatusFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const items = showAll ? allAssets : vendors;

  const categories = useMemo(() => {
    const cats = new Set(items.map(a => a.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [items]);

  const filtered = useMemo(() => {
    let result = items.filter(a => {
      const matchesName = a.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesCat = !categoryFilter || categoryFilter === "all" || a.category === categoryFilter;
      const matchesRisk = !riskFilter || riskFilter === "all" || a.risk_level === riskFilter;
      const matchesVendorCat = !vendorCategoryFilter || vendorCategoryFilter === "all" || a.vendor_category === vendorCategoryFilter;
      const matchesGdpr = !gdprRoleFilter || gdprRoleFilter === "all" || a.gdpr_role === gdprRoleFilter;
      const matchesSensitive = !sensitiveFilter || sensitiveFilter === "all"
        || normalizeSensitiveDataStatus(a.sensitive_data_status) === sensitiveFilter;
      const matchesPriority = !priorityFilter || priorityFilter === "all" || a.priority === priorityFilter;
      const matchesCountry = !countryFilter || countryFilter === "all" || a.country === countryFilter;
      const ownerName = a.asset_owner || (a.work_area_id
        ? (workAreas.find((w: WorkArea) => w.id === a.work_area_id)?.name || "")
        : "");
      const matchesOwner = !ownerFilter || ownerFilter === "all" || ownerName === ownerFilter;
      const matchesStatus = !statusFilter || statusFilter === "all" || deriveVendorStatus({
        compliance_score: a.compliance_score,
        risk_level: a.risk_level,
        lifecycle_status: a.lifecycle_status,
        expiredDocsCount: expiredCounts[a.id] || 0,
        inboxCount: inboxCounts[a.id] || 0,
      }).key === statusFilter;
      return matchesName && matchesCat && matchesRisk && matchesVendorCat && matchesGdpr && matchesSensitive && matchesPriority && matchesStatus && matchesCountry && matchesOwner;
    });

    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aVal = "", bVal = "";
        if (sortColumn === "name") { aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); }
        if (sortColumn === "compliance") { return sortDirection === "asc" ? (a.compliance_score || 0) - (b.compliance_score || 0) : (b.compliance_score || 0) - (a.compliance_score || 0); }
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    } else {
      // Default: sort by priority (critical → high → medium → low → unset), then compliance desc, then name
      const priorityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      result = [...result].sort((a, b) => {
        const ap = a.priority ? (priorityRank[a.priority] ?? 4) : 4;
        const bp = b.priority ? (priorityRank[b.priority] ?? 4) : 4;
        if (ap !== bp) return ap - bp;
        const sc = (b.compliance_score || 0) - (a.compliance_score || 0);
        if (sc !== 0) return sc;
        return a.name.localeCompare(b.name);
      });
    }

    // Always put newly added vendor first
    if (newlyAddedId) {
      const idx = result.findIndex(a => a.id === newlyAddedId);
      if (idx > 0) {
        const [item] = result.splice(idx, 1);
        result.unshift(item);
      }
    }

    return result;
  }, [items, nameFilter, categoryFilter, riskFilter, vendorCategoryFilter, gdprRoleFilter, sensitiveFilter, priorityFilter, statusFilter, countryFilter, ownerFilter, workAreas, expiredCounts, inboxCounts, sortColumn, sortDirection, newlyAddedId]);

  const handleSort = (col: string) => {
    if (sortColumn === col) setSortDirection(d => d === "asc" ? "desc" : "asc");
    else { setSortColumn(col); setSortDirection("asc"); }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const getConnectedCount = (id: string) =>
    relationships.filter(r => r.source_asset_id === id || r.target_asset_id === id).length;

  const getOwnerName = (asset: Asset) => {
    if (asset.asset_owner) return asset.asset_owner;
    if (asset.work_area_id) {
      const wa = workAreas.find((a: WorkArea) => a.id === asset.work_area_id);
      return wa?.name || null;
    }
    return null;
  };

  const activeFilterCount = [categoryFilter, riskFilter, vendorCategoryFilter, gdprRoleFilter, sensitiveFilter, priorityFilter, statusFilter, countryFilter, ownerFilter]
    .filter(f => f && f !== "all").length + (showAll ? 1 : 0);

  const clearAllFilters = () => {
    setCategoryFilter("");
    setRiskFilter("");
    setVendorCategoryFilter("");
    setGdprRoleFilter("");
    setPriorityFilter("");
    setStatusFilter("");
    setCountryFilter("");
    setOwnerFilter("");
    setShowAll(false);
  };

  return (
    <div className="space-y-4">
      <VendorFrameworkScopeStrip />
      {/* Toolbar */}

      <div className="flex items-center gap-2 motion-safe:animate-fade-in-up motion-safe:animate-delay-200">

        <Input
          placeholder={t("assets.filterByName")}
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="bg-muted/50 border-border w-full sm:w-56"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <Badge className="h-4 min-w-4 px-1 text-[13px] rounded-full bg-primary text-primary-foreground">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 space-y-3 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tl("filter")}</span>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="text-xs text-primary hover:underline">{tl("reset")}</button>
              )}
            </div>
            <div className="space-y-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={tl("status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tl("allStatuses")}</SelectItem>
                  {ALL_VENDOR_STATUSES.map(s => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={tl("risk")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tl("allRisks")}</SelectItem>
                  <SelectItem value="high">{tl("riskHigh")}</SelectItem>
                  <SelectItem value="medium">{tl("riskMedium")}</SelectItem>
                  <SelectItem value="low">{tl("riskLow")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={vendorCategoryFilter} onValueChange={setVendorCategoryFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={tl("type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tl("allTypes")}</SelectItem>
                  <SelectItem value="saas">{tl("vendorType.saas")}</SelectItem>
                  <SelectItem value="infrastructure">{tl("vendorType.infrastructure")}</SelectItem>
                  <SelectItem value="consulting">{tl("vendorType.consulting")}</SelectItem>
                  <SelectItem value="it_operations">{tl("vendorType.it_operations")}</SelectItem>
                  <SelectItem value="facilities">{tl("vendorType.facilities")}</SelectItem>
                  <SelectItem value="other">{tl("vendorType.other")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={gdprRoleFilter} onValueChange={setGdprRoleFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={tl("gdprRole")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tl("allRoles")}</SelectItem>
                  <SelectItem value="databehandler">{tl("gdpr.databehandler")}</SelectItem>
                  <SelectItem value="underdatabehandler">{tl("gdpr.underdatabehandler")}</SelectItem>
                  <SelectItem value="ingen">{tl("gdpr.ingen")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sensitiveFilter} onValueChange={setSensitiveFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={isNb ? "Særlige kategorier" : "Special categories"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isNb ? "Alle særlige kategorier" : "All special categories"}</SelectItem>
                  {SENSITIVE_DATA_STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{isNb ? o.labelNb : o.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={tl("priority")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tl("allPriorities")}</SelectItem>
                  <SelectItem value="critical">{tl("priorityCritical")}</SelectItem>
                  <SelectItem value="high">{tl("priorityHigh")}</SelectItem>
                  <SelectItem value="medium">{tl("priorityMedium")}</SelectItem>
                  <SelectItem value="low">{tl("priorityLow")}</SelectItem>
                </SelectContent>
              </Select>
              {categories.length > 0 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={tl("category")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tl("allCategories")}</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <label className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="rounded" />
                {tl("showAllValues")}
              </label>
            </div>
          </PopoverContent>
        </Popover>


        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {riskFilter && riskFilter !== "all" && (
              <Badge variant="secondary" className="text-[13px] gap-1 pl-2 pr-1 py-0.5">
                {riskFilter === "high" ? tl("riskHigh") : riskFilter === "medium" ? tl("riskMedium") : tl("riskLow")} {tl("riskSuffix")}
                <button onClick={() => setRiskFilter("")}><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {vendorCategoryFilter && vendorCategoryFilter !== "all" && (
              <Badge variant="secondary" className="text-[13px] gap-1 pl-2 pr-1 py-0.5">
                {tl(`vendorType.${vendorCategoryFilter}`)}
                <button onClick={() => setVendorCategoryFilter("")}><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {gdprRoleFilter && gdprRoleFilter !== "all" && (
              <Badge variant="secondary" className="text-[13px] gap-1 pl-2 pr-1 py-0.5">
                {tl(`gdpr.${gdprRoleFilter}`)}
                <button onClick={() => setGdprRoleFilter("")}><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {sensitiveFilter && sensitiveFilter !== "all" && (
              <Badge variant="secondary" className="text-[13px] gap-1 pl-2 pr-1 py-0.5">
                {(isNb ? "Særlige kategorier: " : "Special categories: ") + sensitiveDataStatusLabel(sensitiveFilter, isNb)}
                <button onClick={() => setSensitiveFilter("")}><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {priorityFilter && priorityFilter !== "all" && (
              <Badge variant="secondary" className="text-[13px] gap-1 pl-2 pr-1 py-0.5">
                {priorityFilter === "critical" ? tl("priorityCritical") : priorityFilter === "high" ? tl("priorityHigh") : priorityFilter === "medium" ? tl("priorityMedium") : tl("priorityLow")} {tl("prioritySuffix")}
                <button onClick={() => setPriorityFilter("")}><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {categoryFilter && categoryFilter !== "all" && (
              <Badge variant="secondary" className="text-[13px] gap-1 pl-2 pr-1 py-0.5">
                {categoryFilter}
                <button onClick={() => setCategoryFilter("")}><X className="h-3 w-3" /></button>
              </Badge>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">{filtered.length} {t("nav.vendors", isNb ? "leverandører" : "vendors").toLowerCase()}</span>
          <div className="flex border border-border rounded-lg">
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("card")}
              title="Kortvisning"
              aria-label="Kortvisning"
              aria-pressed={viewMode === "card"}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("table")}
              title="Tabellvisning"
              aria-label="Tabellvisning"
              aria-pressed={viewMode === "table"}
            >
              <TableIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
          <div className="flex border border-border rounded-lg">
            <Button
              variant={scoreDisplay === "percent" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setScoreDisplay("percent")}
              title="Vis prosent"
              aria-label="Vis score som prosent"
              aria-pressed={scoreDisplay === "percent"}
            >
              <Percent className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button
              variant={scoreDisplay === "label" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setScoreDisplay("label")}
              title="Vis nivå"
              aria-label="Vis score som nivå"
              aria-pressed={scoreDisplay === "label"}
            >
              <Type className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>


      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground motion-safe:animate-fade-in-up space-y-4">
          <div>{t("assets.noAssets", isNb ? "Ingen leverandører funnet" : "No vendors found")}</div>
          <ConnectSourcesCallout
            className="text-left max-w-2xl mx-auto"
            context={isNb
              ? "Koble til regnskap eller skykilder, så finner Lara leverandørene dere faktisk betaler for."
              : "Connect accounting or cloud sources and Lara finds the vendors you actually pay for."}
          />
        </div>
      ) : viewMode === "table" ? (
        <VendorTableView
          vendors={filtered as any}
          expiredCounts={expiredCounts}
          inboxCounts={inboxCounts}
          getOwnerName={getOwnerName as any}
          scoreDisplay={scoreDisplay}
          countryFilter={countryFilter}
          setCountryFilter={setCountryFilter}
          vendorCategoryFilter={vendorCategoryFilter}
          setVendorCategoryFilter={setVendorCategoryFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          criticalityFilter={riskFilter}
          setCriticalityFilter={setRiskFilter}

          ownerFilter={ownerFilter}
          setOwnerFilter={setOwnerFilter}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((v, i) => {
            const md = (v as any).metadata || {};
            const frameworks: string[] = Array.isArray(md.frameworks) ? md.frameworks : [];
            return (
              <div key={v.id} className={staggerEntranceClass(i)}>
                <VendorStatusRow
                  vendor={v as any}
                  expiredDocsCount={expiredCounts[v.id] || 0}
                  inboxCount={inboxCounts[v.id] || 0}
                  ownerName={getOwnerName(v)}
                  segments={frameworks}
                />
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
}
