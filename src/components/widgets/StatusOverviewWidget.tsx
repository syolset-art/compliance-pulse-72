import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusItem {
  name: string;
  status: "bra" | "ok" | "lav";
  dots: number;
}

const statusItems: StatusItem[] = [
  { name: "Personvern", status: "bra", dots: 4 },
  { name: "IT-sikkerhet", status: "ok", dots: 3 },
  { name: "Cybersikkerhet", status: "bra", dots: 4 },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "bra": return "text-success";
    case "ok": return "text-warning";
    case "lav": return "text-destructive";
    default: return "text-muted-foreground";
  }
};

const getDotColor = (status: string, index: number, totalDots: number) => {
  if (index < totalDots) {
    switch (status) {
      case "bra": return "bg-success";
      case "ok": return "bg-warning";
      case "lav": return "bg-destructive";
      default: return "bg-muted";
    }
  }
  return "bg-muted";
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "bra": return "Bra";
    case "ok": return "OK";
    case "lav": return "Lav";
    default: return "";
  }
};

export function StatusOverviewWidget() {
  const totalScore = 75;
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Hvordan ligger vi an?
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statusItems.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{item.name}</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-2.5 w-2.5 rounded-full ${getDotColor(item.status, i, item.dots)}`}
                    />
                  ))}
                </div>
                <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                  {getStatusLabel(item.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Totalt: <span className="text-foreground font-semibold">{totalScore}% på plass</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
