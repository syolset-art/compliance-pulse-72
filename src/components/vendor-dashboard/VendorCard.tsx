import { Building2, MapPin, Shield, Link2, Mail, AlertTriangle, Cloud, Server, Lightbulb, Monitor, Home, MoreHorizontal, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  saas: <Cloud className="h-2.5 w-2.5" />,
  infrastructure: <Server className="h-2.5 w-2.5" />,
  consulting: <Lightbulb className="h-2.5 w-2.5" />,
  it_operations: <Monitor className="h-2.5 w-2.5" />,
  facilities: <Home className="h-2.5 w-2.5" />,
  other: <MoreHorizontal className="h-2.5 w-2.5" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  saas: "SaaS",
  infrastructure: "Infrastruktur",
  consulting: "Rådgivning",
  it_operations: "IT-drift",
  facilities: "Kontor",
  other: "Annet",
};

const GDPR_LABELS: Record<string, string> = {
  databehandler: "Databehandler",
  underdatabehandler: "Underdatabehandler",
  ingen: "Ingen persondata",
};

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
    vendor_category?: string | null;
    gdpr_role?: string | null;
    work_area_id?: string | null;
  };
  connectedSystemsCount?: number;
  hasDPA?: boolean;
  inboxCount?: number;
  expiredDocsCount?: number;
  onClick?: () => void;
  compact?: boolean;
  onDelete?: (id: string) => void;
}

export function VendorCard({ vendor, connectedSystemsCount = 0, hasDPA = false, inboxCount = 0, expiredDocsCount = 0, onClick, compact, onDelete }: VendorCardProps) {
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
        <div className="flex items-center gap-2">
          {onDelete && !vendor.work_area_id && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(vendor.id); }}
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Slett leverandør"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <div className={cn("text-lg font-bold", complianceColor)}>{score}%</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {vendor.vendor_category && (
          <Badge variant="outline" className="text-[10px] gap-1 bg-accent/50">
            {CATEGORY_ICONS[vendor.vendor_category]}
            {CATEGORY_LABELS[vendor.vendor_category] || vendor.vendor_category}
          </Badge>
        )}
        {vendor.gdpr_role && (
          <Badge variant="outline" className={cn("text-[10px]", vendor.gdpr_role === "ingen" ? "bg-muted" : "bg-primary/10 text-primary border-primary/20")}>
            {GDPR_LABELS[vendor.gdpr_role] || vendor.gdpr_role}
          </Badge>
        )}
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
