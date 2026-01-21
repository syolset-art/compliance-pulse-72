import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ArrowRight, Server, Network, GitMerge, Shield, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddRelationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceAssetId: string;
}

const RELATIONSHIP_TYPES = [
  { value: "uses", icon: ArrowRight, color: "text-blue-500", bgColor: "bg-blue-500/20" },
  { value: "hosts", icon: Server, color: "text-green-500", bgColor: "bg-green-500/20" },
  { value: "connects_to", icon: Network, color: "text-orange-500", bgColor: "bg-orange-500/20" },
  { value: "integrates_with", icon: GitMerge, color: "text-cyan-500", bgColor: "bg-cyan-500/20" },
  { value: "governed_by", icon: Shield, color: "text-yellow-500", bgColor: "bg-yellow-500/20" },
];

export const AddRelationDialog = ({
  open,
  onOpenChange,
  sourceAssetId,
}: AddRelationDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [relationshipType, setRelationshipType] = useState("");
  const [targetAssetId, setTargetAssetId] = useState("");
  const [description, setDescription] = useState("");
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);

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
    onError: (error) => {
      console.error("Failed to create relation:", error);
      toast.error(t("common.error"));
    },
  });

  const handleClose = () => {
    setRelationshipType("");
    setTargetAssetId("");
    setDescription("");
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!relationshipType || !targetAssetId) return;
    createRelation.mutate();
  };

  const selectedAsset = assets?.find((a) => a.id === targetAssetId);

  const getAssetTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      system: "bg-blue-500/20 text-blue-500 border-blue-500/30",
      vendor: "bg-purple-500/20 text-purple-500 border-purple-500/30",
      location: "bg-green-500/20 text-green-500 border-green-500/30",
      network: "bg-orange-500/20 text-orange-500 border-orange-500/30",
      integration: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
      hardware: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      data: "bg-red-500/20 text-red-500 border-red-500/30",
      contract: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("assets.addRelationTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Relationship Type */}
          <div className="space-y-2">
            <Label>{t("assets.relationType")}</Label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger>
                <SelectValue placeholder={t("assets.selectRelationType")} />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1 rounded", type.bgColor)}>
                          <Icon className={cn("h-3 w-3", type.color)} />
                        </div>
                        <span>{t(`assets.relation${type.value.charAt(0).toUpperCase() + type.value.slice(1).replace(/_/g, "")}`)}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Target Asset */}
          <div className="space-y-2">
            <Label>{t("assets.targetAsset")}</Label>
            <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={assetPopoverOpen}
                  className="w-full justify-between"
                >
                  {selectedAsset ? (
                    <div className="flex items-center gap-2">
                      <span>{selectedAsset.name}</span>
                      <Badge className={cn("text-xs", getAssetTypeBadgeColor(selectedAsset.asset_type))}>
                        {selectedAsset.asset_type}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">{t("assets.searchAsset")}</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="start">
                <Command>
                  <CommandInput placeholder={t("assets.searchAsset")} />
                  <CommandList>
                    <CommandEmpty>{t("assets.noAssetsFound")}</CommandEmpty>
                    <CommandGroup>
                      {assets?.map((asset) => (
                        <CommandItem
                          key={asset.id}
                          value={asset.name}
                          onSelect={() => {
                            setTargetAssetId(asset.id);
                            setAssetPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              targetAssetId === asset.id ? "opacity-100" : "opacity-0"
                            )}
                          />
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

          {/* Description */}
          <div className="space-y-2">
            <Label>{t("assets.relationDescription")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("assets.relationDescriptionPlaceholder")}
              rows={3}
            />
          </div>
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
