import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Server, Building2, Network, Package, Users, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  asset_type: string;
  risk_level: string | null;
  ownership: "owner" | "user";
}

interface AssetSummaryDashboardProps {
  assets: Asset[];
}

export function AssetSummaryDashboard({ assets }: AssetSummaryDashboardProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const total = assets.length;
    const systems = assets.filter((a) => a.asset_type === "system").length;
    const locations = assets.filter((a) => a.asset_type === "location").length;
    const networks = assets.filter((a) => a.asset_type === "network").length;
    const other = total - systems - locations - networks;

    const owners = assets.filter((a) => a.ownership === "owner").length;
    const users = assets.filter((a) => a.ownership === "user").length;

    const highRisk = assets.filter(
      (a) => a.risk_level === "high" || a.risk_level === "critical"
    ).length;

    return {
      total,
      systems,
      locations,
      networks,
      other,
      owners,
      users,
      highRisk,
      ownerPercentage: total > 0 ? Math.round((owners / total) * 100) : 0,
    };
  }, [assets]);

  if (assets.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-4">
      {/* Total Assets */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">
              {t("myWorkAreas.summary.totalAssets")}
            </p>
          </div>
        </div>
      </Card>

      {/* Asset Types Breakdown */}
      <Card className="p-4">
        <p className="text-xs text-muted-foreground mb-2">
          {t("myWorkAreas.summary.byType")}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-blue-500" />
              <span>{t("myWorkAreas.assetTypes.system")}</span>
            </div>
            <span className="font-medium">{stats.systems}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-green-500" />
              <span>{t("myWorkAreas.assetTypes.location")}</span>
            </div>
            <span className="font-medium">{stats.locations}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Network className="h-3.5 w-3.5 text-orange-500" />
              <span>{t("myWorkAreas.assetTypes.network")}</span>
            </div>
            <span className="font-medium">{stats.networks}</span>
          </div>
        </div>
      </Card>

      {/* Ownership Distribution */}
      <Card className="p-4">
        <p className="text-xs text-muted-foreground mb-2">
          {t("myWorkAreas.summary.ownership")}
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span>{t("myWorkAreas.roleOwner")}</span>
            </div>
            <span className="font-medium">{stats.owners}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>{t("myWorkAreas.roleUser")}</span>
            </div>
            <span className="font-medium">{stats.users}</span>
          </div>
          <Progress 
            value={stats.ownerPercentage} 
            className="h-1.5 mt-1"
          />
          <p className="text-xs text-muted-foreground text-right">
            {stats.ownerPercentage}% {t("myWorkAreas.roleOwner").toLowerCase()}
          </p>
        </div>
      </Card>

      {/* Risk Overview */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            stats.highRisk > 0 ? "bg-destructive/10" : "bg-success/10"
          )}>
            <Shield className={cn(
              "h-5 w-5",
              stats.highRisk > 0 ? "text-destructive" : "text-success"
            )} />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.highRisk}</p>
            <p className="text-xs text-muted-foreground">
              {t("myWorkAreas.summary.highRisk")}
            </p>
          </div>
        </div>
        {stats.highRisk === 0 && (
          <p className="text-xs text-success mt-2">
            {t("myWorkAreas.summary.noHighRisk")}
          </p>
        )}
      </Card>
    </div>
  );
}
