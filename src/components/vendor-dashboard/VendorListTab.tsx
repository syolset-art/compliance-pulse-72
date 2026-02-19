import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VendorCard } from "./VendorCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Building2,
} from "lucide-react";

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
}

interface VendorListTabProps {
  vendors: Asset[];
  allAssets: Asset[];
  relationships: { source_asset_id: string; target_asset_id: string }[];
  onDelete: (id: string) => void;
}

export function VendorListTab({ vendors, allAssets, relationships, onDelete }: VendorListTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState("");
  const [gdprRoleFilter, setGdprRoleFilter] = useState("");
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
      return matchesName && matchesCat && matchesRisk && matchesVendorCat && matchesGdpr;
    });

    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aVal = "", bVal = "";
        if (sortColumn === "name") { aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); }
        if (sortColumn === "compliance") { return sortDirection === "asc" ? (a.compliance_score || 0) - (b.compliance_score || 0) : (b.compliance_score || 0) - (a.compliance_score || 0); }
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return result;
  }, [items, nameFilter, categoryFilter, riskFilter, vendorCategoryFilter, gdprRoleFilter, sortColumn, sortDirection]);

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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <Input
            placeholder={t("assets.filterByName")}
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="bg-muted/50 border-border w-full sm:w-48"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-muted/50 border-border w-full sm:w-40">
              <SelectValue placeholder={t("assets.filterByCategory")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("assets.allCategories")}</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="bg-muted/50 border-border w-full sm:w-36">
              <SelectValue placeholder={t("assets.risk")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("vendorDashboard.allRisks", "All")}</SelectItem>
              <SelectItem value="high">{t("vendorDashboard.risk.high", "High")}</SelectItem>
              <SelectItem value="medium">{t("vendorDashboard.risk.medium", "Medium")}</SelectItem>
              <SelectItem value="low">{t("vendorDashboard.risk.low", "Low")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={vendorCategoryFilter} onValueChange={setVendorCategoryFilter}>
            <SelectTrigger className="bg-muted/50 border-border w-full sm:w-40">
              <SelectValue placeholder={t("vendorDashboard.vendorType", "Type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("vendorDashboard.allTypes", "Alle typer")}</SelectItem>
              <SelectItem value="saas">SaaS</SelectItem>
              <SelectItem value="infrastructure">{t("vendorDashboard.infrastructure", "Infrastruktur")}</SelectItem>
              <SelectItem value="consulting">{t("vendorDashboard.consulting", "Rådgivning")}</SelectItem>
              <SelectItem value="it_operations">{t("vendorDashboard.itOperations", "IT-drift")}</SelectItem>
              <SelectItem value="facilities">{t("vendorDashboard.facilities", "Kontor")}</SelectItem>
              <SelectItem value="other">{t("vendorDashboard.other", "Annet")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={gdprRoleFilter} onValueChange={setGdprRoleFilter}>
            <SelectTrigger className="bg-muted/50 border-border w-full sm:w-44">
              <SelectValue placeholder={t("vendorDashboard.gdprRole", "GDPR-rolle")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("vendorDashboard.allRoles", "Alle roller")}</SelectItem>
              <SelectItem value="databehandler">{t("vendorDashboard.dataProcessor", "Databehandler")}</SelectItem>
              <SelectItem value="underdatabehandler">{t("vendorDashboard.subProcessor", "Underdatabehandler")}</SelectItem>
              <SelectItem value="ingen">{t("vendorDashboard.noPersonalData", "Ingen persondata")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="rounded" />
            {t("vendorDashboard.showAllAssets", "Show all asset types")}
          </label>
          <div className="flex border border-border rounded-lg">
            <Button variant={viewMode === "card" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("card")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("vendorDashboard.showing", "Showing {{count}} vendors", { count: filtered.length })}
      </p>

      {/* Card View */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(v => (
            <VendorCard
              key={v.id}
              vendor={v}
              connectedSystemsCount={getConnectedCount(v.id)}
              hasDPA={(v.compliance_score || 0) >= 30}
              inboxCount={inboxCounts[v.id] || 0}
              expiredDocsCount={expiredCounts[v.id] || 0}
              onClick={() => navigate(`/assets/${v.id}`)}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_80px_80px] gap-4 px-4 py-3 bg-muted/30 text-sm font-medium text-muted-foreground">
            <button onClick={() => handleSort("name")} className="flex items-center hover:text-foreground text-left">
              {t("assets.name")} <SortIcon column="name" />
            </button>
            <div>{t("assets.category")}</div>
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
              const scoreColor = score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";
              const riskColor = { high: "bg-destructive", medium: "bg-warning", low: "bg-success" }[asset.risk_level || ""] || "bg-muted-foreground";
              return (
                <div
                  key={asset.id}
                  onClick={() => navigate(`/assets/${asset.id}`)}
                  className="grid grid-cols-[2fr_1fr_1fr_80px_80px] gap-4 px-4 py-3 border-t border-border items-center hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground truncate">{asset.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{asset.category || "—"}</div>
                  <div className={`font-semibold ${scoreColor}`}>{score}%</div>
                  <div className="flex justify-center"><div className={`h-3 w-3 rounded-full ${riskColor}`} /></div>
                  <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                    {!asset.work_area_id ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(asset.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Tilknyttet</span>
                    )}
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
