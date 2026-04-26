import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Server,
  Building2,
  Workflow,
  LayoutGrid,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

function MiniDonut({ value, max, color, size = 44 }: { value: number; max: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const dash = pct * circumference;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={4} />
      {value > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          className="transition-all duration-700"
          style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
        />
      )}
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="fill-foreground text-xs font-bold">
        {value}
      </text>
    </svg>
  );
}

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

  const totalMax = Math.max(systemsCount, vendorsCount, workAreasCount, 1);

  const cards = [
    {
      key: "systems",
      icon: Server,
      title: "Systems",
      count: systemsCount,
      alert: systemsWithRisk > 0 ? `${systemsWithRisk} high risk` : undefined,
      route: "/systems",
      ringColor: "hsl(160, 84%, 39%)",
      color: "text-status-closed dark:text-status-closed",
      bg: "bg-status-closed/10",
    },
    {
      key: "vendors",
      icon: Building2,
      title: "Vendors",
      count: vendorsCount,
      route: "/assets",
      ringColor: "hsl(217, 91%, 60%)",
      color: "text-primary dark:text-primary",
      bg: "bg-primary/10",
    },
    {
      key: "processes",
      icon: Workflow,
      title: "Processes",
      count: 0,
      displayCount: "—",
      route: "/processing-records",
      ringColor: "hsl(271, 91%, 65%)",
      color: "text-accent dark:text-accent",
      bg: "bg-accent/10",
    },
    {
      key: "work-areas",
      icon: LayoutGrid,
      title: "Work areas",
      count: workAreasCount,
      route: "/work-areas",
      ringColor: "hsl(38, 92%, 50%)",
      color: "text-warning dark:text-warning",
      bg: "bg-warning/10",
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
                className="flex flex-col items-center text-center p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all group gap-2"
              >
                <MiniDonut
                  value={card.count}
                  max={totalMax}
                  color={card.ringColor}
                />
                <div>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  {card.alert && (
                    <div className="flex items-center gap-1 mt-0.5 justify-center">
                      <AlertTriangle className="h-3 w-3 text-warning" />
                      <span className="text-[13px] text-warning dark:text-warning">{card.alert}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
