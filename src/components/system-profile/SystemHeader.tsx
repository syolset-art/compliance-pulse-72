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
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
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

        {/* Trust Score Seal */}
        {trustMetrics && (() => {
          const score = trustMetrics.trustScore;
          const conf = trustMetrics.confidenceScore;
          const isHigh = score >= 75;
          const isMid = score >= 50;
          const radius = 38;
          const circ = 2 * Math.PI * radius;
          const dash = (score / 100) * circ;
          const strokeColor = isHigh ? "hsl(var(--success))" : isMid ? "hsl(var(--warning))" : "hsl(var(--destructive))";
          const bgRingColor = "hsl(var(--muted))";
          const confLabel = conf >= 80
            ? (isNb ? "Høy tillit" : "High confidence")
            : conf >= 50
              ? (isNb ? "Middels tillit" : "Medium confidence")
              : (isNb ? "Lav tillit" : "Low confidence");
          return (
            <div className="hidden md:flex flex-col items-center gap-2 shrink-0 pl-6 border-l border-border">
              <div className="relative flex items-center justify-center">
                <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                  <circle cx="48" cy="48" r={radius} fill="none" stroke={bgRingColor} strokeWidth="6" />
                  <circle
                    cx="48" cy="48" r={radius} fill="none"
                    stroke={strokeColor} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold tabular-nums leading-none ${isHigh ? "text-success" : isMid ? "text-warning" : "text-destructive"}`}>
                    {score}
                  </span>
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">/100</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Trust Score</span>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  {conf >= 80 && <CheckCircle2 className="h-3 w-3 text-success" />}
                  {conf >= 50 && conf < 80 && <AlertTriangle className="h-3 w-3 text-warning" />}
                  {conf < 50 && <XCircle className="h-3 w-3 text-muted-foreground" />}
                  <span className={`text-[11px] font-medium ${conf >= 80 ? "text-success" : conf >= 50 ? "text-warning" : "text-muted-foreground"}`}>
                    {confLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{trustMetrics.lastUpdated}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] text-muted-foreground gap-1 px-2 py-0.5 h-5">
                <ShieldCheck className="h-2.5 w-2.5" />
                {isNb ? "Egenerklæring" : "Self-declared"}
              </Badge>
            </div>
          );
        })()}
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
