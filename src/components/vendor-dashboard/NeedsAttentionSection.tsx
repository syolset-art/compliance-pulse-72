import { FileX, CalendarClock, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface AttentionItem {
  type: "missing_dpa" | "overdue_review" | "high_risk_unaudited";
  vendors: { id: string; name: string }[];
}

interface NeedsAttentionSectionProps {
  items: AttentionItem[];
}

const iconMap = {
  missing_dpa: FileX,
  overdue_review: CalendarClock,
  high_risk_unaudited: ShieldAlert,
};

const colorMap = {
  missing_dpa: "text-warning",
  overdue_review: "text-orange-500",
  high_risk_unaudited: "text-destructive",
};

export function NeedsAttentionSection({ items }: NeedsAttentionSectionProps) {
  const { t } = useTranslation();

  if (items.every(i => i.vendors.length === 0)) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("vendorDashboard.needsAttention", "Needs Attention")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((item) => {
          if (item.vendors.length === 0) return null;
          const Icon = iconMap[item.type];
          const color = colorMap[item.type];
          return (
            <Card variant="flat" key={item.type} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-sm font-medium text-foreground">
                  {t(`vendorDashboard.attention.${item.type}`, item.type)}
                </span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {item.vendors.length}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {item.vendors.slice(0, 3).map((v) => (
                  <p key={v.id} className="text-sm text-muted-foreground truncate">{v.name}</p>
                ))}
                {item.vendors.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{item.vendors.length - 3} {t("vendorDashboard.more", "more")}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
