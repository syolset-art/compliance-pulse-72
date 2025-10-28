import { Card } from "@/components/ui/card";
import { Globe, AlertTriangle } from "lucide-react";

export function DataTransferWidget() {
  const transfers = [
    { region: "EU/EØS", count: 18, risk: "low" },
    { region: "USA (SCC)", count: 4, risk: "medium" },
    { region: "Tredjeland (SCC)", count: 2, risk: "medium" },
    { region: "Uten SCC-avtale", count: 1, risk: "high" },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Dataoverføringer</h3>
          <p className="text-sm text-muted-foreground">Geografisk fordeling</p>
        </div>
      </div>

      <div className="space-y-3">
        {transfers.map((transfer) => {
          const getRiskColor = (risk: string) => {
            switch (risk) {
              case "high": return "text-destructive";
              case "medium": return "text-warning";
              default: return "text-success";
            }
          };

          const getRiskBg = (risk: string) => {
            switch (risk) {
              case "high": return "bg-destructive/5";
              case "medium": return "bg-warning/5";
              default: return "bg-success/5";
            }
          };

          return (
            <div 
              key={transfer.region} 
              className={`flex items-center justify-between p-3 rounded-lg ${getRiskBg(transfer.risk)}`}
            >
              <div className="flex items-center gap-2">
                {transfer.risk === "high" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                <span className="text-sm font-medium text-foreground">{transfer.region}</span>
              </div>
              <span className={`text-sm font-semibold ${getRiskColor(transfer.risk)}`}>
                {transfer.count}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
        <p className="text-xs text-muted-foreground">
          1 system krever oppfølging for lovlig overføring
        </p>
      </div>
    </Card>
  );
}
