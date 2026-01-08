import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function SystemLibraryWidget() {
  const totalSystems = 44;
  const withIssues = 43;
  const complete = 1;
  const euOnly = 30;
  const outsideEU = 14;
  const riskAssessmentsDone = 18;
  
  // Calculate percentages for donut chart
  const euPercentage = (euOnly / totalSystems) * 100;
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            Systembibliotek
          </CardTitle>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {totalSystems} systemer
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{totalSystems}</p>
            <p className="text-xs text-muted-foreground">Totalt</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-2xl font-bold text-warning">{withIssues}</p>
            <p className="text-xs text-muted-foreground">Med mangler</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-2xl font-bold text-success">{complete}</p>
            <p className="text-xs text-muted-foreground">Komplett</p>
          </div>
        </div>
        
        {/* Data Transfer Section */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Dataoverføring utenfor EU/EØS</p>
          <div className="flex items-center gap-6">
            {/* Donut Chart */}
            <div className="relative h-20 w-20">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="hsl(var(--warning))"
                  strokeWidth="4"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="hsl(var(--success))"
                  strokeWidth="4"
                  strokeDasharray={`${euPercentage * 0.88} 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-foreground">{totalSystems}</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-8">
                <span className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-success" />
                  Kun EU/EØS
                </span>
                <span className="font-semibold text-foreground">{euOnly}</span>
              </div>
              <div className="flex items-center justify-between gap-8">
                <span className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                  Utenfor EU/EØS
                </span>
                <span className="font-semibold text-foreground">{outsideEU}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Risk Assessment Status */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Risikovurderingsstatus</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground">Gjennomført</span>
            <span className="text-sm font-medium text-foreground">
              {riskAssessmentsDone} av {totalSystems}
            </span>
          </div>
          <Progress value={(riskAssessmentsDone / totalSystems) * 100} className="h-2" />
        </div>
        
        {/* View All Link */}
        <button className="flex items-center justify-between w-full pt-3 border-t border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
          Se alle systemer
          <ChevronRight className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
