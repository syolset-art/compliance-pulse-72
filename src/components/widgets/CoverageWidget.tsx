import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Layers, Monitor, Share2, Workflow } from "lucide-react";

const COVERAGE_ITEMS = [
  { label: "Processes mapped", count: 5, icon: Workflow },
  { label: "Systems mapped", count: 12, icon: Monitor },
  { label: "Vendors mapped", count: 4, icon: Share2 },
];

const COVERAGE_PERCENT = 18;

export function CoverageWidget() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Coverage</h3>
        </div>

        <div className="space-y-3 mb-4">
          {COVERAGE_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 flex-shrink-0">
                <item.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm text-foreground flex-1">{item.label}</span>
              <span className="text-sm font-semibold text-foreground">{item.count}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Overall coverage
            </p>
            <span className="text-sm font-bold text-foreground">{COVERAGE_PERCENT}%</span>
          </div>
          <Progress value={COVERAGE_PERCENT} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}
