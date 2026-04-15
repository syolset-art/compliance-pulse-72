import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, ShieldAlert, ChevronDown, Zap } from "lucide-react";
import { type DeviceControl } from "./DeviceTrustProfile";

type FindingStatus = "not_started" | "in_progress" | "resolved";

interface DeviceRiskFindingsProps {
  controls: DeviceControl[];
  meta: Record<string, any>;
  asset: Record<string, any>;
}

interface RiskFinding {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  action: string;
  actionEn: string;
  severity: "critical" | "high" | "medium";
}

export function DeviceRiskFindings({ controls, meta, asset }: DeviceRiskFindingsProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [statuses, setStatuses] = useState<Record<string, FindingStatus>>({});
  const [showMedium, setShowMedium] = useState(false);

  const findings: RiskFinding[] = [];

  const encryptionCtrl = controls.find(c => c.id === "encryption");
  if (encryptionCtrl?.status === "fail") {
    const who = asset.asset_manager || asset.name;
    findings.push({
      id: "enc",
      title: `Ukryptert enhet (${who})`,
      titleEn: `Unencrypted device (${who})`,
      description: "Risiko for datalekkasjer ved tap eller tyveri av enheten.",
      descriptionEn: "Risk of data leaks if the device is lost or stolen.",
      action: "Aktiver BitLocker, FileVault eller LUKS",
      actionEn: "Enable BitLocker, FileVault, or LUKS",
      severity: "critical",
    });
  }

  const edrCtrl = controls.find(c => c.id === "edr");
  if (edrCtrl?.status === "fail") {
    findings.push({
      id: "edr",
      title: "Ingen endpoint-overvåking",
      titleEn: "No endpoint monitoring",
      description: "Økt sannsynlighet for angrep uten deteksjon.",
      descriptionEn: "Increased probability of undetected attacks.",
      action: "Installer EDR-løsning (CrowdStrike, Defender for Endpoint)",
      actionEn: "Install EDR solution (CrowdStrike, Defender for Endpoint)",
      severity: "critical",
    });
  }

  const mdmCtrl = controls.find(c => c.id === "mdm");
  if (mdmCtrl?.status === "fail") {
    findings.push({
      id: "mdm",
      title: "Enheten er ikke administrert (MDM)",
      titleEn: "Device not managed (MDM)",
      description: "Kan ikke fjernstyres, oppdateres eller slettes ved tap.",
      descriptionEn: "Cannot be remotely managed, updated, or wiped if lost.",
      action: "Registrer enheten i Intune, Jamf eller tilsvarende",
      actionEn: "Enroll device in Intune, Jamf, or equivalent",
      severity: "high",
    });
  }

  const mfaCtrl = controls.find(c => c.id === "mfa");
  if (mfaCtrl?.status === "fail") {
    findings.push({
      id: "mfa",
      title: "Mangler MFA / tilgangskontroll",
      titleEn: "Missing MFA / access control",
      description: "Uautorisert tilgang er ikke beskyttet med flerfaktorautentisering.",
      descriptionEn: "Unauthorized access is not protected by multi-factor authentication.",
      action: "Aktiver MFA for enhetstilgang",
      actionEn: "Enable MFA for device access",
      severity: "high",
    });
  }

  const patchCtrl = controls.find(c => c.id === "patching");
  if (patchCtrl?.status === "fail") {
    findings.push({
      id: "patch_fail",
      title: "OS ikke oppdatert",
      titleEn: "OS not patched",
      description: "Kjente sårbarheter kan utnyttes av angripere.",
      descriptionEn: "Known vulnerabilities may be exploited by attackers.",
      action: "Konfigurer automatisk oppdatering",
      actionEn: "Configure automatic updates",
      severity: "high",
    });
  } else if (patchCtrl?.status === "warn") {
    findings.push({
      id: "patch_warn",
      title: "OS-oppdatering delvis ufullstendig",
      titleEn: "OS patching partially incomplete",
      description: "Oppdateringer er eldre enn 30 dager.",
      descriptionEn: "Patches are older than 30 days.",
      action: "Planlegg oppdatering",
      actionEn: "Schedule update",
      severity: "medium",
    });
  }

  const backupCtrl = controls.find(c => c.id === "backup");
  if (backupCtrl?.status === "fail") {
    findings.push({
      id: "backup",
      title: "Ingen backup konfigurert",
      titleEn: "No backup configured",
      description: "Data kan gå tapt ved enhetsfeil eller angrep.",
      descriptionEn: "Data may be lost in case of device failure or attack.",
      action: "Sett opp automatisk backup til sky eller NAS",
      actionEn: "Set up automatic backup to cloud or NAS",
      severity: "medium",
    });
  }

  const cycleStatus = (id: string) => {
    setStatuses(prev => {
      const current = prev[id] || "not_started";
      const next: FindingStatus = current === "not_started" ? "in_progress" : current === "in_progress" ? "resolved" : "not_started";
      return { ...prev, [id]: next };
    });
  };

  const statusLabel = (s: FindingStatus) => {
    if (s === "in_progress") return isNb ? "Pågår" : "In progress";
    if (s === "resolved") return isNb ? "Løst" : "Resolved";
    return isNb ? "Ikke startet" : "Not started";
  };

  const statusVariant = (s: FindingStatus) => {
    if (s === "resolved") return "action" as const;
    if (s === "in_progress") return "warning" as const;
    return "outline" as const;
  };

  if (findings.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {isNb ? "Ingen kritiske funn" : "No critical findings"}
        </p>
      </Card>
    );
  }

  const criticalHigh = findings.filter(f => f.severity === "critical" || f.severity === "high");
  const mediums = findings.filter(f => f.severity === "medium");

  const renderFinding = (f: RiskFinding) => {
    const st = statuses[f.id] || "not_started";
    const sevColor = f.severity === "critical"
      ? "bg-destructive/10 border-destructive/20"
      : f.severity === "high"
        ? "bg-destructive/5 border-destructive/15"
        : "bg-warning/5 border-warning/15";
    const textColor = f.severity === "critical" || f.severity === "high"
      ? "text-destructive"
      : "text-warning";
    const badgeVariant = f.severity === "critical" || f.severity === "high"
      ? "destructive" as const
      : "warning" as const;

    return (
      <div key={f.id} className={`px-5 py-3 border-b last:border-b-0 space-y-2 ${sevColor}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${textColor}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-semibold ${textColor}`}>
                {isNb ? f.title : f.titleEn}
              </span>
              <Badge variant={badgeVariant} className="text-[13px] uppercase">
                {f.severity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              → {isNb ? f.description : f.descriptionEn}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-7">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
            <Zap className="h-3 w-3" />
            {isNb ? f.action : f.actionEn}
          </Button>
          <Badge
            variant={statusVariant(st)}
            className="text-[13px] cursor-pointer ml-auto"
            onClick={() => cycleStatus(f.id)}
          >
            {statusLabel(st)}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            {isNb ? "Kritiske funn" : "Critical Findings"}
            <Badge variant="destructive" className="text-[13px] ml-1">{criticalHigh.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {criticalHigh.map(renderFinding)}
        </CardContent>
      </Card>

      {mediums.length > 0 && (
        <Collapsible open={showMedium} onOpenChange={setShowMedium}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-sm flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  {isNb ? "Andre funn" : "Other findings"} ({mediums.length})
                  <ChevronDown className={`h-3.5 w-3.5 ml-auto text-muted-foreground transition-transform ${showMedium ? "rotate-180" : ""}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-0 p-0">
                {mediums.map(renderFinding)}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
