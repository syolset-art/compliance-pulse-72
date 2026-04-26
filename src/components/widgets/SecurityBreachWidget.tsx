import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ExternalLink, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";

interface SecurityIncident {
  id: string;
  subject: string;
  sender_name: string;
  file_path: string | null; // description stored here
  status: string;
  received_at: string;
  confidence_score: number | null;
}

const severityFromTitle = (title: string): "critical" | "high" | "medium" => {
  const lower = title.toLowerCase();
  if (lower.includes("ransomware") || lower.includes("breach") || lower.includes("brudd")) return "critical";
  if (lower.includes("uautorisert") || lower.includes("backup") || lower.includes("unauthorized")) return "high";
  return "medium";
};

const severityConfig = {
  critical: { label_no: "Kritisk", label_en: "Critical", className: "bg-destructive/10 text-destructive border-destructive/20" },
  high: { label_no: "Høy", label_en: "High", className: "bg-warning/10 text-warning border-warning/20" },
  medium: { label_no: "Middels", label_en: "Medium", className: "bg-warning/10 text-warning border-warning/20" },
};

export function SecurityBreachWidget() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      const { data } = await supabase
        .from("lara_inbox")
        .select("id, subject, sender_name, file_path, status, received_at, confidence_score")
        .eq("matched_document_type", "incident")
        .order("received_at", { ascending: false })
        .limit(5);
      setIncidents((data as SecurityIncident[]) || []);
      setLoading(false);
    };
    fetchIncidents();

    // Realtime subscription for new incidents
    const channel = supabase
      .channel("security-incidents")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lara_inbox",
          filter: "matched_document_type=eq.incident",
        },
        () => {
          fetchIncidents();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const activeCount = incidents.filter(i => i.status === "new" || i.status === "auto_matched").length;

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            {isNb ? "Sikkerhetsbrudd" : "Security Breaches"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={activeCount > 0 ? "border-destructive/30 shadow-sm" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className={`h-5 w-5 ${activeCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            {isNb ? "Sikkerhetshendelser" : "Security Incidents"}
            {activeCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {activeCount} {isNb ? "aktive" : "active"}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => navigate("/lara-inbox")}
          >
            {isNb ? "Se alle" : "View all"} <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isNb
            ? "Live-feed fra tilkoblede sikkerhetstjenester"
            : "Live feed from connected security services"}
        </p>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <ShieldCheck className="h-10 w-10 text-status-closed mb-2" />
            <p className="text-sm font-medium text-foreground">
              {isNb ? "Ingen aktive sikkerhetshendelser" : "No active security incidents"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isNb
                ? "Hendelser fra tilkoblede integrasjoner vises her automatisk"
                : "Incidents from connected integrations appear here automatically"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {incidents.map((incident) => {
              const sev = severityFromTitle(incident.subject);
              const sevConf = severityConfig[sev];
              const isActive = incident.status === "new" || incident.status === "auto_matched";
              return (
                <div
                  key={incident.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                    isActive ? "bg-destructive/5 border-destructive/20" : "bg-card"
                  }`}
                >
                  <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    sev === "critical" ? "text-destructive" : sev === "high" ? "text-warning" : "text-warning"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">
                        {incident.subject}
                      </p>
                      <Badge variant="outline" className={`text-[13px] px-1.5 py-0 ${sevConf.className}`}>
                        {isNb ? sevConf.label_no : sevConf.label_en}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[13px] text-muted-foreground">
                        {incident.sender_name}
                      </span>
                      <span className="text-[13px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(incident.received_at), {
                          addSuffix: true,
                          locale: isNb ? nb : undefined,
                        })}
                      </span>
                      {isActive && (
                        <Badge variant="outline" className="text-[13px] px-1.5 py-0 border-destructive/30 text-destructive">
                          {isNb ? "Ubehandlet" : "Unprocessed"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
