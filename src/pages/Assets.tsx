import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { AssetSummaryWidget } from "@/components/widgets/AssetSummaryWidget";
import { 
  HelpCircle, 
  Trash2, 
  Plus, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Server,
  Building2,
  MapPin,
  Network,
  Plug,
  HardDrive,
  Database,
  FileText,
  LucideIcon,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddAssetDialog } from "@/components/dialogs/AddAssetDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Asset {
  id: string;
  asset_type: string;
  name: string;
  description: string | null;
  category: string | null;
  vendor: string | null;
  lifecycle_status: string | null;
  risk_level: string | null;
  criticality: string | null;
  compliance_score: number | null;
  work_area_id: string | null;
  asset_owner: string | null;
  asset_manager: string | null;
  created_at?: string;
  external_source_provider?: string | null;
  sync_enabled?: boolean | null;
  last_synced_at?: string | null;
}

interface WorkArea {
  id: string;
  name: string;
}

interface AssetTypeTemplate {
  asset_type: string;
  display_name: string;
  display_name_plural: string;
  icon: string;
  color: string;
}

// Map asset type to icon and color
const getAssetTypeIcon = (assetType: string): { icon: LucideIcon; color: string } => {
  const iconMap: Record<string, { icon: LucideIcon; color: string }> = {
    system: { icon: Server, color: "bg-blue-500/20 text-blue-500" },
    vendor: { icon: Building2, color: "bg-purple-500/20 text-purple-500" },
    location: { icon: MapPin, color: "bg-green-500/20 text-green-500" },
    network: { icon: Network, color: "bg-orange-500/20 text-orange-500" },
    integration: { icon: Plug, color: "bg-cyan-500/20 text-cyan-500" },
    hardware: { icon: HardDrive, color: "bg-gray-500/20 text-gray-400" },
    data: { icon: Database, color: "bg-red-500/20 text-red-500" },
    contract: { icon: FileText, color: "bg-yellow-500/20 text-yellow-500" },
  };
  return iconMap[assetType] || { icon: Server, color: "bg-primary/20 text-primary" };
};

export default function Assets() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Fetch assets
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assets").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch asset type templates
  const { data: assetTypeTemplates = [] } = useQuery({
    queryKey: ["asset_type_templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("asset_type_templates").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch work areas for the owner dropdown
  const { data: workAreas = [] } = useQuery({
    queryKey: ["work_areas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_areas").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Delete asset mutation
  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(t("assets.deleteSuccess"));
    },
    onError: () => {
      toast.error(t("assets.deleteError"));
    },
  });

  // Check if asset is new (created within last 24 hours)
  const isNewAsset = (asset: Asset) => {
    if (!asset.created_at) return false;
    const createdAt = new Date(asset.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  // Filter and sort assets - new assets first
  const filteredAssets = useMemo(() => {
    let result = assets.filter((asset) => {
      const matchesName = asset.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesType = !typeFilter || typeFilter === "all" || asset.category?.toLowerCase().includes(typeFilter.toLowerCase());
      const matchesAssetType = !assetTypeFilter || assetTypeFilter === "all" || asset.asset_type === assetTypeFilter;
      const matchesOwner = !ownerFilter || ownerFilter === "all" || asset.work_area_id === ownerFilter;
      return matchesName && matchesType && matchesAssetType && matchesOwner;
    });

    // Sort: new assets first, then by column or name
    result = [...result].sort((a, b) => {
      // New assets always come first
      const aIsNew = isNewAsset(a);
      const bIsNew = isNewAsset(b);
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;

      // If both are new or both are old, apply column sorting
      if (sortColumn) {
        let aValue: string | number = "";
        let bValue: string | number = "";

        switch (sortColumn) {
          case "name":
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case "type":
            aValue = (a.category || "").toLowerCase();
            bValue = (b.category || "").toLowerCase();
            break;
          case "assetType":
            aValue = a.asset_type.toLowerCase();
            bValue = b.asset_type.toLowerCase();
            break;
          case "compliance":
            aValue = a.compliance_score || 0;
            bValue = b.compliance_score || 0;
            break;
          case "risk":
            aValue = a.compliance_score || 0;
            bValue = b.compliance_score || 0;
            break;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      }
      
      // Default: sort by name
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [assets, nameFilter, typeFilter, assetTypeFilter, ownerFilter, sortColumn, sortDirection]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(assets.map((s) => s.category).filter(Boolean));
    return Array.from(cats);
  }, [assets]);

  // Handle column sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="h-3.5 w-3.5 ml-1" /> 
      : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  };

  const getComplianceLabel = (score: number) => {
    if (score >= 85) return { label: `${score}%`, color: "bg-green-500/20 text-green-400 border-green-500/30" };
    if (score >= 50) return { label: `${score}%`, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    return { label: `${score}%`, color: "bg-red-500/20 text-red-400 border-red-500/30" };
  };

  const getRiskIndicator = (riskLevel: string | null) => {
    switch (riskLevel) {
      case "high": return "bg-red-500";
      case "medium": return "bg-orange-500";
      case "low": return "bg-green-500";
    default: return "bg-gray-400";
    }
  };

  const getAssetTypeLabel = (assetType: string) => {
    const template = assetTypeTemplates.find((t: AssetTypeTemplate) => t.asset_type === assetType);
    return template?.display_name || assetType;
  };

  const formatSyncTime = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Akkurat nå";
    if (diffMins < 60) return `${diffMins} min siden`;
    if (diffHours < 24) return `${diffHours}t siden`;
    if (diffDays < 7) return `${diffDays}d siden`;
    return date.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-primary">{t("assets.title")}</h1>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {t("assets.addAsset")}
          </Button>
        </div>

        {/* Summary Widget */}
        <AssetSummaryWidget assets={assets} />

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            placeholder={t("assets.filterByName")}
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="bg-muted/50 border-border"
          />
          <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue placeholder={t("assets.filterByAssetType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("assets.allAssetTypes")}</SelectItem>
              {assetTypeTemplates.map((template: AssetTypeTemplate) => (
                <SelectItem key={template.asset_type} value={template.asset_type}>
                  {template.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue placeholder={t("assets.filterByCategory")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("assets.allCategories")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat || ""}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue placeholder={t("assets.filterByOwner")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("assets.allOwners")}</SelectItem>
              {workAreas.map((area: WorkArea) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Card View */}
        {isMobile ? (
          <div className="space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {t("assets.noAssets")}
              </div>
            ) : (
              filteredAssets.map((asset) => {
                const compliance = getComplianceLabel(asset.compliance_score || 0);
                const riskColor = getRiskIndicator(asset.risk_level);
                const { icon: IconComponent, color } = getAssetTypeIcon(asset.asset_type);

                return (
                  <div
                    key={asset.id}
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    className="p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{asset.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {getAssetTypeLabel(asset.asset_type)} • {asset.category || "-"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${riskColor}`} />
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${compliance.color}`}>
                          {compliance.label}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {asset.asset_owner || t("assets.notSet")}
                      </span>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteAsset.mutate(asset.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="rounded-lg border border-border overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_80px_1.5fr_120px_100px] gap-4 px-4 py-3 bg-muted/30 text-sm font-medium text-muted-foreground">
              <button 
                onClick={() => handleSort("name")}
                className="flex items-center hover:text-foreground transition-colors text-left"
              >
                {t("assets.name")}
                <SortIcon column="name" />
              </button>
              <button 
                onClick={() => handleSort("assetType")}
                className="flex items-center hover:text-foreground transition-colors text-left"
              >
                {t("assets.assetType")}
                <SortIcon column="assetType" />
              </button>
              <button 
                onClick={() => handleSort("type")}
                className="flex items-center hover:text-foreground transition-colors text-left"
              >
                {t("assets.category")}
                <SortIcon column="type" />
              </button>
              <button 
                onClick={() => handleSort("compliance")}
                className="flex items-center gap-1 hover:text-foreground transition-colors text-left"
              >
                {t("assets.compliance")}
                <HelpCircle className="h-3.5 w-3.5" />
                <SortIcon column="compliance" />
              </button>
              <button 
                onClick={() => handleSort("risk")}
                className="flex items-center hover:text-foreground transition-colors text-left"
              >
                {t("assets.risk")}
                <SortIcon column="risk" />
              </button>
              <div>{t("assets.owner")}</div>
              <div className="flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                Synk
              </div>
              <div></div>
            </div>

            {/* Table Body */}
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {t("assets.noAssets")}
              </div>
            ) : (
              filteredAssets.map((asset) => {
                const compliance = getComplianceLabel(asset.compliance_score || 0);
                const riskColor = getRiskIndicator(asset.risk_level);
                const { icon: IconComponent, color } = getAssetTypeIcon(asset.asset_type);

                return (
                  <div
                    key={asset.id}
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    className="grid grid-cols-[2fr_1fr_1.5fr_1fr_80px_1.5fr_120px_100px] gap-4 px-4 py-3 border-t border-border items-center hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    {/* Asset Name with Icon */}
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <span className="text-foreground font-medium">{asset.name}</span>
                      {isNewAsset(asset) && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5">
                          Ny
                        </Badge>
                      )}
                    </div>

                    {/* Asset Type Badge */}
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {getAssetTypeLabel(asset.asset_type)}
                      </Badge>
                    </div>

                    {/* Category */}
                    <div className="text-muted-foreground">{asset.category || "-"}</div>

                    {/* Compliance Badge */}
                    <div>
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${compliance.color}`}>
                        {compliance.label}
                      </span>
                    </div>

                    {/* Risk Indicator */}
                    <div className="flex justify-center">
                      <div className={`h-3 w-3 rounded-full ${riskColor}`} />
                    </div>

                    {/* Owner */}
                    <div className="text-muted-foreground text-sm">
                      {asset.asset_owner || t("assets.notSet")}
                    </div>

                    {/* Sync Status */}
                    <div className="text-xs">
                      {asset.sync_enabled ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-muted-foreground">
                            {formatSyncTime(asset.last_synced_at) || "Venter..."}
                          </span>
                        </div>
                      ) : asset.external_source_provider ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <RefreshCw className="h-3.5 w-3.5 opacity-50" />
                          <span>Manuell</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteAsset.mutate(asset.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        </div>
      </main>

      <AddAssetDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        onAssetAdded={() => queryClient.invalidateQueries({ queryKey: ["assets"] })}
        assetTypeTemplates={assetTypeTemplates}
      />
    </div>
  );
}
