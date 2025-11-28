import { Card } from "@/components/ui/card";
import { Globe, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DataTransferWidget() {
  const { t } = useTranslation();
  
  const transfers = [
    { regionKey: "euEea", count: 18, risk: "low" },
    { regionKey: "usaScc", count: 4, risk: "medium" },
    { regionKey: "thirdCountryScc", count: 2, risk: "medium" },
    { regionKey: "withoutScc", count: 1, risk: "high" },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{t("widgets.dataTransfer.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("widgets.dataTransfer.subtitle")}</p>
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
              key={transfer.regionKey} 
              className={`flex items-center justify-between p-3 rounded-lg ${getRiskBg(transfer.risk)}`}
            >
              <div className="flex items-center gap-2">
                {transfer.risk === "high" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                <span className="text-sm font-medium text-foreground">{t(`widgets.dataTransfer.${transfer.regionKey}`)}</span>
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
          1 {t("widgets.dataTransfer.followUpRequired")}
        </p>
      </div>
    </Card>
  );
}
