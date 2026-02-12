import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ExternalLink, 
  Server,
  Building2,
  MapPin,
  Network,
  Plug,
  HardDrive,
  Database,
  FileText,
  LucideIcon,
  User,
  Users,
  Send
} from "lucide-react";
import { RequestUpdateDialog } from "./RequestUpdateDialog";

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

// Demo people per work area for prototype
const DEMO_PEOPLE: Record<string, string[]> = {
  "HR og personell": ["Jan Olsen", "Kari Nordmann", "Erik Hansen", "Marte Johansen"],
  "IT og sikkerhet": ["Tore Berg", "Lise Andersen", "Anders Svendsen", "Nina Larsen"],
  "Økonomi": ["Hanne Pedersen", "Pål Eriksen", "Silje Dahl"],
  "Salg og marked": ["Kristian Haugen", "Maria Nilsen", "Ola Solberg"],
  "Ledelse": ["Trond Bakke", "Ingrid Moe", "Bjørn Sæther"],
};

const DEFAULT_PEOPLE = ["Jan Olsen", "Kari Nordmann", "Erik Hansen", "Tore Berg", "Lise Andersen"];

export function AssetHeader({ asset, template }: AssetHeaderProps) {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  const { data: workAreas = [] } = useQuery({
    queryKey: ["work_areas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_areas").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Get people list based on the asset's work area
  const selectedWorkAreaName = workAreas.find((a: any) => a.id === asset.work_area_id)?.name || "";
  const peopleList = DEMO_PEOPLE[selectedWorkAreaName] || DEFAULT_PEOPLE;

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

  const handleOwnerChange = (value: string) => {
    const workAreaId = value === "none" ? null : value;
    const selectedArea = workAreas.find((a: any) => a.id === value);
    const responsiblePerson = selectedArea?.responsible_person || null;
    updateAsset.mutate({ 
      work_area_id: workAreaId, 
      asset_manager: responsiblePerson 
    });
  };

  const handleManagerChange = (value: string) => {
    updateAsset.mutate({ asset_manager: value });
  };

  const selectedWorkArea = workAreas.find((a: any) => a.id === asset.work_area_id);
  const displayedManager = asset.asset_manager || selectedWorkArea?.responsible_person || null;

  const IconComponent = template?.icon ? iconMap[template.icon] || Server : Server;

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active": return "bg-success/15 text-success border-success/30";
      case "planned": return "bg-primary/15 text-primary border-primary/30";
      case "deprecated": return "bg-warning/15 text-warning border-warning/30";
      case "archived": return "bg-muted text-muted-foreground border-border";
      default: return "bg-muted text-muted-foreground border-border";
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
    <Card className="p-5 md:p-6">
      {/* Top row: icon + name + badges */}
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <IconComponent className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-lg md:text-xl font-bold text-foreground">{asset.name}</h1>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {template?.display_name || asset.asset_type}
            </Badge>
            <Badge className={`text-[10px] ${getStatusColor(asset.lifecycle_status)} shrink-0`}>
              {getStatusLabel(asset.lifecycle_status)}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {asset.vendor && (
              <p className="text-sm text-muted-foreground">{asset.vendor}</p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={() => setRequestDialogOpen(true)}
            >
              <Send className="h-3 w-3" />
              {isNb ? "Be om oppdatering" : "Request update"}
            </Button>
          </div>

          {asset.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {asset.description}
            </p>
          )}

          {asset.url && (
            <a 
              href={asset.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              {asset.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border my-4" />

      {/* Owner and Manager row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Owner */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
              {t("trustProfile.owner")}
            </p>
            <Select
              value={asset.work_area_id || "none"}
              onValueChange={handleOwnerChange}
            >
              <SelectTrigger className="h-7 w-[160px] text-xs bg-transparent border-none shadow-none p-0 hover:bg-muted/50 rounded">
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
        </div>

        {/* Asset Manager */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
              {t("trustProfile.systemManager")}
            </p>
            <Select
              value={asset.asset_manager || ""}
              onValueChange={handleManagerChange}
            >
              <SelectTrigger className="h-7 w-[180px] text-xs bg-transparent border-none shadow-none p-0 hover:bg-muted/50 rounded">
                <SelectValue placeholder={t("trustProfile.assignManager")} />
              </SelectTrigger>
              <SelectContent>
                {peopleList.map((person) => (
                  <SelectItem key={person} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <RequestUpdateDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        assetId={asset.id}
        assetName={asset.name}
        vendorName={asset.vendor || undefined}
      />
    </Card>
  );
}
