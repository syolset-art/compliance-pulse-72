import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldAlert, ChevronRight } from "lucide-react";
import { type DeviceControl } from "./DeviceTrustProfile";
import { FindingRemediationDialog } from "./FindingRemediationDialog";

interface DeviceRiskFindingsProps {
  controls: DeviceControl[];
  meta: Record<string, any>;
  asset: Record<string, any>;
}

interface RiskFinding {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  severity: "critical" | "high" | "medium";
  controlId: string;
}

export function DeviceRiskFindings({ controls, meta, asset }: DeviceRiskFindingsProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [selectedFinding, setSelectedFinding] = useState<RiskFinding | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const findings: RiskFinding[] = [];

  const encryptionCtrl = controls.find(c => c.id === "encryption");
  if (encryptionCtrl?.status === "fail") {
    const who = asset.asset_manager || asset.name;
    findings.push({
      title: `Ukryptert enhet (${who})`,
      titleEn: `Unencrypted device (${who})`,
      description: "Risiko for datalekkasjer ved tap eller tyveri av enheten.",
      descriptionEn: "Risk of data leaks if the device is lost or stolen.",
      severity: "critical",
      controlId: "encryption",
    });
  }

  const edrCtrl = controls.find(c => c.id === "edr");
  if (edrCtrl?.status === "fail") {
    findings.push({
      title: "Ingen endpoint-overvåking",
      titleEn: "No endpoint monitoring",
      description: "Økt sannsynlighet for angrep uten deteksjon.",
      descriptionEn: "Increased probability of undetected attacks.",
      severity: "critical",
      controlId: "edr",
    });
  }

  const mdmCtrl = controls.find(c => c.id === "mdm");
  if (mdmCtrl?.status === "fail") {
    findings.push({
      title: "Enheten er ikke administrert (MDM)",
      titleEn: "Device not managed (MDM)",
      description: "Kan ikke fjernstyres, oppdateres eller slettes ved tap.",
      descriptionEn: "Cannot be remotely managed, updated, or wiped if lost.",
      severity: "high",
      controlId: "mdm",
    });
  }

  const mfaCtrl = controls.find(c => c.id === "mfa");
  if (mfaCtrl?.status === "fail") {
    findings.push({
      title: "Mangler MFA / tilgangskontroll",
      titleEn: "Missing MFA / access control",
      description: "Uautorisert tilgang er ikke beskyttet med flerfaktorautentisering.",
      descriptionEn: "Unauthorized access is not protected by multi-factor authentication.",
      severity: "high",
      controlId: "mfa",
    });
  }

  const patchCtrl = controls.find(c => c.id === "patching");
  if (patchCtrl?.status === "fail") {
    findings.push({
      title: "OS ikke oppdatert",
      titleEn: "OS not patched",
      description: "Kjente sårbarheter kan utnyttes av angripere.",
      descriptionEn: "Known vulnerabilities may be exploited by attackers.",
      severity: "high",
      controlId: "patching",
    });
  } else if (patchCtrl?.status === "warn") {
    findings.push({
      title: "OS-oppdatering delvis ufullstendig",
      titleEn: "OS patching partially incomplete",
      description: "Oppdateringer er eldre enn 30 dager.",
      descriptionEn: "Patches are older than 30 days.",
      severity: "medium",
      controlId: "patching",
    });
  }

  const backupCtrl = controls.find(c => c.id === "backup");
  if (backupCtrl?.status === "fail") {
    findings.push({
      title: "Ingen backup konfigurert",
      titleEn: "No backup configured",
      description: "Data kan gå tapt ved enhetsfeil eller angrep.",
      descriptionEn: "Data may be lost in case of device failure or attack.",
      severity: "medium",
      controlId: "backup",
    });
  }

  const criticals = findings.filter(f => f.severity === "critical");
  const highs = findings.filter(f => f.severity === "high");
  const mediums = findings.filter(f => f.severity === "medium");

  const handleFindingClick = (finding: RiskFinding) => {
    setSelectedFinding(finding);
    setDialogOpen(true);
  };

  const selectedControl = selectedFinding
    ? controls.find(c => c.id === selectedFinding.controlId) || null
    : null;

  if (findings.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {isNb ? "Ingen kritiske funn" : "No critical findings"}
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                {isNb ? "Kritiske funn" : "Critical Findings"}
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {isNb ? "Klikk for å håndtere" : "Click to remediate"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 p-0">
            {[...criticals, ...highs, ...mediums].map((f, idx) => {
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
                <button
                  key={idx}
                  onClick={() => handleFindingClick(f)}
                  className={`w-full flex items-start gap-3 px-5 py-3 border-b last:border-b-0 ${sevColor} text-left hover:brightness-95 transition-all cursor-pointer group`}
                >
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${textColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${textColor}`}>
                        {isNb ? f.title : f.titleEn}
                      </span>
                      <Badge variant={badgeVariant} className="text-[9px] uppercase">
                        {f.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      → {isNb ? f.description : f.descriptionEn}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <FindingRemediationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        finding={selectedFinding}
        control={selectedControl}
      />
    </>
  );
}
