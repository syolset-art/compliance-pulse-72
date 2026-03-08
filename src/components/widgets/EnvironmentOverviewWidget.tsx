import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Building2,
  Workflow,
  LayoutGrid,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function EnvironmentOverviewWidget() {
  const navigate = useNavigate();

  const { data: systemsCount = 0 } = useQuery({
    queryKey: ["env-systems"],
    queryFn: async () => {
      const { count } = await supabase.from("systems").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: vendorsCount = 0 } = useQuery({
    queryKey: ["env-vendors"],
    queryFn: async () => {
      const { count } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .in("asset_type", ["vendor", "sub_processor", "cloud_service"]);
      return count || 0;
    },
  });

  const { data: workAreasCount = 0 } = useQuery({
    queryKey: ["env-work-areas"],
    queryFn: async () => {
      const { count } = await supabase.from("work_areas").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: systemsWithRisk = 0 } = useQuery({
    queryKey: ["env-risk-systems"],
    queryFn: async () => {
      const { count } = await supabase
        .from("systems")
        .select("*", { count: "exact", head: true })
        .in("risk_level", ["high", "critical"]);
      return count || 0;
    },
  });

  const cards = [
    {
      key: "systems",
      icon: Server,
      title: "Systems",
      count: systemsCount,
      alert: systemsWithRisk > 0 ? `${systemsWithRisk} high risk` : undefined,
      route: "/systems",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      key: "vendors",
      icon: Building2,
      title: "Vendors",
      count: vendorsCount,
      route: "/assets",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      key: "processes",
      icon: Workflow,
      title: "Processes",
      count: "—",
      route: "/processing-records",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      key: "work-areas",
      icon: LayoutGrid,
      title: "Work areas",
      count: workAreasCount,
      route: "/work-areas",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" />
          Your environment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.key}
                onClick={() => navigate(card.route)}
                className="text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all group"
              >
                <div className={cn("p-2 rounded-lg w-fit mb-2", card.bg)}>
                  <Icon className={cn("h-4 w-4", card.color)} />
                </div>
                <p className="text-2xl font-bold text-foreground">{card.count}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
                {card.alert && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">{card.alert}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
