import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Server, 
  Building2, 
  Network, 
  MapPin,
  TrendingUp,
  Clock
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface Asset {
  id: string;
  asset_type: string;
  name: string;
  risk_level: string | null;
  compliance_score: number | null;
  lifecycle_status: string | null;
  next_review_date: string | null;
}

interface AssetSummaryWidgetProps {
  assets: Asset[];
}

export function AssetSummaryWidget({ assets }: AssetSummaryWidgetProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const total = assets.length;
    const highRisk = assets.filter(a => a.risk_level === "high").length;
    const mediumRisk = assets.filter(a => a.risk_level === "medium").length;
    const lowRisk = assets.filter(a => a.risk_level === "low").length;
    
    const compliant = assets.filter(a => (a.compliance_score || 0) >= 85).length;
    const needsAttention = assets.filter(a => {
      const score = a.compliance_score || 0;
      return score >= 50 && score < 85;
    }).length;
    const nonCompliant = assets.filter(a => (a.compliance_score || 0) < 50).length;
    
    const avgCompliance = total > 0 
      ? Math.round(assets.reduce((sum, a) => sum + (a.compliance_score || 0), 0) / total)
      : 0;

    // Count by type
    const byType = {
      system: assets.filter(a => a.asset_type === "system").length,
      vendor: assets.filter(a => a.asset_type === "vendor").length,
      network: assets.filter(a => a.asset_type === "network").length,
      location: assets.filter(a => a.asset_type === "location").length,
      other: assets.filter(a => !["system", "vendor", "network", "location"].includes(a.asset_type)).length,
    };

    // Upcoming reviews (next 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingReviews = assets.filter(a => {
      if (!a.next_review_date) return false;
      const reviewDate = new Date(a.next_review_date);
      return reviewDate >= today && reviewDate <= thirtyDaysFromNow;
    }).length;

    return {
      total,
      highRisk,
      mediumRisk,
      lowRisk,
      compliant,
      needsAttention,
      nonCompliant,
      avgCompliance,
      byType,
      upcomingReviews,
    };
  }, [assets]);

  const getComplianceColor = (score: number) => {
    if (score >= 85) return "text-status-closed";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Main Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Assets */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Compliance */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-status-closed/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-status-closed" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${getComplianceColor(stats.avgCompliance)}`}>
                  {stats.avgCompliance}%
                </p>
                <p className="text-xs text-muted-foreground">Avg. Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* High Risk */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.highRisk}</p>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Reviews */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{stats.upcomingReviews}</p>
                <p className="text-xs text-muted-foreground">Reviews (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Compliance Status */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Compliance Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-status-closed" />
                  <span className="text-sm text-foreground">Compliant (≥85%)</span>
                </div>
                <span className="text-sm font-medium text-foreground">{stats.compliant}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-warning" />
                  <span className="text-sm text-foreground">Needs Attention (50-84%)</span>
                </div>
                <span className="text-sm font-medium text-foreground">{stats.needsAttention}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                  <span className="text-sm text-foreground">Non-compliant (&lt;50%)</span>
                </div>
                <span className="text-sm font-medium text-foreground">{stats.nonCompliant}</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden flex">
              {stats.total > 0 && (
                <>
                  <div 
                    className="h-full bg-status-closed" 
                    style={{ width: `${(stats.compliant / stats.total) * 100}%` }} 
                  />
                  <div 
                    className="h-full bg-warning" 
                    style={{ width: `${(stats.needsAttention / stats.total) * 100}%` }} 
                  />
                  <div 
                    className="h-full bg-destructive" 
                    style={{ width: `${(stats.nonCompliant / stats.total) * 100}%` }} 
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Asset Types */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Assets by Type</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Server className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{stats.byType.system}</p>
                  <p className="text-xs text-muted-foreground">Systems</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{stats.byType.vendor}</p>
                  <p className="text-xs text-muted-foreground">Vendors</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Network className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{stats.byType.network}</p>
                  <p className="text-xs text-muted-foreground">Networks</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-status-closed/20 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-status-closed" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{stats.byType.location}</p>
                  <p className="text-xs text-muted-foreground">Locations</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
