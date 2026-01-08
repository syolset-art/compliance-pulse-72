import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RiskLevel {
  name: string;
  color: string;
  previous: number;
  current: number;
  change: number;
  max: number;
}

const riskLevels: RiskLevel[] = [
  { name: "Kritisk", color: "bg-destructive", previous: 5, current: 3, change: -2, max: 20 },
  { name: "Høy", color: "bg-warning", previous: 7, current: 5, change: -2, max: 20 },
  { name: "Medium", color: "bg-yellow-500", previous: 11, current: 13, change: 2, max: 20 },
];

export function InherentRiskWidget() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-foreground">
              Iboende risiko
            </CardTitle>
            <button className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground">vs. forrige måned</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {riskLevels.map((level) => (
            <div key={level.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{level.name}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{level.previous}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold text-foreground">{level.current}</span>
                  <span className={level.change < 0 ? "text-success" : "text-destructive"}>
                    {level.change < 0 ? "" : "↗"}{level.change < 0 ? "↘" : ""}{Math.abs(level.change)}
                  </span>
                </div>
              </div>
              <Progress
                value={(level.current / level.max) * 100}
                className={`h-2 [&>div]:${level.color}`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
