import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ControlItem {
  name: string;
  previous: number;
  current: number;
  change: number;
  color: string;
}

const controlData: ControlItem[] = [
  { name: "Tildelt", previous: 40, current: 42, change: 2, color: "bg-success" },
  { name: "Ikke tildelt", previous: 6, current: 4, change: -2, color: "bg-muted-foreground" },
];

export function ControlsWidget() {
  const total = controlData.reduce((acc, item) => acc + item.current, 0);
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-foreground">
              Tildelte kontroller
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
          {controlData.map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{item.name}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{item.previous}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold text-foreground">{item.current}</span>
                  <span className={item.change > 0 ? "text-success" : "text-destructive"}>
                    {item.change > 0 ? "↗+" : "↘"}{Math.abs(item.change)}
                  </span>
                </div>
              </div>
              <Progress
                value={(item.current / total) * 100}
                className={`h-2 [&>div]:${item.color}`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
