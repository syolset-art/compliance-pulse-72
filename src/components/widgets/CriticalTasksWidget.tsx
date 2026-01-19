import { AlertTriangle, ArrowRight, Shield, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TaskCategory {
  label: string;
  count: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  navigateTo: string;
}

export function CriticalTasksWidget() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Fetch open security incidents
  const { data: openIncidents = 0 } = useQuery({
    queryKey: ['critical-open-incidents'],
    queryFn: async () => {
      const { count } = await supabase
        .from('system_incidents')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("resolved","closed")');
      return count || 0;
    }
  });

  // Fetch systems requiring review (next_review_date has passed)
  const { data: reviewsOverdue = 0 } = useQuery({
    queryKey: ['critical-reviews-overdue'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('systems')
        .select('*', { count: 'exact', head: true })
        .lt('next_review_date', today)
        .not('next_review_date', 'is', null);
      return count || 0;
    }
  });

  // Fetch risk assessments pending approval
  const { data: pendingApprovals = 0 } = useQuery({
    queryKey: ['critical-pending-approvals'],
    queryFn: async () => {
      const { count } = await supabase
        .from('system_risk_assessments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      return count || 0;
    }
  });

  const categories: TaskCategory[] = [
    { 
      label: t("widgets.openIncidents", "åpne sikkerhetshendelser"), 
      count: openIncidents, 
      color: "text-destructive", 
      bgColor: "hsl(var(--destructive))",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      navigateTo: "/tasks?filter=open_incidents"
    },
    { 
      label: t("widgets.reviewsOverdue", "systemer krever revisjon"), 
      count: reviewsOverdue, 
      color: "text-warning", 
      bgColor: "hsl(var(--warning))",
      icon: <Clock className="h-3.5 w-3.5" />,
      navigateTo: "/tasks?filter=overdue_reviews"
    },
    { 
      label: t("widgets.pendingApprovals", "risikovurderinger venter godkjenning"), 
      count: pendingApprovals, 
      color: "text-yellow-500", 
      bgColor: "hsl(48, 96%, 53%)",
      icon: <Shield className="h-3.5 w-3.5" />,
      navigateTo: "/tasks?filter=pending_approvals"
    },
  ];
  
  const totalTasks = categories.reduce((sum, cat) => sum + cat.count, 0);
  
  // Calculate donut chart segments - larger size
  const radius = 54;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const svgSize = 140;
  
  let currentOffset = 0;
  const segments = categories.map((cat) => {
    const percentage = cat.count / totalTasks;
    const dashArray = circumference * percentage;
    const segment = {
      ...cat,
      dashArray,
      dashOffset: -currentOffset,
    };
    currentOffset += dashArray;
    return segment;
  });

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <CardTitle className="text-lg font-semibold text-foreground">
              {t("widgets.requiresAction", "Krever handling")}
            </CardTitle>
          </div>
          <span className="text-sm text-muted-foreground">
            {totalTasks} {t("widgets.items", "elementer")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          {/* Donut Chart - Larger */}
          <div className="relative flex-shrink-0">
            <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
              />
              {/* Colored segments */}
              {segments.map((segment, index) => (
                <circle
                  key={index}
                  cx={svgSize / 2}
                  cy={svgSize / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.bgColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${segment.dashArray} ${circumference}`}
                  strokeDashoffset={segment.dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                  style={{
                    animation: `donutFill 0.8s ease-out ${index * 0.15}s forwards`,
                  }}
                />
              ))}
            </svg>
            {/* Center number */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{totalTasks}</span>
              <span className="text-xs text-muted-foreground">oppgaver</span>
            </div>
          </div>
          
          {/* Categories List - Improved styling */}
          <div className="flex-1 space-y-2">
            {categories.map((cat, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer"
                onClick={() => navigate(cat.navigateTo)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${cat.bgColor}20` }}
                  >
                    <span style={{ color: cat.bgColor }}>{cat.icon}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground capitalize">
                      {cat.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-lg font-bold"
                    style={{ color: cat.bgColor }}
                  >
                    {cat.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Action button */}
        <Button 
          variant="ghost" 
          className="w-full text-primary hover:text-primary/80 hover:bg-primary/10"
          onClick={() => navigate("/tasks")}
        >
          {t("widgets.takeAction", "Ta tak i det")}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
      
      <style>{`
        @keyframes donutFill {
          from {
            stroke-dasharray: 0 ${circumference};
          }
        }
      `}</style>
    </Card>
  );
}
