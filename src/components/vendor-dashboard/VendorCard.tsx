import { Building2, MapPin, Shield, Link2, Mail, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface VendorCardProps {
  vendor: {
    id: string;
    name: string;
    category: string | null;
    compliance_score: number | null;
    risk_level: string | null;
    country?: string | null;
    region?: string | null;
    vendor?: string | null;
  };
  connectedSystemsCount?: number;
  hasDPA?: boolean;
  inboxCount?: number;
  expiredDocsCount?: number;
  onClick?: () => void;
  compact?: boolean;
}

export function VendorCard({ vendor, connectedSystemsCount = 0, hasDPA = false, inboxCount = 0, expiredDocsCount = 0, onClick, compact }: VendorCardProps) {
  const { t } = useTranslation();
  const score = vendor.compliance_score || 0;

  const riskColor = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    low: "bg-success/10 text-success border-success/20",
  }[vendor.risk_level || ""] || "bg-muted text-muted-foreground border-border";

  const complianceColor = score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";

  return (
    <Card
      variant="flat"
      onClick={onClick}
      className={cn(
        "p-4 cursor-pointer hover:shadow-md transition-all hover:border-primary/30",
        compact && "p-3"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{vendor.name}</p>
            <p className="text-xs text-muted-foreground truncate">{vendor.category || "—"}</p>
          </div>
        </div>
        <div className={cn("text-lg font-bold", complianceColor)}>{score}%</div>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {vendor.risk_level && (
          <Badge variant="outline" className={cn("text-[10px]", riskColor)}>
            {t(`vendorDashboard.risk.${vendor.risk_level}`, vendor.risk_level)}
          </Badge>
        )}
        {vendor.country && (
          <Badge variant="outline" className="text-[10px] gap-1">
            <MapPin className="h-2.5 w-2.5" />
            {vendor.country}
          </Badge>
        )}
        {hasDPA ? (
          <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20 gap-1">
            <Shield className="h-2.5 w-2.5" />
            DPA
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 gap-1">
            <Shield className="h-2.5 w-2.5" />
            {t("vendorDashboard.missingDPA", "Missing DPA")}
          </Badge>
        )}
        {connectedSystemsCount > 0 && (
          <Badge variant="outline" className="text-[10px] gap-1">
            <Link2 className="h-2.5 w-2.5" />
            {connectedSystemsCount} {t("vendorDashboard.systems", "systems")}
          </Badge>
        )}
        {expiredDocsCount > 0 && (
          <Badge variant="outline" className="text-[10px] gap-1 bg-destructive/10 text-destructive border-destructive/20">
            <AlertTriangle className="h-2.5 w-2.5" />
            {expiredDocsCount} {t("vendorDashboard.expired", "utdatert")}
          </Badge>
        )}
        {inboxCount > 0 && (
          <Badge variant="outline" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20">
            <Mail className="h-2.5 w-2.5" />
            {inboxCount} {t("vendorDashboard.pending", "pending")}
          </Badge>
        )}
      </div>
    </Card>
  );
}
