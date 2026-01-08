import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ExternalLink, 
  Check, 
  X,
  Server,
  Building2,
  MapPin,
  Network,
  Plug,
  HardDrive,
  Database,
  FileText,
  LucideIcon
} from "lucide-react";

interface AssetHeaderProps {
  asset: {
    id: string;
    asset_type: string;
    name: string;
    description: string | null;
    vendor: string | null;
    category: string | null;
    lifecycle_status: string | null;
    url: string | null;
    work_area_id: string | null;
    asset_manager: string | null;
    work_areas?: {
      id: string;
      name: string;
      responsible_person: string | null;
    } | null;
  };
  template?: {
    asset_type: string;
    display_name: string;
    icon: string;
    color: string;
  } | null;
}

const iconMap: Record<string, LucideIcon> = {
  Server,
  Building2,
  MapPin,
  Network,
  Plug,
  HardDrive,
  Database,
  FileText,
};

export function AssetHeader({ asset, template }: AssetHeaderProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isEditingManager, setIsEditingManager] = useState(false);
  const [managerName, setManagerName] = useState(asset.asset_manager || "");

  // Fetch work areas for dropdown
  const { data: workAreas = [] } = useQuery({
    queryKey: ["work_areas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_areas").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Update asset mutation
  const updateAsset = useMutation({
    mutationFn: async (updates: Partial<{ work_area_id: string | null; asset_manager: string | null }>) => {
      const { error } = await supabase
        .from("assets")
        .update(updates)
        .eq("id", asset.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", asset.id] });
      toast.success(t("trustProfile.updateSuccess"));
    },
    onError: () => {
      toast.error(t("trustProfile.updateError"));
    },
  });

  const handleSaveManager = () => {
    updateAsset.mutate({ asset_manager: managerName || null });
    setIsEditingManager(false);
  };

  const handleCancelManager = () => {
    setManagerName(asset.asset_manager || "");
    setIsEditingManager(false);
  };

  const IconComponent = template?.icon ? iconMap[template.icon] || Server : Server;

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "planned": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "deprecated": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "archived": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "active": return t("assets.statusActive");
      case "planned": return t("assets.statusPlanned");
      case "deprecated": return t("assets.statusDeprecated");
      case "archived": return t("assets.statusArchived");
      default: return status || "-";
    }
  };

  return (
    <div className="flex items-start gap-6">
      {/* Icon */}
      <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
        <IconComponent className="h-8 w-8 text-primary" />
      </div>

      {/* Info */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{asset.name}</h1>
          <Badge variant="outline" className="text-xs">
            {template?.display_name || asset.asset_type}
          </Badge>
          {asset.vendor && (
            <span className="text-muted-foreground">• {asset.vendor}</span>
          )}
          <Badge className={`${getStatusColor(asset.lifecycle_status)}`}>
            {getStatusLabel(asset.lifecycle_status)}
          </Badge>
        </div>

        {asset.url && (
          <a 
            href={asset.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {asset.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {asset.description && (
          <p className="text-muted-foreground text-sm max-w-2xl">
            {asset.description}
          </p>
        )}

        {/* Owner and Manager */}
        <div className="flex items-center gap-6 pt-2">
          {/* Owner (Work Area) */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("trustProfile.owner")}:</span>
            <Select
              value={asset.work_area_id || "none"}
              onValueChange={(value) => updateAsset.mutate({ work_area_id: value === "none" ? null : value })}
            >
              <SelectTrigger className="h-8 w-[180px] bg-muted/30">
                <SelectValue placeholder={t("trustProfile.selectOwner")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("trustProfile.noOwner")}</SelectItem>
                {workAreas.map((area: any) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Asset Manager */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("trustProfile.systemManager")}:</span>
            {isEditingManager ? (
              <div className="flex items-center gap-1">
                <Input
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="h-8 w-[180px]"
                  placeholder={t("trustProfile.enterManager")}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveManager}>
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelManager}>
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="h-8 px-2 text-foreground hover:bg-muted/50"
                onClick={() => setIsEditingManager(true)}
              >
                {asset.asset_manager || t("trustProfile.assignManager")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
