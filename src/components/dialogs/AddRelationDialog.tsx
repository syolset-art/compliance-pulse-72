import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowRight, Server, Building2, Box, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddRelationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceAssetId: string;
}

type TargetCategory = "vendor" | "system" | "other" | null;

const CATEGORY_CONFIG = [
  { value: "vendor" as const, label: "Leverandør", icon: Building2, color: "text-accent", bgColor: "bg-accent/10", borderColor: "border-accent/30", activeBg: "bg-accent/20" },
  { value: "system" as const, label: "System", icon: Server, color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/30", activeBg: "bg-primary/20" },
  { value: "other" as const, label: "Annen eiendel", icon: Box, color: "text-warning", bgColor: "bg-warning/10", borderColor: "border-warning/30", activeBg: "bg-warning/20" },
];

const RELATIONSHIP_TYPES_BY_CATEGORY: Record<string, { value: string; label: string; description: string }[]> = {
  vendor: [
    { value: "uses", label: "Leverer tjeneste til", description: "Leverandøren leverer en tjeneste vi bruker" },
    { value: "governed_by", label: "Behandler data for", description: "Leverandøren behandler persondata på våre vegne" },
    { value: "integrates_with", label: "Regulerer", description: "Leverandøren har en regulatorisk rolle" },
  ],
  system: [
    { value: "uses", label: "Bruker", description: "Systemet brukes av denne eiendelen" },
    { value: "integrates_with", label: "Integrerer med", description: "Systemene utveksler data eller funksjonalitet" },
    { value: "connects_to", label: "Er avhengig av", description: "Denne eiendelen er avhengig av systemet" },
  ],
  other: [
    { value: "connects_to", label: "Kobles til", description: "En nettverksmessig eller logisk kobling" },
    { value: "hosts", label: "Hoster", description: "Eiendelen kjører på eller hostes av denne" },
    { value: "governed_by", label: "Styres av", description: "Eiendelen er underlagt denne policyen eller kontrollen" },
  ],
};

const getAssetTypeBadgeColor = (type: string) => {
  const colors: Record<string, string> = {
    system: "bg-primary/20 text-primary border-primary/30",
    vendor: "bg-accent/20 text-accent border-accent/30",
    location: "bg-status-closed/20 text-status-closed border-status-closed/30",
    network: "bg-warning/20 text-warning border-warning/30",
    integration: "bg-primary/20 text-primary border-primary/30",
    hardware: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    data: "bg-destructive/20 text-destructive border-destructive/30",
    contract: "bg-warning/20 text-warning border-warning/30",
  };
  return colors[type] || "bg-muted text-muted-foreground";
};

export const AddRelationDialog = ({
  open,
  onOpenChange,
  sourceAssetId,
}: AddRelationDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [targetCategory, setTargetCategory] = useState<TargetCategory>(null);
  const [relationshipType, setRelationshipType] = useState("");
  const [targetAssetId, setTargetAssetId] = useState("");
  const [description, setDescription] = useState("");
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);

  // Fetch source asset
  const { data: sourceAsset } = useQuery({
    queryKey: ["asset-source", sourceAssetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, asset_type")
        .eq("id", sourceAssetId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch all assets except the current one
  const { data: assets } = useQuery({
    queryKey: ["assets-for-relations", sourceAssetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, asset_type")
        .neq("id", sourceAssetId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const filteredAssets = useMemo(() => {
    if (!assets || !targetCategory) return [];
    if (targetCategory === "vendor") return assets.filter((a) => a.asset_type === "vendor");
    if (targetCategory === "system") return assets.filter((a) => a.asset_type === "system");
    return assets.filter((a) => !["vendor", "system"].includes(a.asset_type));
  }, [assets, targetCategory]);

  const selectedAsset = assets?.find((a) => a.id === targetAssetId);
  const relationshipTypes = targetCategory ? RELATIONSHIP_TYPES_BY_CATEGORY[targetCategory] : [];

  const createRelation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("asset_relationships")
        .insert({
          source_asset_id: sourceAssetId,
          target_asset_id: targetAssetId,
          relationship_type: relationshipType,
          description: description || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-relations-outgoing", sourceAssetId] });
      toast.success(t("assets.relationCreated"));
      handleClose();
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  const handleClose = () => {
    setTargetCategory(null);
    setRelationshipType("");
    setTargetAssetId("");
    setDescription("");
    onOpenChange(false);
  };

  const handleCategoryChange = (cat: TargetCategory) => {
    setTargetCategory(cat);
    setRelationshipType("");
    setTargetAssetId("");
  };

  const handleSubmit = () => {
    if (!relationshipType || !targetAssetId) return;
    createRelation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Legg til relasjon</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Visual flow */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex-1 p-2.5 rounded-md border bg-background text-sm">
              <p className="font-medium truncate">{sourceAsset?.name || "..."}</p>
              <Badge className={cn("text-xs mt-1", getAssetTypeBadgeColor(sourceAsset?.asset_type || ""))}>
                {sourceAsset?.asset_type}
              </Badge>
            </div>
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              {relationshipType && (
                <span className="text-[13px] text-muted-foreground max-w-[80px] text-center leading-tight">
                  {relationshipTypes.find((r) => r.value === relationshipType)?.label}
                </span>
              )}
            </div>
            <div className={cn("flex-1 p-2.5 rounded-md border text-sm", selectedAsset ? "bg-background" : "bg-muted/30 border-dashed")}>
              {selectedAsset ? (
                <>
                  <p className="font-medium truncate">{selectedAsset.name}</p>
                  <Badge className={cn("text-xs mt-1", getAssetTypeBadgeColor(selectedAsset.asset_type))}>
                    {selectedAsset.asset_type}
                  </Badge>
                </>
              ) : (
                <p className="text-muted-foreground text-xs">Velg mål-eiendel</p>
              )}
            </div>
          </div>

          {/* Step 1: Category */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">1. Hva vil du koble til?</Label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_CONFIG.map((cat) => {
                const Icon = cat.icon;
                const isActive = targetCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategoryChange(cat.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-sm cursor-pointer",
                      isActive
                        ? `${cat.activeBg} ${cat.borderColor} ${cat.color}`
                        : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive ? cat.color : "")} />
                    <span className="font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Relationship type */}
          {targetCategory && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2. Type relasjon</Label>
              <div className="space-y-1.5">
                {relationshipTypes.map((rel) => (
                  <button
                    key={rel.value}
                    type="button"
                    onClick={() => setRelationshipType(rel.value)}
                    className={cn(
                      "w-full flex flex-col items-start p-2.5 rounded-lg border transition-all text-left cursor-pointer",
                      relationshipType === rel.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <span className="text-sm font-medium">{rel.label}</span>
                    <span className="text-xs text-muted-foreground">{rel.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Target asset */}
          {targetCategory && relationshipType && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">3. Velg eiendel</Label>
              <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedAsset ? (
                      <div className="flex items-center gap-2">
                        <span>{selectedAsset.name}</span>
                        <Badge className={cn("text-xs", getAssetTypeBadgeColor(selectedAsset.asset_type))}>
                          {selectedAsset.asset_type}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Søk etter eiendel...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Søk etter eiendel..." />
                    <CommandList>
                      <CommandEmpty>Ingen eiendeler funnet</CommandEmpty>
                      <CommandGroup>
                        {filteredAssets.map((asset) => (
                          <CommandItem
                            key={asset.id}
                            value={asset.name}
                            onSelect={() => {
                              setTargetAssetId(asset.id);
                              setAssetPopoverOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", targetAssetId === asset.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex items-center gap-2 flex-1">
                              <span>{asset.name}</span>
                              <Badge className={cn("text-xs ml-auto", getAssetTypeBadgeColor(asset.asset_type))}>
                                {asset.asset_type}
                              </Badge>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Step 4: Description */}
          {targetAssetId && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">4. Beskrivelse (valgfritt)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv relasjonen kort..."
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!relationshipType || !targetAssetId || createRelation.isPending}
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
