import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Cpu, ShieldCheck, AlertTriangle, FileSearch } from "lucide-react";

const DEMO_STATS = [
  { icon: Cpu, label: "Systems analyzed", value: 28, color: "text-primary" },
  { icon: FileSearch, label: "Baseline attributes collected", value: 96, color: "text-emerald-600 dark:text-emerald-400" },
  { icon: AlertTriangle, label: "Potential risk indicators detected", value: 3, color: "text-amber-600 dark:text-amber-400" },
  { icon: ShieldCheck, label: "Compliance gaps identified", value: 6, color: "text-destructive" },
];

export function AIActivityWidget() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            AI activity (Lara)
          </CardTitle>
          <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Active
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Since your last login</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {DEMO_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border"
              >
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${stat.color}`} />
                <div>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
