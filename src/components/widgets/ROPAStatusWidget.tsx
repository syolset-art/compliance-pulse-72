import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

export function ROPAStatusWidget() {
  const percentage = 78;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Samlet samsvar</h3>
        <Info className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative">
          <svg width="180" height="180" className="transform -rotate-90">
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="hsl(var(--muted))"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="hsl(var(--success))"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-foreground">{percentage}%</span>
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground mt-4">Høy etterlevelse</p>
      </div>
    </Card>
  );
}
