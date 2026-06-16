import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Inbox, ChevronRight, AlertCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function TrustCustomerRequestsWidget() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const navigate = useNavigate();

  const { data: requests = [] } = useQuery({
    queryKey: ["trust-dashboard-customer-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_compliance_requests" as any)
        .select("id,customer_name,title,request_type,status,due_date,created_at")
        .not("status", "in", "(archived,responded)")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5);
      return (data as any[]) || [];
    },
  });

  const isOverdue = (r: any) => r.due_date && new Date(r.due_date) < new Date();
  const isSoon = (r: any) => {
    if (!r.due_date) return false;
    const diff = new Date(r.due_date).getTime() - Date.now();
    return diff > 0 && diff < 14 * 24 * 60 * 60 * 1000;
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {isNb ? "Meldinger fra kunder" : "Customer messages"}
          </h3>
          {requests.length > 0 && (
            <Badge variant="secondary" className="text-xs">{requests.length}</Badge>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={() => navigate("/customer-requests")}>
          {isNb ? "Se alle" : "View all"} <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          {isNb ? "Ingen åpne forespørsler" : "No open requests"}
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((r: any) => (
            <button
              key={r.id}
              onClick={() => navigate("/customer-requests")}
              className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate">
                    {r.title || (isNb ? "Forespørsel" : "Request")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.customer_name}</div>
                </div>
                {r.due_date && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs flex-shrink-0",
                    isOverdue(r) ? "text-destructive" : isSoon(r) ? "text-warning" : "text-muted-foreground"
                  )}>
                    {isOverdue(r) ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {new Date(r.due_date).toLocaleDateString(isNb ? "nb-NO" : "en-US", { day: "numeric", month: "short" })}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
