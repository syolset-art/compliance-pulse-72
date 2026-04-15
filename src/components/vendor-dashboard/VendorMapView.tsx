import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, AlertTriangle, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  category: string | null;
  compliance_score: number | null;
  risk_level: string | null;
  country?: string | null;
  region?: string | null;
}

interface VendorMapViewProps {
  vendors: Asset[];
}

const regionConfig = {
  norway: { labelKey: "vendorDashboard.regions.norway", color: "border-l-blue-500", bgColor: "bg-blue-500/5", icon: "🇳🇴", gdprSafe: true },
  eu_eea: { labelKey: "vendorDashboard.regions.euEea", color: "border-l-green-500", bgColor: "bg-green-500/5", icon: "🇪🇺", gdprSafe: true },
  usa: { labelKey: "vendorDashboard.regions.usa", color: "border-l-orange-500", bgColor: "bg-orange-500/5", icon: "🇺🇸", gdprSafe: false },
  other: { labelKey: "vendorDashboard.regions.other", color: "border-l-red-500", bgColor: "bg-red-500/5", icon: "🌍", gdprSafe: false },
};

export function VendorMapView({ vendors }: VendorMapViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Group by region
  const grouped = vendors.reduce<Record<string, Asset[]>>((acc, v) => {
    const region = (v as any).region || "other";
    if (!acc[region]) acc[region] = [];
    acc[region].push(v);
    return acc;
  }, {});

  // Ensure all regions are shown
  const regions = ["norway", "eu_eea", "usa", "other"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Globe className="h-4 w-4" />
        {t("vendorDashboard.mapDescription", "Vendors grouped by geographic location")}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {regions.map(region => {
          const config = regionConfig[region as keyof typeof regionConfig];
          const regionVendors = grouped[region] || [];
          return (
            <Card
              variant="flat"
              key={region}
              className={cn("border-l-4 overflow-hidden", config.color)}
            >
              <div className={cn("p-4", config.bgColor)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <h3 className="font-semibold text-foreground">
                      {t(config.labelKey, region)}
                    </h3>
                    <Badge variant="outline" className="text-xs">{regionVendors.length}</Badge>
                  </div>
                  {!config.gdprSafe && regionVendors.length > 0 && (
                    <Badge variant="outline" className="text-[13px] gap-1 bg-warning/10 text-warning border-warning/20">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {t("vendorDashboard.gdprTransfer", "GDPR Transfer")}
                    </Badge>
                  )}
                </div>

                {regionVendors.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    {t("vendorDashboard.noVendorsInRegion", "No vendors in this region")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {regionVendors.map(v => {
                      const score = v.compliance_score || 0;
                      const riskDot = { high: "bg-destructive", medium: "bg-warning", low: "bg-success" }[v.risk_level || ""] || "bg-muted-foreground";
                      return (
                        <div
                          key={v.id}
                          onClick={() => navigate(`/assets/${v.id}`)}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border hover:border-primary/30 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{v.name}</p>
                              <p className="text-xs text-muted-foreground">{v.country || "—"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2.5 w-2.5 rounded-full", riskDot)} />
                            <span className="text-xs font-medium text-muted-foreground">{score}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
