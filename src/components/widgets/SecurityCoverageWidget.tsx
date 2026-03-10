import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SECURITY_SERVICE_CATALOG,
  evaluateServiceCoverage,
} from "@/lib/securityServiceCatalog";
import { useTranslation } from "react-i18next";

export function SecurityCoverageWidget() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const results = evaluateServiceCoverage(null);
  const covered = results.filter((r) => r.status === "covered").length;
  const total = SECURITY_SERVICE_CATALOG.length;
  const pct = Math.round((covered / total) * 100);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">{isNb ? "Sikkerhetsdekning" : "Security Coverage"}</h3>
        </div>
        <Badge variant="secondary">{covered}/{total}</Badge>
      </div>

      <Progress value={pct} className="h-2 mb-4" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {results.map(({ service, status }) => {
          const Icon = service.icon;
          const statusIcon =
            status === "covered" ? CheckCircle :
            status === "missing" ? XCircle : HelpCircle;
          const StatusIcon = statusIcon;

          return (
            <div
              key={service.id}
              className={cn(
                "rounded-md p-2 flex items-center gap-2 text-xs border",
                status === "covered" && "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30",
                status === "missing" && "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30",
                status === "unknown" && "border-muted bg-muted/30"
              )}
            >
              <div className={cn("h-6 w-6 rounded flex items-center justify-center text-white shrink-0", service.color)}>
                <Icon className="h-3 w-3" />
              </div>
              <span className="font-medium text-foreground truncate flex-1">{isNb ? service.name : service.nameEn}</span>
              <StatusIcon className={cn(
                "h-3.5 w-3.5 shrink-0",
                status === "covered" && "text-green-600 dark:text-green-400",
                status === "missing" && "text-red-600 dark:text-red-400",
                status === "unknown" && "text-muted-foreground"
              )} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
