import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronRight } from "lucide-react";

export function ROPAGapWidget() {
  const total = 50;
  const withROPA = 38;
  const missing = total - withROPA;
  const percentage = Math.round((withROPA / total) * 100);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
          <AlertCircle className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">ROPA-dekning</h3>
          <p className="text-sm text-muted-foreground">Behandlingsprotokoller</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Systemer med ROPA</span>
          <span className="text-sm font-medium text-foreground">{withROPA} av {total}</span>
        </div>

        <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-success transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-2xl font-bold text-foreground">{percentage}%</p>
            <p className="text-xs text-muted-foreground">Fullført</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            {missing} mangler
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
