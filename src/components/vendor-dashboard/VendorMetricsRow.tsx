import { Building2, ShieldCheck, FileX, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface VendorMetricsRowProps {
  total: number;
  compliantPercent: number;
  missingDPA: number;
  highRisk: number;
}

export function VendorMetricsRow({ total, compliantPercent, missingDPA, highRisk }: VendorMetricsRowProps) {
  const { t } = useTranslation();

  const metrics = [
    { label: t("vendorDashboard.metrics.total", "Total Vendors"), value: total, icon: Building2, color: "text-primary" },
    { label: t("vendorDashboard.metrics.compliant", "Compliant"), value: `${compliantPercent}%`, icon: ShieldCheck, color: "text-success" },
    { label: t("vendorDashboard.metrics.missingDPA", "Missing DPA"), value: missingDPA, icon: FileX, color: "text-warning" },
    { label: t("vendorDashboard.metrics.highRisk", "High Risk"), value: highRisk, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <Card variant="flat" key={m.label} className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <m.icon className={`h-4 w-4 ${m.color}`} />
            <span className="text-xs text-muted-foreground">{m.label}</span>
          </div>
          <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
        </Card>
      ))}
    </div>
  );
}
