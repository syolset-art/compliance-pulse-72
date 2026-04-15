import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, CheckCircle2, XCircle, AlertTriangle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceAutomationProps {
  meta: Record<string, any>;
}

export function DeviceAutomation({ meta }: DeviceAutomationProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const hasMdm = !!meta.mdm;
  const hasEdr = meta.antivirus === "aktiv" || meta.antivirus === "active";

  const automationItems = [
    { label: "Auto-monitoring", status: hasEdr ? "active" : "inactive" },
    { label: "Auto-remediation", status: hasMdm ? "available" : "inactive" },
    { label: isNb ? "Varsler" : "Alerts", status: hasEdr ? "active" : "inactive" },
  ];

  const activeCount = automationItems.filter(i => i.status === "active").length;
  const inactiveCount = automationItems.filter(i => i.status === "inactive").length;
  const allOk = inactiveCount === 0;
  const hasWarningsOnly = !allOk && inactiveCount === 0;

  const statusConfig = {
    active: { icon: <CheckCircle2 className="h-4 w-4 text-success" />, badge: <Badge className="bg-success/10 text-success border-success/30 text-[13px]">{isNb ? "Aktiv" : "Active"}</Badge> },
    available: { icon: <AlertTriangle className="h-4 w-4 text-warning" />, badge: <Badge className="bg-warning/10 text-warning border-warning/30 text-[13px]">{isNb ? "Tilgjengelig" : "Available"}</Badge> },
    inactive: { icon: <XCircle className="h-4 w-4 text-destructive" />, badge: <Badge variant="outline" className="text-[13px] text-destructive border-destructive/30">{isNb ? "Inaktiv" : "Inactive"}</Badge> },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Circle className={cn(
            "h-3 w-3 shrink-0",
            allOk
              ? "fill-green-500 text-green-500"
              : inactiveCount > 0
                ? "fill-amber-500 text-amber-500"
                : "fill-green-500 text-green-500"
          )} />
          <Bot className="h-5 w-5 text-primary" />
          {isNb ? "Automatisering" : "Automation"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {automationItems.map((item, idx) => {
          const config = statusConfig[item.status as keyof typeof statusConfig];
          return (
            <div key={idx} className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0">
              <div className="flex items-center gap-2">
                {config.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {config.badge}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
