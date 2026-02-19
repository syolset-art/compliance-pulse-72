import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, AlertTriangle, ShieldAlert, UserX, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function SystemsInUseWidget() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isNb = i18n.language === "nb";

  const { data: assets = [] } = useQuery({
    queryKey: ["assets-dashboard-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, risk_level, criticality, asset_owner, asset_type")
        .eq("lifecycle_status", "active");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const total = assets.length;
  const critical = assets.filter((a) => a.criticality === "critical").length;
  const highRisk = assets.filter((a) => a.risk_level === "high" || a.risk_level === "critical").length;
  const missingOwner = assets.filter((a) => !a.asset_owner).length;

  const stats = [
    {
      label: isNb ? "Kritisk" : "Critical",
      count: critical,
      icon: ShieldAlert,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: isNb ? "Høy risiko" : "High risk",
      count: highRisk,
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: isNb ? "Mangler eier" : "Missing owner",
      count: missingOwner,
      icon: UserX,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {isNb ? "Systemoversikt" : "System Overview"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isNb ? "Aktive systemer og status" : "Active systems and status"}
            </p>
          </div>
        </div>
        <span className="text-3xl font-bold text-foreground">{total}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-lg p-3 ${stat.bgColor} flex flex-col items-center gap-1.5`}
          >
            <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
            <span className="text-xl font-bold text-foreground">{stat.count}</span>
            <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {(critical > 0 || highRisk > 0 || missingOwner > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {critical > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {critical} {isNb ? "kritiske systemer" : "critical systems"}
            </Badge>
          )}
          {missingOwner > 0 && (
            <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600 dark:text-orange-400">
              {missingOwner} {isNb ? "uten eier" : "without owner"}
            </Badge>
          )}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs"
        onClick={() => navigate("/assets")}
      >
        {isNb ? "Se alle systemer" : "View all systems"}
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </Card>
  );
}
