import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, AlertTriangle, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface IncidentManagementTabProps {
  assetId: string;
}

export const IncidentManagementTab = ({ assetId }: IncidentManagementTabProps) => {
  const { t, i18n } = useTranslation();

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
                  <TableHead>{t("trustProfile.riskLevel")}</TableHead>
                  <TableHead>{t("trustProfile.responsible")}</TableHead>
                  <TableHead>{t("trustProfile.lastUpdated")}</TableHead>
                  <TableHead>{t("trustProfile.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
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
