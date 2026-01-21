import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Server,
  Building2,
  Network,
  Search,
  Sparkles,
  Check,
  Loader2,
  FolderOpen,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  description: string | null;
  asset_type: string;
  risk_level: string | null;
  vendor: string | null;
  work_area_id: string | null;
}

interface AssetTemplate {
  name: string;
  asset_type: string;
  vendor: string | null;
  description: string | null;
  category: string;
  industry?: string;
}

interface AssignAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workAreaId: string;
  workAreaName: string;
  existingAssetIds: string[];
  onAssetsUpdated: () => void;
}

// Mynders template library - industry-specific and general assets
const ASSET_TEMPLATES: AssetTemplate[] = [
  // General systems
  { name: "Slack", asset_type: "system", vendor: "Slack Technologies", description: "Team kommunikasjon", category: "Generelt" },
  { name: "Microsoft Teams", asset_type: "system", vendor: "Microsoft", description: "Samarbeid og møter", category: "Generelt" },
  { name: "Jira", asset_type: "system", vendor: "Atlassian", description: "Prosjektstyring", category: "Generelt" },
  { name: "Confluence", asset_type: "system", vendor: "Atlassian", description: "Dokumentasjon og wiki", category: "Generelt" },
  { name: "Google Workspace", asset_type: "system", vendor: "Google", description: "E-post og produktivitet", category: "Generelt" },
  { name: "Dropbox Business", asset_type: "system", vendor: "Dropbox", description: "Fildeling og lagring", category: "Generelt" },
  { name: "Zoom", asset_type: "system", vendor: "Zoom", description: "Videokonferanser", category: "Generelt" },
  
  // Locations
  { name: "Eksternt datasenter", asset_type: "location", vendor: null, description: "Co-location eller sky-basert datasenter", category: "Lokasjoner" },
  { name: "Backup-lokasjon", asset_type: "location", vendor: null, description: "Sekundær backup-lagring", category: "Lokasjoner" },
  { name: "Filialbkontor", asset_type: "location", vendor: null, description: "Regionalt kontor", category: "Lokasjoner" },
  { name: "Hjemmekontor", asset_type: "location", vendor: null, description: "Fjernarbeidsplasser", category: "Lokasjoner" },
  
  // Networks
  { name: "VPN Gateway", asset_type: "network", vendor: null, description: "Sikker fjerntilgang", category: "Nettverk" },
  { name: "Gjestenett", asset_type: "network", vendor: null, description: "Isolert gjestenettverk", category: "Nettverk" },
  { name: "IoT-nettverk", asset_type: "network", vendor: null, description: "Segmentert IoT-nett", category: "Nettverk" },
  { name: "Cloud VPC", asset_type: "network", vendor: null, description: "Virtuelt privat sky-nettverk", category: "Nettverk" },
  
  // Energy-specific
  { name: "SCADA System", asset_type: "system", vendor: "Siemens", description: "Industriell kontroll", category: "Energi", industry: "Energi" },
  { name: "Elhub", asset_type: "system", vendor: "Elhub AS", description: "Norsk strømmåler-datahub", category: "Energi", industry: "Energi" },
  { name: "DMS (ABB)", asset_type: "system", vendor: "ABB", description: "Distribusjonsstyring", category: "Energi", industry: "Energi" },
  { name: "MDMS", asset_type: "system", vendor: null, description: "Måledatabehandling", category: "Energi", industry: "Energi" },
  
  // Finance-specific
  { name: "Mambu", asset_type: "system", vendor: "Mambu", description: "Core banking plattform", category: "Finans", industry: "Finans og forsikring" },
  { name: "Temenos T24", asset_type: "system", vendor: "Temenos", description: "Bankløsning", category: "Finans", industry: "Finans og forsikring" },
  { name: "Bloomberg Terminal", asset_type: "system", vendor: "Bloomberg", description: "Finansdata og analyse", category: "Finans", industry: "Finans og forsikring" },
  
  // Healthcare-specific
  { name: "DIPS Arena", asset_type: "system", vendor: "DIPS AS", description: "Elektronisk pasientjournal", category: "Helse", industry: "Helse" },
  { name: "Helseplattformen", asset_type: "system", vendor: "Epic", description: "Regional helsejournal", category: "Helse", industry: "Helse" },
  { name: "Visma Flyt Helse", asset_type: "system", vendor: "Visma", description: "Kommunehelsetjeneste", category: "Helse", industry: "Helse" },
];

export function AssignAssetDialog({
  open,
  onOpenChange,
  workAreaId,
  workAreaName,
  existingAssetIds,
  onAssetsUpdated,
}: AssignAssetDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("portfolio");

  // Fetch all available assets (not already in this work area)
  const { data: availableAssets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ["available-assets-for-assignment", workAreaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as Asset[];
    },
    enabled: open,
  });

  // Fetch company profile for industry-specific templates
  const { data: companyProfile } = useQuery({
    queryKey: ["company-profile-for-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_profile")
        .select("*")
        .single();
      if (error) return null;
      return data;
    },
    enabled: open,
  });

  // Filter assets that are not already assigned to this work area
  const filteredPortfolioAssets = useMemo(() => {
    return availableAssets
      .filter((asset) => asset.work_area_id !== workAreaId)
      .filter((asset) => !existingAssetIds.includes(asset.id))
      .filter((asset) => 
        typeFilter === "all" || asset.asset_type === typeFilter
      )
      .filter((asset) =>
        searchQuery === "" ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.vendor?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [availableAssets, workAreaId, existingAssetIds, typeFilter, searchQuery]);

  // Get already assigned assets for display
  const alreadyAssignedAssets = useMemo(() => {
    return availableAssets.filter(
      (asset) => asset.work_area_id === workAreaId || existingAssetIds.includes(asset.id)
    );
  }, [availableAssets, workAreaId, existingAssetIds]);

  // Filter templates based on industry and search
  const filteredTemplates = useMemo(() => {
    const industry = companyProfile?.industry;
    return ASSET_TEMPLATES
      .filter((template) => 
        typeFilter === "all" || template.asset_type === typeFilter
      )
      .filter((template) =>
        searchQuery === "" ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        // Prioritize industry-specific templates
        const aIsIndustry = a.industry === industry;
        const bIsIndustry = b.industry === industry;
        if (aIsIndustry && !bIsIndustry) return -1;
        if (!aIsIndustry && bIsIndustry) return 1;
        return 0;
      });
  }, [typeFilter, searchQuery, companyProfile]);

  // Grouped templates
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, AssetTemplate[]> = {};
    filteredTemplates.forEach((template) => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });
    return groups;
  }, [filteredTemplates]);

  // Mutation for assigning existing assets as owner
  const assignAsOwnerMutation = useMutation({
    mutationFn: async (assetIds: string[]) => {
      const { error } = await supabase
        .from("assets")
        .update({ work_area_id: workAreaId })
        .in("id", assetIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-area-assets-owned"] });
      queryClient.invalidateQueries({ queryKey: ["available-assets-for-assignment"] });
      toast({
        title: t("common.success"),
        description: `${selectedAssets.size} ${t("assignAsset.assetsAssigned")}`,
      });
      resetAndClose();
      onAssetsUpdated();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("assignAsset.errorAssigning"),
        variant: "destructive",
      });
    },
  });

  // Mutation for assigning existing assets as user (via relationships)
  const assignAsUserMutation = useMutation({
    mutationFn: async (assetIds: string[]) => {
      // Get owned assets to create relationships from
      const { data: ownedAssets } = await supabase
        .from("assets")
        .select("id")
        .eq("work_area_id", workAreaId)
        .limit(1);

      if (!ownedAssets || ownedAssets.length === 0) {
        throw new Error("No owned assets to create relationship from");
      }

      const sourceAssetId = ownedAssets[0].id;

      const relationships = assetIds.map((targetId) => ({
        source_asset_id: sourceAssetId,
        target_asset_id: targetId,
        relationship_type: "uses",
        description: `Used by ${workAreaName}`,
      }));

      const { error } = await supabase
        .from("asset_relationships")
        .insert(relationships);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-area-assets-used"] });
      toast({
        title: t("common.success"),
        description: `${selectedAssets.size} ${t("assignAsset.assetsLinked")}`,
      });
      resetAndClose();
      onAssetsUpdated();
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message.includes("No owned assets") 
          ? t("assignAsset.needOwnerFirst")
          : t("assignAsset.errorAssigning"),
        variant: "destructive",
      });
    },
  });

  // Mutation for creating assets from templates
  const createFromTemplatesMutation = useMutation({
    mutationFn: async (templateIndices: number[]) => {
      const newAssets = templateIndices.map((index) => {
        const template = ASSET_TEMPLATES[index];
        return {
          name: template.name,
          asset_type: template.asset_type,
          description: template.description,
          vendor: template.vendor,
          work_area_id: workAreaId,
          risk_level: "medium",
          criticality: "medium",
        };
      });

      const { error } = await supabase.from("assets").insert(newAssets);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-area-assets-owned"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({
        title: t("common.success"),
        description: `${selectedTemplates.size} ${t("assignAsset.assetsCreated")}`,
      });
      resetAndClose();
      onAssetsUpdated();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("assignAsset.errorCreating"),
        variant: "destructive",
      });
    },
  });

  const resetAndClose = () => {
    setSelectedAssets(new Set());
    setSelectedTemplates(new Set());
    setSearchQuery("");
    setTypeFilter("all");
    setActiveTab("portfolio");
    onOpenChange(false);
  };

  const toggleAsset = (id: string) => {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleTemplate = (index: number) => {
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case "system":
        return <Server className="h-4 w-4 text-blue-500" />;
      case "location":
        return <Building2 className="h-4 w-4 text-green-500" />;
      case "network":
        return <Network className="h-4 w-4 text-orange-500" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const isLoading = assignAsOwnerMutation.isPending || 
    assignAsUserMutation.isPending || 
    createFromTemplatesMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {t("assignAsset.title", { workArea: workAreaName })}
          </DialogTitle>
          <DialogDescription>
            {t("assignAsset.description")}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="portfolio" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              {t("assignAsset.myPortfolio")}
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Library className="h-4 w-4" />
              {t("assignAsset.mynderTemplates")}
            </TabsTrigger>
          </TabsList>

          {/* Search and Filter */}
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("myWorkAreas.filterAll")}</SelectItem>
                <SelectItem value="system">{t("myWorkAreas.assetTypes.system")}</SelectItem>
                <SelectItem value="location">{t("myWorkAreas.assetTypes.location")}</SelectItem>
                <SelectItem value="network">{t("myWorkAreas.assetTypes.network")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="flex-1 mt-4 overflow-hidden">
            <ScrollArea className="h-[300px] pr-4">
              {isLoadingAssets ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPortfolioAssets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("assignAsset.noAssetsAvailable")}</p>
                  <p className="text-sm mt-1">{t("assignAsset.tryTemplates")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPortfolioAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedAssets.has(asset.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => toggleAsset(asset.id)}
                    >
                      <Checkbox
                        checked={selectedAssets.has(asset.id)}
                        onCheckedChange={() => toggleAsset(asset.id)}
                      />
                      {getAssetIcon(asset.asset_type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.vendor || asset.description || "-"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {t(`myWorkAreas.assetTypes.${asset.asset_type}`)}
                      </Badge>
                    </div>
                  ))}

                  {alreadyAssignedAssets.length > 0 && (
                    <>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide py-2 border-t mt-4">
                        {t("assignAsset.alreadyAssigned")}
                      </div>
                      {alreadyAssignedAssets.slice(0, 3).map((asset) => (
                        <div
                          key={asset.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-dashed opacity-50"
                        >
                          {getAssetIcon(asset.asset_type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{asset.name}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            {t("myWorkAreas.roleOwner")}
                          </Badge>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="flex-1 mt-4 overflow-hidden">
            <ScrollArea className="h-[300px] pr-4">
              {Object.entries(groupedTemplates).map(([category, templates]) => (
                <div key={category} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-muted-foreground">{category}</p>
                    {category === companyProfile?.industry && (
                      <Badge className="bg-primary/20 text-primary text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {t("assignAsset.recommended")}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {templates.map((template) => {
                      const index = ASSET_TEMPLATES.indexOf(template);
                      return (
                        <div
                          key={index}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            selectedTemplates.has(index)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => toggleTemplate(index)}
                        >
                          <Checkbox
                            checked={selectedTemplates.has(index)}
                            onCheckedChange={() => toggleTemplate(index)}
                          />
                          {getAssetIcon(template.asset_type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{template.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {template.description}
                            </p>
                          </div>
                          {template.vendor && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {template.vendor}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {activeTab === "portfolio" 
              ? t("assignAsset.selectedCount", { count: selectedAssets.size })
              : t("assignAsset.selectedCount", { count: selectedTemplates.size })}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetAndClose} disabled={isLoading}>
              {t("common.cancel")}
            </Button>
            {activeTab === "portfolio" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => assignAsUserMutation.mutate(Array.from(selectedAssets))}
                  disabled={selectedAssets.size === 0 || isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t("assignAsset.assignAsUser")}
                </Button>
                <Button
                  onClick={() => assignAsOwnerMutation.mutate(Array.from(selectedAssets))}
                  disabled={selectedAssets.size === 0 || isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t("assignAsset.assignAsOwner")}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => createFromTemplatesMutation.mutate(Array.from(selectedTemplates))}
                disabled={selectedTemplates.size === 0 || isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("assignAsset.addAndAssign")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
