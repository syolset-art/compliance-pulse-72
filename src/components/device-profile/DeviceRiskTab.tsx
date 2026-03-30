import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Shield, ShieldCheck, Clock, TrendingDown, Database, Lock, Wifi } from "lucide-react";
import { type DeviceControl } from "./DeviceTrustProfile";
import { DeviceRiskFindings } from "./DeviceRiskFindings";

interface DeviceRiskTabProps {
  controls: DeviceControl[];
  meta: Record<string, any>;
  asset: Record<string, any>;
}

interface RiskFactor {
  id: string;
  label: string;
  labelEn: string;
  score: number; // 0-100 where 100 = highest risk
  icon: React.ReactNode;
  category: "confidentiality" | "integrity" | "availability";
}

export function DeviceRiskTab({ controls, meta, asset }: DeviceRiskTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  // Calculate risk factors from controls
  const failCount = controls.filter(c => c.status === "fail").length;
  const warnCount = controls.filter(c => c.status === "warn").length;
  const totalControls = controls.length;
  const overallRisk = Math.min(100, Math.round(((failCount * 2 + warnCount) / (totalControls * 2)) * 100));

  const getRiskLevel = (score: number) => {
    if (score >= 60) return { label: isNb ? "Høy" : "High", labelEn: "High", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" };
    if (score >= 30) return { label: isNb ? "Middels" : "Medium", labelEn: "Medium", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    return { label: isNb ? "Lav" : "Low", labelEn: "Low", color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" };
  };

  const level = getRiskLevel(overallRisk);

  // Build risk factors from control statuses
  const riskFactors: RiskFactor[] = [];

  const enc = controls.find(c => c.id === "encryption");
  riskFactors.push({
    id: "encryption",
    label: "Datakryptering",
    labelEn: "Data encryption",
    score: enc?.status === "fail" ? 90 : enc?.status === "warn" ? 45 : 10,
    icon: <Lock className="h-4 w-4" />,
    category: "confidentiality",
  });

  const mfa = controls.find(c => c.id === "mfa");
  riskFactors.push({
    id: "mfa",
    label: "Tilgangskontroll",
    labelEn: "Access control",
    score: mfa?.status === "fail" ? 80 : mfa?.status === "warn" ? 40 : 5,
    icon: <Shield className="h-4 w-4" />,
    category: "confidentiality",
  });

  const edr = controls.find(c => c.id === "edr");
  riskFactors.push({
    id: "edr",
    label: "Trusselovervåking",
    labelEn: "Threat monitoring",
    score: edr?.status === "fail" ? 85 : edr?.status === "warn" ? 40 : 8,
    icon: <ShieldCheck className="h-4 w-4" />,
    category: "integrity",
  });

  const patch = controls.find(c => c.id === "patching");
  riskFactors.push({
    id: "patching",
    label: "Sårbarhetshåndtering",
    labelEn: "Vulnerability management",
    score: patch?.status === "fail" ? 75 : patch?.status === "warn" ? 50 : 12,
    icon: <TrendingDown className="h-4 w-4" />,
    category: "integrity",
  });

  const backup = controls.find(c => c.id === "backup");
  riskFactors.push({
    id: "backup",
    label: "Sikkerhetskopiering",
    labelEn: "Backup & recovery",
    score: backup?.status === "fail" ? 70 : backup?.status === "warn" ? 35 : 5,
    icon: <Database className="h-4 w-4" />,
    category: "availability",
  });

  const network = controls.find(c => c.id === "network");
  riskFactors.push({
    id: "network",
    label: "Nettverkssikkerhet",
    labelEn: "Network security",
    score: network?.status === "fail" ? 65 : network?.status === "warn" ? 35 : 10,
    icon: <Wifi className="h-4 w-4" />,
    category: "availability",
  });

  // Demo risk history
  const riskHistory = [
    { date: "2026-03-30", score: overallRisk, event: isNb ? "Gjeldende vurdering" : "Current assessment" },
    { date: "2026-01-15", score: Math.min(100, overallRisk + 12), event: isNb ? "Før EDR-installasjon" : "Before EDR installation" },
    { date: "2025-10-01", score: Math.min(100, overallRisk + 25), event: isNb ? "Første registrering" : "Initial registration" },
  ];

  const categories = [
    { key: "confidentiality", label: isNb ? "Konfidensialitet" : "Confidentiality" },
    { key: "integrity", label: isNb ? "Integritet" : "Integrity" },
    { key: "availability", label: isNb ? "Tilgjengelighet" : "Availability" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Overall risk + CIA summary row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall risk score */}
        <Card className={`${level.bg} ${level.border} border`}>
          <CardContent className="p-5 flex flex-col items-center justify-center text-center">
            <div className="relative h-24 w-24 mb-2">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="stroke-muted"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={overallRisk >= 60 ? "stroke-destructive" : overallRisk >= 30 ? "stroke-amber-500" : "stroke-green-500"}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${overallRisk}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${level.color}`}>{overallRisk}</span>
              </div>
            </div>
            <span className={`text-sm font-semibold ${level.color}`}>{level.label}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              {isNb ? "Samlet risikonivå" : "Overall risk level"}
            </span>
          </CardContent>
        </Card>

        {/* CIA category scores */}
        {categories.map(cat => {
          const catFactors = riskFactors.filter(f => f.category === cat.key);
          const avgScore = Math.round(catFactors.reduce((sum, f) => sum + f.score, 0) / catFactors.length);
          const catLevel = getRiskLevel(avgScore);
          return (
            <Card key={cat.key}>
              <CardContent className="p-5">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {cat.label}
                </div>
                <div className="space-y-2.5">
                  {catFactors.map(f => {
                    const fLevel = getRiskLevel(f.score);
                    return (
                      <div key={f.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={fLevel.color}>{f.icon}</span>
                            <span className="text-xs font-medium">{isNb ? f.label : f.labelEn}</span>
                          </div>
                          <span className={`text-xs font-semibold ${fLevel.color}`}>{f.score}%</span>
                        </div>
                        <Progress
                          value={f.score}
                          className="h-1.5"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{isNb ? "Snitt" : "Average"}</span>
                  <Badge variant="outline" className={`text-[10px] ${catLevel.color}`}>
                    {avgScore}% — {catLevel.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Risk timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {isNb ? "Risikohistorikk" : "Risk history"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {riskHistory.map((entry, idx) => {
              const entryLevel = getRiskLevel(entry.score);
              return (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      entry.score >= 60 ? "bg-destructive" : entry.score >= 30 ? "bg-amber-500" : "bg-green-500"
                    }`} />
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <Progress value={entry.score} className="h-2 flex-1 max-w-[200px]" />
                    <span className={`text-xs font-semibold ${entryLevel.color} min-w-[32px]`}>{entry.score}%</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{entry.event}</span>
                  {idx === 0 && (
                    <Badge variant="outline" className="text-[9px]">
                      {isNb ? "Nå" : "Current"}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Existing findings */}
      <DeviceRiskFindings controls={controls} meta={meta} asset={asset} />
    </div>
  );
}
