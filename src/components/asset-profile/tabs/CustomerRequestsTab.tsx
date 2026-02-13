import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileQuestion, Send, Clock, CheckCircle2, Building2 } from "lucide-react";

const DEMO_REQUESTS = [
  {
    id: "demo-1",
    customer_name: "Allier AS",
    title: "Norsk leverandørvurdering",
    request_type: "vendor_assessment",
    status: "completed",
    progress_percent: 100,
    due_date: "2025-03-01",
  },
  {
    id: "demo-2",
    customer_name: "TechCorp AS",
    title: "ISO 27001 dokumentasjon",
    request_type: "certification",
    status: "in_progress",
    progress_percent: 60,
    due_date: "2025-04-15",
  },
  {
    id: "demo-3",
    customer_name: "Nordic Solutions",
    title: "DPA forespørsel",
    request_type: "dpa",
    status: "pending",
    progress_percent: 30,
    due_date: "2025-05-01",
  },
];

function getStatusBadge(status: string, isNb: boolean) {
  switch (status) {
    case "completed":
      return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]">{isNb ? "Sendt" : "Sent"}</Badge>;
    case "in_progress":
      return <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30 text-[10px]">{isNb ? "Under arbeid" : "In Progress"}</Badge>;
    default:
      return <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px]">{isNb ? "Avventer" : "Pending"}</Badge>;
  }
}

export function CustomerRequestsTab() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const { data: dbRequests = [] } = useQuery({
    queryKey: ["customer-requests-self"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_compliance_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const requests = dbRequests.length > 0 ? dbRequests : DEMO_REQUESTS;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-primary" />
            {isNb ? "Innkommende forespørsler" : "Incoming Requests"}
            <Badge variant="secondary" className="text-[10px]">{requests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileQuestion className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{isNb ? "Ingen forespørsler ennå" : "No requests yet"}</p>
            </div>
          ) : (
            requests.map((req: any) => (
              <div key={req.id} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileQuestion className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">{req.title}</span>
                      {getStatusBadge(req.status, isNb)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {req.customer_name}
                      {req.due_date && (
                        <>
                          <span className="mx-1">·</span>
                          <Clock className="h-3 w-3" />
                          {new Date(req.due_date).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
                        </>
                      )}
                    </div>
                  </div>
                  {req.status !== "completed" && (
                    <Button size="sm" className="h-7 text-xs gap-1 shrink-0">
                      <Send className="h-3 w-3" />
                      {isNb ? "Del ferdig" : "Share"}
                    </Button>
                  )}
                  {req.status === "completed" && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{isNb ? "Fremdrift" : "Progress"}</span>
                    <span>{req.progress_percent}%</span>
                  </div>
                  <Progress value={req.progress_percent} className="h-1.5" />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
