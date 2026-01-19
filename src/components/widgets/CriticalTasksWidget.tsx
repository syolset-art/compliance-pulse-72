import { AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface TaskCategory {
  label: string;
  count: number;
  color: string;
  bgColor: string;
}

export function CriticalTasksWidget() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // TODO: Replace with real data from database
  const categories: TaskCategory[] = [
    { label: t("widgets.openIncidents", "åpne hendelser"), count: 2, color: "text-destructive", bgColor: "hsl(var(--destructive))" },
    { label: t("widgets.reviewsOverdue", "gjennomganger forfalt"), count: 3, color: "text-warning", bgColor: "hsl(var(--warning))" },
    { label: t("widgets.missingPlan", "system mangler plan"), count: 1, color: "text-yellow-500", bgColor: "hsl(48, 96%, 53%)" },
  ];
  
  const totalTasks = categories.reduce((sum, cat) => sum + cat.count, 0);
  
  // Calculate donut chart segments
  const radius = 36;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  
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
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("widgets.requiresAction", "Krever handling")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          {/* Donut Chart */}
          <div className="relative flex-shrink-0">
            <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
              />
              {/* Colored segments */}
              {segments.map((segment, index) => (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
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
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{totalTasks}</span>
            </div>
          </div>
          
          {/* Summary */}
          <div className="flex-1 space-y-1">
            <p className="text-lg font-semibold text-foreground mb-3">
              {totalTasks} {t("widgets.thingsWaiting", "ting venter på deg")}
            </p>
            <div className="space-y-2">
              {categories.map((cat, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span 
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: cat.bgColor }}
                  />
                  <span className={cat.color}>
                    {cat.count} {cat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Action button */}
        <Button 
          variant="ghost" 
          className="w-full mt-4 text-primary hover:text-primary/80 hover:bg-primary/10"
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
