import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, CheckCircle2, XCircle, AlertTriangle, Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceTechnicalStatusProps {
  meta: Record<string, any>;
}

export function DeviceTechnicalStatus({ meta }: DeviceTechnicalStatusProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const patchDays = meta.last_patch_date
    ? Math.floor((Date.now() - new Date(meta.last_patch_date).getTime()) / 86400000)
    : null;

  const osOutdated = patchDays !== null && patchDays > 30;

  const statusIcon = (val: any, warningVal?: string) => {
    if (!val) return <XCircle className="h-4 w-4 text-destructive" />;
    if (val === warningVal) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  };

  const rows = [
    { label: "OS", value: meta.os || "–", icon: osOutdated ? <AlertTriangle className="h-4 w-4 text-warning" /> : <CheckCircle2 className="h-4 w-4 text-success" />, note: osOutdated ? (isNb ? "utdatert" : "outdated") : null },
    { label: isNb ? "Kryptering" : "Encryption", value: meta.encryption || "–", icon: statusIcon(meta.encryption) },
    { label: "EDR", value: meta.antivirus || "–", icon: statusIcon(meta.antivirus, "utgått") },
    { label: "MDM", value: meta.mdm || "–", icon: statusIcon(meta.mdm) },
    { label: "Backup", value: meta.backup || "–", icon: statusIcon(meta.backup) },
    { label: isNb ? "Plassering" : "Location", value: meta.location || "–", icon: statusIcon(meta.location) },
    { label: "Hostname", value: meta.hostname || "–", icon: null },
    { label: isNb ? "Serienummer" : "Serial", value: meta.serial_number || "–", icon: null },
  ];

  // Calculate overall status
  const checkableRows = rows.filter(r => r.icon !== null);
  const issueCount = checkableRows.filter(r => {
    const iconType = r.icon?.type;
    return iconType === XCircle || iconType === AlertTriangle;
  }).length;
  const allOk = issueCount === 0;
  const hasWarningsOnly = !allOk && checkableRows.every(r => r.icon?.type !== XCircle);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Circle className={cn(
            "h-3 w-3 shrink-0",
            allOk
              ? "fill-green-500 text-green-500"
              : hasWarningsOnly
                ? "fill-amber-500 text-amber-500"
                : "fill-red-500 text-red-500"
          )} />
          <Monitor className="h-5 w-5 text-primary" />
          {isNb ? "Teknisk status" : "Technical Status"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0">
            <div className="flex items-center gap-2 min-w-0">
              {row.icon && <span className="shrink-0">{row.icon}</span>}
              <span className="text-sm font-medium text-foreground">{row.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">{row.value}</span>
              {row.note && (
                <Badge variant="outline" className="text-[9px] text-warning border-warning/30">
                  {row.note}
                </Badge>
              )}
            </div>
          </div>
        ))}
        {patchDays !== null && (
          <div className="flex items-center justify-between px-5 py-2.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{isNb ? "Sist sett" : "Last seen"}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {patchDays === 0 ? (isNb ? "I dag" : "Today") : `${patchDays}d ${isNb ? "siden" : "ago"}`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
