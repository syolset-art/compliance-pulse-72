import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  FileWarning,
  ShieldCheck,
  FileText,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function VendorRequestsWidget() {
  const navigate = useNavigate();

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["vendor-requests-widget"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_document_requests")
        .select("id, document_type, status, asset_id")
        .eq("status", "pending")
        .limit(10);
      return data || [];
    },
  });

  // Demo items for rich display
  const items = [
    {
      id: "vr-1",
      icon: ShieldCheck,
      title: "2 vendors asked to update security documentation",
      color: "text-warning dark:text-warning",
      bg: "bg-warning/10",
    },
    {
      id: "vr-2",
      icon: FileWarning,
      title: "1 certificate expired",
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      id: "vr-3",
      icon: FileText,
      title: "1 data processing agreement pending",
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  const awaitingCount = Math.max(pendingRequests.length, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Vendor requests
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Open requests
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate("/assets")}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-left group"
            >
              <div className={cn("p-2 rounded-lg", item.bg)}>
                <Icon className={cn("h-4 w-4", item.color)} />
              </div>
              <p className="text-sm text-foreground flex-1">{item.title}</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Awaiting response: <span className="font-semibold text-foreground">{awaitingCount}</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 p-0 h-auto"
            onClick={() => navigate("/customer-requests")}
          >
            View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
