import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  const { t } = useTranslation();
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
      toast.success("Eier satt");
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
      toast.success("Leverandør arkivert");
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

  const [viewMode, setViewMode] = useState<"list" | "card">("card");
  const [scoreDisplay, setScoreDisplay] = useState<ScoreDisplayMode>("percent");
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState("");
  const [gdprRoleFilter, setGdprRoleFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
      const matchesPriority = !priorityFilter || priorityFilter === "all" || a.priority === priorityFilter;
      const matchesStatus = !statusFilter || statusFilter === "all" || deriveVendorStatus({
        compliance_score: a.compliance_score,
        risk_level: a.risk_level,
        lifecycle_status: a.lifecycle_status,
        expiredDocsCount: expiredCounts[a.id] || 0,
        inboxCount: inboxCounts[a.id] || 0,
      }).key === statusFilter;
      return matchesName && matchesCat && matchesRisk && matchesVendorCat && matchesGdpr && matchesPriority && matchesStatus;
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
  }, [items, nameFilter, categoryFilter, riskFilter, vendorCategoryFilter, gdprRoleFilter, priorityFilter, statusFilter, expiredCounts, inboxCounts, sortColumn, sortDirection, newlyAddedId]);

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

  const activeFilterCount = [categoryFilter, riskFilter, vendorCategoryFilter, gdprRoleFilter, priorityFilter, statusFilter]
    .filter(f => f && f !== "all").length + (showAll ? 1 : 0);

  const clearAllFilters = () => {
    setCategoryFilter("");
    setRiskFilter("");
    setVendorCategoryFilter("");
    setGdprRoleFilter("");
    setPriorityFilter("");
    setStatusFilter("");
    setShowAll(false);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
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
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Filtrer</span>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="text-xs text-primary hover:underline">Nullstill</button>
              )}
            </div>
            <div className="space-y-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statuser</SelectItem>
                  {ALL_VENDOR_STATUSES.map(s => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Risiko" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle risikonivåer</SelectItem>
                  <SelectItem value="high">Høy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Lav</SelectItem>
                </SelectContent>
              </Select>
              <Select value={vendorCategoryFilter} onValueChange={setVendorCategoryFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle typer</SelectItem>
                  <SelectItem value="saas">SaaS</SelectItem>
                  <SelectItem value="infrastructure">Infrastruktur</SelectItem>
                  <SelectItem value="consulting">Rådgivning</SelectItem>
                  <SelectItem value="it_operations">IT-drift</SelectItem>
                  <SelectItem value="facilities">Kontor</SelectItem>
                  <SelectItem value="other">Annet</SelectItem>
                </SelectContent>
              </Select>
              <Select value={gdprRoleFilter} onValueChange={setGdprRoleFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="GDPR-rolle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle roller</SelectItem>
                  <SelectItem value="databehandler">Databehandler</SelectItem>
                  <SelectItem value="underdatabehandler">Underdatabehandler</SelectItem>
                  <SelectItem value="ingen">Ingen persondata</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Prioritet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle prioriteter</SelectItem>
                  <SelectItem value="critical">Kritisk</SelectItem>
                  <SelectItem value="high">Høy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Lav</SelectItem>
                </SelectContent>
              </Select>
              {categories.length > 0 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle kategorier</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <label className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="rounded" />
                Vis alle verdier
              </label>
            </div>
          </PopoverContent>
        </Popover>

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {riskFilter && riskFilter !== "all" && (
              <Badge variant="secondary" className="text-[13px] gap-1 pl-2 pr-1 py-0.5">
                {riskFilter === "high" ? "Høy" : riskFilter === "medium" ? "Medium" : "Lav"} risiko
                <button onClick={() => setRiskFilter("")}><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {vendorCategoryFilter && vendorCategoryFilter !== "all" && (
              <Badge variant="secondary" className="text-[13px] gap-1 pl-2 pr-1 py-0.5">
                {vendorCategoryFilter}
                <button onClick={() => setVendorCategoryFilter("")}><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {gdprRoleFilter && gdprRoleFilter !== "all" && (
              <Badge variant="secondary" className="text-[13px] gap-1 pl-2 pr-1 py-0.5">
                {gdprRoleFilter}
                <button onClick={() => setGdprRoleFilter("")}><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {priorityFilter && priorityFilter !== "all" && (
              <Badge variant="secondary" className="text-[13px] gap-1 pl-2 pr-1 py-0.5">
                {priorityFilter === "critical" ? "Kritisk" : priorityFilter === "high" ? "Høy" : priorityFilter === "medium" ? "Medium" : "Lav"} prioritet
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
          <span className="text-xs text-muted-foreground hidden sm:inline">{filtered.length} leverandører</span>
          <div className="flex border border-border rounded-lg">
            <Button
              variant={scoreDisplay === "percent" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setScoreDisplay("percent")}
              title="Vis prosent"
            >
              <Percent className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={scoreDisplay === "label" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setScoreDisplay("label")}
              title="Vis nivå"
            >
              <Type className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>


      {/* Status row list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          {t("assets.noAssets", "Ingen leverandører funnet")}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(v => {
            const md = (v as any).metadata || {};
            const frameworks: string[] = Array.isArray(md.frameworks) ? md.frameworks : [];
            return (
              <VendorStatusRow
                key={v.id}
                vendor={v as any}
                expiredDocsCount={expiredCounts[v.id] || 0}
                inboxCount={inboxCounts[v.id] || 0}
                ownerName={getOwnerName(v)}
                frameworks={frameworks}
              />
            );
          })}
        </div>
      )}


      {/* Card View */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(v => (
            <VendorCard
              key={v.id}
              vendor={v}
              scoreDisplay={scoreDisplay}
              isNew={v.id === newlyAddedId}
              connectedSystemsCount={getConnectedCount(v.id)}
              hasDPA={(v.compliance_score || 0) >= 30}
              inboxCount={inboxCounts[v.id] || 0}
              expiredDocsCount={expiredCounts[v.id] || 0}
              onClick={() => navigate(`/assets/${v.id}`)}
              workAreas={workAreas}
              onSetOwner={(itemId, waId) => assignOwner.mutate({ id: itemId, workAreaId: waId })}
              onArchive={(itemId) => archiveAsset.mutate(itemId)}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_60px] gap-4 px-4 py-3 bg-muted/30 text-sm font-medium text-muted-foreground">
            <button onClick={() => handleSort("name")} className="flex items-center hover:text-foreground text-left">
              {t("assets.name")} <SortIcon column="name" />
            </button>
            <div>{t("assets.category")}</div>
            <div>{t("systems.owner", "Eier")}</div>
            <button onClick={() => handleSort("compliance")} className="flex items-center hover:text-foreground text-left">
              {t("assets.compliance")} <SortIcon column="compliance" />
            </button>
            <div>{t("assets.risk")}</div>
            <div></div>
          </div>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">{t("assets.noAssets")}</div>
          ) : (
            filtered.map(asset => {
              const score = asset.compliance_score || 0;
              const scoreColor = score > 0 ? (score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive") : "text-muted-foreground";
              const riskColor = { high: "bg-destructive", medium: "bg-warning", low: "bg-success" }[asset.risk_level || ""] || "bg-muted-foreground";
              const ownerName = getOwnerName(asset);
              const isNewRow = asset.id === newlyAddedId;
              return (
                <div
                  key={asset.id}
                  onClick={() => navigate(`/assets/${asset.id}`)}
                  className={cn(
                    "grid grid-cols-[2fr_1fr_1fr_1fr_80px_60px] gap-4 px-4 py-3 border-t border-border items-center hover:bg-muted/30 transition-all cursor-pointer",
                    isNewRow && "bg-primary/5 ring-1 ring-primary/30 animate-fade-in"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground truncate">{asset.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{asset.category || "—"}</div>
                  <div className="text-sm">
                    {ownerName ? (
                      <span className="text-foreground">{ownerName}</span>
                    ) : (
                      <span className="text-muted-foreground/50 italic text-xs">Ikke satt</span>
                    )}
                  </div>
                  <div className={`font-semibold ${scoreColor}`}>
                    {score > 0
                      ? scoreDisplay === "percent" ? `${score}%` : scoreToLabel(score)
                      : "Ikke vurdert"}
                  </div>
                  <div className="flex justify-center"><div className={`h-3 w-3 rounded-full ${riskColor}`} /></div>
                  <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                    <AssetRowActionMenu
                      itemId={asset.id}
                      currentWorkAreaId={asset.work_area_id}
                      workAreas={workAreas}
                      onSetOwner={(itemId, waId) => assignOwner.mutate({ id: itemId, workAreaId: waId })}
                      onArchive={(itemId) => archiveAsset.mutate(itemId)}
                      onDelete={onDelete}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
