import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink,
  User,
  Users,
  Send,
} from "lucide-react";
import { HeaderMaturityIndicators } from "@/components/trust-controls/HeaderMaturityIndicators";
import { useState } from "react";
import { toast } from "sonner";
import { getSystemIcon } from "@/lib/systemIcons";
import { RequestUpdateDialog } from "@/components/asset-profile/RequestUpdateDialog";

interface TrustMetrics {
  trustScore: number;
  confidenceScore: number;
  lastUpdated: string;
}

interface SystemHeaderProps {
  system: {
    id: string;
    name: string;
    description?: string | null;
    vendor?: string | null;
    category?: string | null;
    status?: string | null;
    url?: string | null;
    work_area_id?: string | null;
    system_manager?: string | null;
    contact_person?: string | null;
    contact_email?: string | null;
    work_areas?: {
      id: string;
      name: string;
      responsible_person?: string | null;
    } | null;
  };
  trustMetrics?: TrustMetrics | null;
}

const DEMO_PEOPLE = ["Jan Olsen", "Kari Nordmann", "Erik Hansen", "Tore Berg", "Lise Andersen"];

export const SystemHeader = ({ system, trustMetrics }: SystemHeaderProps) => {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  const { data: workAreas = [] } = useQuery({
    queryKey: ["work-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_areas")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { work_area_id?: string | null; system_manager?: string }) => {
      const { error } = await supabase
        .from("systems")
        .update(updates)
        .eq("id", system.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system", system.id] });
      toast.success(t("trustProfile.updateSuccess"));
    },
    onError: () => {
      toast.error(t("trustProfile.updateError"));
    },
  });

  const handleWorkAreaChange = (value: string) => {
    const workAreaId = value === "none" ? null : value;
    const selectedArea = workAreas.find((a: any) => a.id === value);
    const responsiblePerson = selectedArea?.responsible_person || undefined;
    updateMutation.mutate({
      work_area_id: workAreaId,
      system_manager: responsiblePerson,
    });
  };

  const handleManagerChange = (value: string) => {
    updateMutation.mutate({ system_manager: value });
  };

  const IconComponent = getSystemIcon(system.name, system.vendor);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "in_use":
      case "active":
        return "bg-success/15 text-success border-success/30";
      case "planned":
        return "bg-primary/15 text-primary border-primary/30";
      case "deprecated":
        return "bg-warning/15 text-warning border-warning/30";
      case "archived":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "in_use":
      case "active":
        return isNb ? "Aktiv" : "Active";
      case "planned":
        return isNb ? "Planlagt" : "Planned";
      case "deprecated":
        return isNb ? "Utfaset" : "Deprecated";
      case "archived":
        return isNb ? "Arkivert" : "Archived";
      default:
        return status || "-";
    }
  };

  return (
    <Card className="p-5 md:p-6">
      {/* Top row: icon + name + badges + trust seal */}
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <IconComponent className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-lg md:text-xl font-bold text-foreground">{system.name}</h1>
            {system.vendor && (
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {system.vendor}
              </Badge>
            )}
            {system.status && (
              <Badge className={`text-[10px] ${getStatusColor(system.status)} shrink-0`}>
                {getStatusLabel(system.status)}
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
            {system.category && (
              <p className="text-sm text-muted-foreground">{system.category}</p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 w-fit"
              onClick={() => setRequestDialogOpen(true)}
            >
              <Send className="h-3 w-3" />
              {isNb ? "Be om oppdatering" : "Request update"}
            </Button>
          </div>

          {system.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {system.description}
            </p>
          )}

          {system.url && (
            <a
              href={system.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              {system.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Risk / Criticality / Maturity indicators */}
        <HeaderMaturityIndicators
          riskLevel={(system as any).risk_level || "medium"}
          criticality={(system as any).criticality || "medium"}
          maturityPercent={trustMetrics?.trustScore ?? 0}
        />
      </div>

      {/* Owner and Manager row */}
      <div className="border-t border-border my-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
              {t("trustProfile.owner")}
            </p>
            <Select value={system.work_area_id || "none"} onValueChange={handleWorkAreaChange}>
              <SelectTrigger className="h-7 w-full max-w-[200px] text-xs bg-transparent border-none shadow-none p-0 hover:bg-muted/50 rounded">
                <SelectValue placeholder={t("trustProfile.selectOwner")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("trustProfile.noOwner")}</SelectItem>
                {workAreas.map((area: any) => (
                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
              {t("trustProfile.systemManager")}
            </p>
            <Select value={system.system_manager || ""} onValueChange={handleManagerChange}>
              <SelectTrigger className="h-7 w-full max-w-[200px] text-xs bg-transparent border-none shadow-none p-0 hover:bg-muted/50 rounded">
                <SelectValue placeholder={t("trustProfile.assignManager")} />
              </SelectTrigger>
              <SelectContent>
                {DEMO_PEOPLE.map((person) => (
                  <SelectItem key={person} value={person}>{person}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <RequestUpdateDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        assetId={system.id}
        assetName={system.name}
        vendorName={system.vendor || undefined}
        contactPerson={system.contact_person || undefined}
        contactEmail={system.contact_email || undefined}
      />
    </Card>
  );
};
