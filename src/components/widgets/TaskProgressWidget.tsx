import { useState } from "react";
import { HelpCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ViewType = "tasks" | "projects";

export function TaskProgressWidget() {
  const [view, setView] = useState<ViewType>("tasks");
  
  const taskData = {
    completed: 207,
    total: 432,
    completionRate: 48,
    remaining: 225,
    distribution: {
      done: 48,
      inProgress: 32,
      notStarted: 20,
    }
  };
  
  const projectData = {
    completed: 12,
    total: 24,
    completionRate: 50,
    remaining: 12,
    distribution: {
      done: 50,
      inProgress: 25,
      notStarted: 25,
    }
  };
  
  const data = view === "tasks" ? taskData : projectData;
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Oppgavefremdrift
            </CardTitle>
            <button className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <CheckCircle className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setView("tasks")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              view === "tasks"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-xs">≡</span> Oppgaver
          </button>
          <button
            onClick={() => setView("projects")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              view === "projects"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-xs">📁</span> Prosjekter
          </button>
        </div>
        
        {/* Main Stats */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-foreground">{data.completed}</span>
            <span className="text-xl text-muted-foreground">/ {data.total}</span>
          </div>
          <Progress value={(data.completed / data.total) * 100} className="h-2" />
        </div>
        
        {/* Completion Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Fullføringsgrad</p>
            <p className="text-xl font-semibold text-success">{data.completionRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Gjenstår</p>
            <p className="text-xl font-semibold text-foreground">{data.remaining}</p>
          </div>
        </div>
        
        {/* Donut Chart */}
        <div className="flex justify-center">
          <div className="relative h-28 w-28">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 36 36">
              {/* Not Started */}
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="4"
              />
              {/* In Progress */}
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="hsl(var(--warning))"
                strokeWidth="4"
                strokeDasharray={`${(data.distribution.done + data.distribution.inProgress) * 0.88} 100`}
              />
              {/* Done */}
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="hsl(var(--success))"
                strokeWidth="4"
                strokeDasharray={`${data.distribution.done * 0.88} 100`}
              />
            </svg>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success" />
            Gjennomført
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-warning" />
            Pågående
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
            Ikke startet
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
