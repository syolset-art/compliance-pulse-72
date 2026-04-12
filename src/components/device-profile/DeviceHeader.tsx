import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  HardDrive, Smartphone, Monitor, Server, Wifi,
  AlertTriangle, TrendingDown, Clock, Link2,
} from "lucide-react";
import { type DeviceControl } from "./DeviceTrustProfile";
import { HeaderMaturityIndicators } from "@/components/trust-controls/HeaderMaturityIndicators";

const DEVICE_ICONS: Record<string, typeof HardDrive> = {
  workstation: Monitor,
  mobile: Smartphone,
  server: Server,
  nas: HardDrive,
};

interface DeviceHeaderProps {
  asset: Record<string, any>;
  meta: Record<string, any>;
  trustScore: number;
  controls: DeviceControl[];
}

export function DeviceHeader({ asset, meta, trustScore, controls }: DeviceHeaderProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const DeviceIcon = DEVICE_ICONS[meta.device_type] || HardDrive;
  const isHigh = trustScore >= 75;
  const isMid = trustScore >= 50;

  const criticalityLabel = asset.criticality === "critical"
    ? (isNb ? "Kritisk" : "Critical")
    : asset.criticality === "high"
      ? (isNb ? "Høy" : "High")
      : asset.criticality === "medium"
        ? (isNb ? "Middels" : "Medium")
        : (isNb ? "Lav" : "Low");

  const riskLabel = trustScore < 50
    ? (isNb ? "Høy risiko" : "High risk")
    : trustScore < 75
      ? (isNb ? "Middels risiko" : "Medium risk")
      : (isNb ? "Lav risiko" : "Low risk");

  // Estimate total trust score impact
  const failedControls = controls.filter(c => c.status === "fail");
  const totalImpact = failedControls.reduce((sum, c) => sum + c.scoreImpact, 0);

  // Managed via
  const managedVia = [meta.mdm, meta.antivirus === "aktiv" || meta.antivirus === "active" ? "EDR" : null]
    .filter(Boolean).join(" / ") || null;

  // SVG gauge
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const dash = (trustScore / 100) * circ;
  const strokeColor = isHigh ? "hsl(var(--success))" : isMid ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  // Security area scores
  const areaScores = [
    {
      label: isNb ? "Drift" : "Operations",
      score: calcAreaScore(controls, "operations"),
    },
    {
      label: isNb ? "Personvern og datahåndtering" : "Privacy & Data Handling",
      score: calcAreaScore(controls, "identity"),
    },
    {
      label: isNb ? "Databeskyttelse" : "Data Protection",
      score: calcAreaScore(controls, "data_protection"),
    },
  ];

  // Compliance impact
  const complianceImpact = getComplianceImpact(controls, isNb);

  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-start gap-4">
        {/* Device icon */}
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <DeviceIcon className="h-6 w-6 text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-lg md:text-xl font-bold text-foreground">{asset.name}</h1>
            <Badge variant="outline" className="text-[10px]">
              {isNb ? "Enhet" : "Device"}
            </Badge>
            <Badge className="bg-success/15 text-success border-success/30 text-[10px]">
              {isNb ? "Aktiv" : "Active"}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {isNb ? "Kritikalitet" : "Criticality"}: {criticalityLabel}
            </Badge>
          </div>

          {asset.description && (
            <p className="text-sm text-muted-foreground mb-2">{asset.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {isNb ? "Sist synkronisert:" : "Last synced:"} {meta.last_patch_date ? `${Math.floor((Date.now() - new Date(meta.last_patch_date).getTime()) / 86400000)}d` : "–"}
            </div>
            {managedVia && (
              <div className="flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                Managed via: {managedVia}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Horizontal metric cards */}
      <div className="mt-4 pt-4 border-t border-border">
        <HeaderMaturityIndicators
          riskLevel={trustScore < 50 ? "high" : trustScore < 75 ? "medium" : "low"}
          criticality={asset.criticality || "medium"}
          maturityPercent={trustScore}
        />
      </div>

      {/* Security areas + Compliance impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
        {/* Security Areas */}
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            {isNb ? "Sikkerhetsområder" : "Security Areas"}
          </h3>
          <div className="space-y-2">
            {areaScores.map(a => (
              <div key={a.label} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-foreground">{a.label}</span>
                  <span className="text-[11px] font-semibold tabular-nums">{a.score}%</span>
                </div>
                <Progress value={a.score} className="h-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Compliance impact */}
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            {isNb ? "Compliance-påvirkning" : "Compliance Impact"}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {complianceImpact.map(ci => (
              <Badge
                key={ci.framework}
                variant="outline"
                className={`text-[10px] gap-1 ${ci.color}`}
              >
                <AlertTriangle className="h-2.5 w-2.5" />
                {ci.framework} → {ci.status}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function calcAreaScore(controls: DeviceControl[], category: string): number {
  const area = controls.filter(c => c.category === category);
  if (area.length === 0) return 0;
  const pass = area.filter(c => c.status === "pass").length;
  const partial = area.filter(c => c.status === "warn").length;
  return Math.round(((pass + partial * 0.5) / area.length) * 100);
}

function getComplianceImpact(controls: DeviceControl[], isNb: boolean) {
  const hasEncryptionFail = controls.find(c => c.id === "encryption")?.status === "fail";
  const hasEdrFail = controls.find(c => c.id === "edr")?.status !== "pass";
  const hasMfaFail = controls.find(c => c.id === "mfa")?.status !== "pass";
  const hasBackupFail = controls.find(c => c.id === "backup")?.status === "fail";

  const impacts: { framework: string; status: string; color: string }[] = [];

  if (hasEncryptionFail || hasMfaFail) {
    impacts.push({
      framework: "NIS2",
      status: isNb ? "påvirket" : "affected",
      color: "border-orange-300 text-orange-700 dark:text-orange-400",
    });
  }
  if (hasEdrFail || hasEncryptionFail) {
    impacts.push({
      framework: "ISO 27001",
      status: isNb ? "avvik" : "non-compliant",
      color: "border-green-300 text-green-700 dark:text-green-400",
    });
  }
  if (hasEncryptionFail || hasBackupFail) {
    impacts.push({
      framework: "GDPR",
      status: isNb ? "risiko ved datatap" : "data loss risk",
      color: "border-blue-300 text-blue-700 dark:text-blue-400",
    });
  }

  if (impacts.length === 0) {
    impacts.push({
      framework: isNb ? "Alle" : "All",
      status: isNb ? "OK" : "OK",
      color: "border-success/30 text-success",
    });
  }

  return impacts;
}
