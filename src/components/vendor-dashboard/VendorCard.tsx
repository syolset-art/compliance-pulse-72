import { Building2, MapPin, Shield, Link2, Mail, AlertTriangle, Cloud, Server, Lightbulb, Monitor, Home, MoreHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { AssetRowActionMenu } from "@/components/shared/AssetRowActionMenu";

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

interface WorkArea {
  id: string;
  name: string;
  responsible_person?: string | null;
}

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
  workAreas?: WorkArea[];
  onSetOwner?: (itemId: string, workAreaId: string) => void;
  onArchive?: (itemId: string) => void;
  onDelete?: (id: string) => void;
}

export function VendorCard({ vendor, connectedSystemsCount = 0, hasDPA = false, inboxCount = 0, expiredDocsCount = 0, onClick, compact, workAreas = [], onSetOwner, onArchive, onDelete }: VendorCardProps) {
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
        "p-3 cursor-pointer hover:shadow-md transition-all hover:border-primary/30",
        compact && "p-2.5"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{vendor.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {vendor.vendor_category && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  {CATEGORY_ICONS[vendor.vendor_category]}
                  {CATEGORY_LABELS[vendor.vendor_category] || vendor.vendor_category}
                </span>
              )}
              {vendor.country && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />
                  {vendor.country}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!hasDPA && (
            <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 gap-1 px-1.5 py-0">
              <Shield className="h-2.5 w-2.5" />
              DPA
            </Badge>
          )}
          {expiredDocsCount > 0 && (
            <Badge variant="outline" className="text-[10px] gap-1 bg-destructive/10 text-destructive border-destructive/20 px-1.5 py-0">
              <AlertTriangle className="h-2.5 w-2.5" />
              {expiredDocsCount}
            </Badge>
          )}
          {vendor.risk_level && (
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", riskColor)}>
              {t(`vendorDashboard.risk.${vendor.risk_level}`, vendor.risk_level)}
            </Badge>
          )}
          <span className={cn("text-sm font-bold tabular-nums", complianceColor)}>{score}%</span>
          {onSetOwner && onArchive && onDelete && (
            <div onClick={(e) => e.stopPropagation()}>
              <AssetRowActionMenu
                itemId={vendor.id}
                currentWorkAreaId={vendor.work_area_id}
                workAreas={workAreas}
                onSetOwner={onSetOwner}
                onArchive={onArchive}
                onDelete={onDelete}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
