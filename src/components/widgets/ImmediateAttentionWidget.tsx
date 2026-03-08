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
  ].slice(0, 5);

  const severityConfig = {
    critical: { bg: "bg-destructive/10 border-destructive/20", text: "text-destructive", label: "Critical" },
    high: { bg: "bg-orange-500/10 border-orange-500/20", text: "text-orange-600 dark:text-orange-400", label: "High" },
    medium: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-600 dark:text-amber-400", label: "Medium" },
  };

  const typeIcon = {
    incident: AlertTriangle,
    risk: ShieldAlert,
    control: ShieldX,
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Immediate attention required
          </CardTitle>
          {items.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {items.length} {items.length === 1 ? "issue" : "issues"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No critical issues</p>
            <p className="text-xs mt-1">Everything is under control</p>
          </div>
        ) : (
          <>
            {items.map((item) => {
              const Icon = typeIcon[item.type];
              const config = severityConfig[item.severity];
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.route)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-destructive/30 hover:bg-destructive/5 transition-all text-left group"
                >
                  <div className={cn("p-2 rounded-lg border", config.bg)}>
                    <Icon className={cn("h-4 w-4", config.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0 border", config.bg, config.text)}>
                    {config.label}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground mt-1"
              onClick={() => navigate("/tasks")}
            >
              View all issues <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
