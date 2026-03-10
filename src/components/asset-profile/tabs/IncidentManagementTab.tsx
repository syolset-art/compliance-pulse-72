import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, AlertTriangle, CheckCircle, Clock, AlertCircle, RefreshCw, ShieldAlert, CheckCircle2, X } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

interface IncidentManagementTabProps {
  assetId: string;
}

const SEVERITY_CONFIG: Record<string, { labelNb: string; labelEn: string; className: string }> = {
  critical: { labelNb: "Kritisk", labelEn: "Critical", className: "bg-red-500/15 text-red-700 border-red-500/30" },
  high: { labelNb: "Høy", labelEn: "High", className: "bg-orange-500/15 text-orange-700 border-orange-500/30" },
  medium: { labelNb: "Middels", labelEn: "Medium", className: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" },
  low: { labelNb: "Lav", labelEn: "Low", className: "bg-green-500/15 text-green-700 border-green-500/30" },
};

function getSeverityFromFileName(fileName?: string | null): string | null {
  if (!fileName) return null;
  const severityMap: Record<string, string> = {
    "7SEC-2026-0451": "critical",
    "7SEC-2026-0449": "high",
    "7SEC-2026-0447": "medium",
    "7SEC-2026-0445": "high",
    "7SEC-2026-0443": "medium",
  };
  for (const [id, sev] of Object.entries(severityMap)) {
    if (fileName.includes(id)) return sev;
  }
  return null;
}

export const IncidentManagementTab = ({ assetId }: IncidentManagementTabProps) => {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();

  const { data: incidents } = useQuery({
    queryKey: ["system-incidents", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_incidents")
        .select("*")
        .eq("system_id", assetId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch pending inbox incidents for this asset
  const { data: pendingIncidents = [] } = useQuery({
    queryKey: ["lara-inbox-incidents", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lara_inbox")
        .select("*")
        .eq("matched_asset_id", assetId)
        .eq("matched_document_type", "incident")
        .in("status", ["new", "auto_matched"])
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch incidents from 7 Security
  const fetchIncidentsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("push-vendor-incidents", {
        body: { action: "fetch_recent_incidents", asset_id: assetId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-incidents", assetId] });
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-global"] });
      toast.success(data.message || (isNb ? "Hendelser hentet" : "Incidents fetched"));
    },
    onError: (err: any) => {
      toast.error((isNb ? "Feil ved henting: " : "Error fetching: ") + err.message);
    },
  });

  // Approve incident inline
  const approveIncidentMutation = useMutation({
    mutationFn: async (item: any) => {
      const severity = getSeverityFromFileName(item.file_name) || "medium";
      await supabase.from("system_incidents").insert({
        system_id: assetId,
        title: item.subject,
        description: item.file_path,
        risk_level: severity,
        criticality: severity,
        status: "open",
        source: "7security",
        source_incident_id: item.file_name?.replace(".json", "") || null,
        source_severity: severity,
        auto_created: true,
        category: "sikkerhetshendelse",
      } as any);
      await supabase.from("lara_inbox").update({ status: "manually_assigned", processed_at: new Date().toISOString() } as any).eq("id", item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-incidents", assetId] });
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-incidents", assetId] });
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-global"] });
      queryClient.invalidateQueries({ queryKey: ["deviations"] });
      toast.success(isNb ? "Hendelse godkjent og opprettet som avvik" : "Incident approved and created as deviation");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await supabase.from("lara_inbox").update({ status: "rejected", processed_at: new Date().toISOString() } as any).eq("id", itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-incidents", assetId] });
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-global"] });
      toast.success("Hendelse avvist");
    },
  });

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd.MM.yyyy HH:mm", { locale: i18n.language === "nb" ? nb : undefined });
    } catch {
      return "-";
    }
  };

  const getRiskLevelBadge = (level?: string) => {
    switch (level?.toLowerCase()) {
      case "high":
      case "høy":
      case "critical":
        return <Badge variant="destructive">{t("trustProfile.riskHigh")}</Badge>;
      case "medium":
      case "middels":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">{t("trustProfile.riskMedium")}</Badge>;
      default:
        return <Badge variant="secondary">{t("trustProfile.riskLow")}</Badge>;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
      case "løst":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress":
      case "pågår":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const openIncidents = incidents?.filter(i => i.status !== "resolved").length || 0;
  const resolvedIncidents = incidents?.filter(i => i.status === "resolved").length || 0;

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card className={openIncidents > 0 ? "border-yellow-500/50 bg-yellow-500/5" : "border-green-500/50 bg-green-500/5"}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {openIncidents > 0 ? (
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
            <div>
              <p className="font-medium">
                {openIncidents > 0 
                  ? t("trustProfile.openIncidentsWarning", { count: openIncidents })
                  : t("trustProfile.noOpenIncidents")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("trustProfile.totalResolved", { count: resolvedIncidents })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Feed from 7 Security */}
      <Card className="border-orange-500/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-orange-600" />
            Live hendelser fra 7 Security
            {pendingIncidents.length > 0 && (
              <Badge className="bg-orange-500/15 text-orange-700 border-orange-500/30 text-xs">
                {pendingIncidents.length} nye
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchIncidentsMutation.mutate()}
            disabled={fetchIncidentsMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${fetchIncidentsMutation.isPending ? "animate-spin" : ""}`} />
            Hent siste hendelser
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingIncidents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ingen ventende hendelser. Klikk «Hent siste hendelser» for å sjekke.
            </p>
          ) : (
            pendingIncidents.map((item: any) => {
              const severity = getSeverityFromFileName(item.file_name);
              const sevConfig = severity ? SEVERITY_CONFIG[severity] : null;
              return (
                <div key={item.id} className="p-3 rounded-lg border border-orange-500/20 bg-orange-500/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{item.subject}</p>
                        {sevConfig && (
                          <Badge className={`text-[10px] ${sevConfig.className}`}>{sevConfig.label}</Badge>
                        )}
                      </div>
                      {item.file_path && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.file_path}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {item.file_name?.replace(".json", "")} · {new Date(item.received_at).toLocaleDateString("nb-NO")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-orange-600 hover:bg-orange-700"
                        onClick={() => approveIncidentMutation.mutate(item)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Opprett avvik
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => rejectMutation.mutate(item.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Incident Procedures */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t("trustProfile.incidentProcedures")}</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t("common.add")}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("trustProfile.procedure")}</TableHead>
                <TableHead>{t("trustProfile.riskLevel")}</TableHead>
                <TableHead>{t("trustProfile.timeHours")}</TableHead>
                <TableHead>{t("trustProfile.responsible")}</TableHead>
                <TableHead>{t("trustProfile.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">{t("trustProfile.dataBreachProcedure")}</TableCell>
                <TableCell><Badge variant="destructive">{t("trustProfile.riskHigh")}</Badge></TableCell>
                <TableCell>72</TableCell>
                <TableCell>DPO</TableCell>
                <TableCell><Badge variant="outline">{t("trustProfile.approved")}</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">{t("trustProfile.systemOutageProcedure")}</TableCell>
                <TableCell><Badge className="bg-yellow-500 hover:bg-yellow-600">{t("trustProfile.riskMedium")}</Badge></TableCell>
                <TableCell>24</TableCell>
                <TableCell>IT</TableCell>
                <TableCell><Badge variant="outline">{t("trustProfile.approved")}</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reported Incidents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t("trustProfile.reportedIncidents")}</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t("trustProfile.reportIncident")}
          </Button>
        </CardHeader>
        <CardContent>
          {incidents && incidents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("trustProfile.incident")}</TableHead>
                  <TableHead>Kilde</TableHead>
                  <TableHead>{t("trustProfile.riskLevel")}</TableHead>
                  <TableHead>{t("trustProfile.responsible")}</TableHead>
                  <TableHead>{t("trustProfile.lastUpdated")}</TableHead>
                  <TableHead>{t("trustProfile.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident: any) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{incident.title}</p>
                        {incident.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {incident.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {incident.source === "7security" ? (
                        <Badge className="bg-orange-500/15 text-orange-700 border-orange-500/30 text-[10px]">
                          7 Security
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Manuell</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getRiskLevelBadge(incident.risk_level)}</TableCell>
                    <TableCell>{incident.responsible || "-"}</TableCell>
                    <TableCell>{formatDate(incident.last_updated)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(incident.status)}
                        <span className="text-sm capitalize">{incident.status}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">{t("trustProfile.noIncidents")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
