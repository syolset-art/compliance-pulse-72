import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { type DeviceControl } from "./DeviceTrustProfile";
import { DeviceRiskFindings } from "./DeviceRiskFindings";
import { DeviceActionPlans } from "./DeviceActionPlans";
import { DeviceTechnicalStatus } from "./DeviceTechnicalStatus";
import { DeviceAutomation } from "./DeviceAutomation";

interface DeviceOverviewTabProps {
  asset: Record<string, any>;
  meta: Record<string, any>;
  controls: DeviceControl[];
  trustScore: number;
}

export function DeviceOverviewTab({ asset, meta, controls, trustScore }: DeviceOverviewTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const passCount = controls.filter(c => c.status === "pass").length;
  const failCount = controls.filter(c => c.status === "fail").length;
  const warnCount = controls.filter(c => c.status === "warn").length;

  return (
    <div className="space-y-4">
      {/* Compact score summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Shield className="h-6 w-6 text-primary shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{isNb ? "Trust Score" : "Trust Score"}</span>
                <span className={`text-lg font-bold ${trustScore >= 80 ? "text-success" : trustScore >= 50 ? "text-warning" : "text-destructive"}`}>
                  {trustScore}%
                </span>
              </div>
              <Progress value={trustScore} className="h-2" />
            </div>
            <div className="flex items-center gap-3 text-xs shrink-0">
              {failCount > 0 && (
                <div className="flex items-center gap-1 text-destructive font-medium">
                  <XCircle className="h-3.5 w-3.5" />
                  {failCount}
                </div>
              )}
              {warnCount > 0 && (
                <div className="flex items-center gap-1 text-warning font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {warnCount}
                </div>
              )}
              <div className="flex items-center gap-1 text-success font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {passCount}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical/high findings with actions */}
      <DeviceRiskFindings controls={controls} meta={meta} asset={asset} />

      {/* Action plans */}
      <DeviceActionPlans controls={controls} meta={meta} totalControls={controls.length} />

      {/* Technical details at bottom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DeviceTechnicalStatus meta={meta} />
        <DeviceAutomation meta={meta} />
      </div>
    </div>
  );
}
