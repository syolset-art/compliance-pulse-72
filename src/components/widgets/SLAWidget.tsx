import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";

type Period = "month" | "quarter" | "halfyear";

interface SLAItem {
  title: string;
  percentage: number;
  current: number;
  total: number;
  trend: number;
}

const slaData: SLAItem[] = [
  { title: "Systemer og prosesser", percentage: 68, current: 30, total: 44, trend: 23 },
  { title: "Organisasjon og styring", percentage: 37, current: 41, total: 112, trend: -15 },
  { title: "Roller og tilgang", percentage: 81, current: 97, total: 120, trend: -5 },
];

export function SLAWidget() {
  const [period, setPeriod] = useState<Period>("quarter");
  
  const periods: { value: Period; label: string }[] = [
    { value: "month", label: "Siste måned" },
    { value: "quarter", label: "Siste kvartal" },
    { value: "halfyear", label: "Siste halvår" },
  ];
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
            SLA-oppnåelse
          </CardTitle>
          <div className="flex gap-1 p-1 bg-muted rounded-lg overflow-x-auto">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  period === p.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {slaData.map((item) => (
            <Card key={item.title} className="bg-muted/30 border-border">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">{item.title}</p>
                <div className="flex flex-wrap items-baseline gap-1 sm:gap-2 mb-2">
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">
                    {item.percentage}%
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {item.current} av {item.total} i tide
                  </span>
                </div>
                <Progress 
                  value={item.percentage} 
                  className="h-1.5 mb-3"
                />
                <div className={`flex items-center gap-1 text-sm ${
                  item.trend > 0 ? "text-success" : "text-destructive"
                }`}>
                  {item.trend > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span>{item.trend > 0 ? "+" : ""}{item.trend}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
