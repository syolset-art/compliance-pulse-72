import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  ArrowRight,
  ShieldX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";

interface AttentionItem {
  id: string;
  title: string;
  subtitle: string;
  severity: "critical" | "high" | "medium";
  route: string;
  type: "incident" | "risk" | "control";
}

export function ImmediateAttentionWidget() {
  const navigate = useNavigate();
  const { grouped } = useComplianceRequirements({});

  const { data: openIncidents = [] } = useQuery({
    queryKey: ["attention-incidents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_incidents")
        .select("id, title, criticality, risk_level")
        .not("status", "in", '("resolved","closed")')
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const items: AttentionItem[] = [
    ...openIncidents.map((inc) => ({
      id: `inc-${inc.id}`,
      title: inc.title,
      subtitle: "Open incident",
      severity: (inc.criticality === "critical" ? "critical" : inc.criticality === "high" ? "high" : "medium") as AttentionItem["severity"],
      route: "/tasks?filter=open_incidents",
      type: "incident" as const,
    })),
    ...grouped.incompleteManual
      .filter((r) => r.priority === "critical")
      .slice(0, 3)
      .map((r) => ({
        id: `ctrl-${r.requirement_id}`,
        title: r.name,
        subtitle: "Missing security control",
        severity: "critical" as const,
        route: "/compliance-checklist",
        type: "control" as const,
      })),
  ].slice(0, 3);

  const severityConfig = {
    critical: { bg: "bg-destructive/10 border-destructive/20", text: "text-destructive", label: "Critical" },
    high: { bg: "bg-warning/10 border-warning/20", text: "text-warning dark:text-warning", label: "High" },
    medium: { bg: "bg-warning/10 border-warning/20", text: "text-warning dark:text-warning", label: "Medium" },
  };

  const typeIcon = {
    incident: AlertTriangle,
    risk: ShieldAlert,
    control: ShieldX,
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Immediate attention
          </CardTitle>
          {items.length > 0 && (
            <Badge variant="destructive" className="text-[13px] h-5">
              {items.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 px-4 pb-3 pt-0">
        {items.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <ShieldAlert className="h-6 w-6 mx-auto mb-1 opacity-40" />
            <p className="text-xs font-medium">No critical issues</p>
          </div>
        ) : (
          items.map((item) => {
            const Icon = typeIcon[item.type];
            const config = severityConfig[item.severity];
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg border border-border hover:border-destructive/30 hover:bg-destructive/5 transition-all text-left group"
              >
                <div className={cn("p-1.5 rounded-md border", config.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", config.text)} />
                </div>
                <p className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">{item.title}</p>
                <Badge variant="outline" className={cn("text-[13px] shrink-0 border h-4", config.bg, config.text)}>
                  {config.label}
                </Badge>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
