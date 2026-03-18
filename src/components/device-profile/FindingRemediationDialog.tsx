import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle2, TrendingUp, Clock, ShoppingCart, Save, Zap } from "lucide-react";
import { toast } from "sonner";
import { type DeviceControl } from "./DeviceTrustProfile";

interface FindingRemediationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finding: {
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
    severity: "critical" | "high" | "medium";
    controlId: string;
  } | null;
  control: DeviceControl | null;
}

interface RemediationStep {
  id: string;
  label: string;
  labelEn: string;
  checked: boolean;
}

function getRemediationSteps(controlId: string): RemediationStep[] {
  const steps: Record<string, { label: string; labelEn: string }[]> = {
    encryption: [
      { label: "Verifiser at BitLocker / FileVault er tilgjengelig", labelEn: "Verify BitLocker / FileVault is available" },
      { label: "Aktiver diskkryptering på enheten", labelEn: "Enable disk encryption on the device" },
      { label: "Lagre gjenopprettingsnøkkel trygt (f.eks. i MDM)", labelEn: "Store recovery key securely (e.g. in MDM)" },
      { label: "Bekreft at kryptering er fullført", labelEn: "Confirm encryption is complete" },
    ],
    edr: [
      { label: "Velg EDR-løsning (CrowdStrike, Defender, etc.)", labelEn: "Select EDR solution (CrowdStrike, Defender, etc.)" },
      { label: "Installer EDR-agent på enheten", labelEn: "Install EDR agent on the device" },
      { label: "Verifiser at agenten rapporterer til konsoll", labelEn: "Verify agent reports to console" },
      { label: "Konfigurer varslingsregler", labelEn: "Configure alerting rules" },
    ],
    mdm: [
      { label: "Registrer enheten i MDM-plattform (Intune, Jamf)", labelEn: "Enroll device in MDM platform (Intune, Jamf)" },
      { label: "Konfigurer compliance-policyer", labelEn: "Configure compliance policies" },
      { label: "Aktiver fjernsletting og fjernlås", labelEn: "Enable remote wipe and remote lock" },
      { label: "Verifiser at enheten er compliant", labelEn: "Verify device is compliant" },
    ],
    patching: [
      { label: "Sjekk gjeldende OS-versjon", labelEn: "Check current OS version" },
      { label: "Installer tilgjengelige oppdateringer", labelEn: "Install available updates" },
      { label: "Konfigurer automatisk oppdatering", labelEn: "Configure automatic updates" },
      { label: "Verifiser at oppdateringen er vellykket", labelEn: "Verify update was successful" },
    ],
    backup: [
      { label: "Velg backup-løsning (sky eller lokal NAS)", labelEn: "Choose backup solution (cloud or local NAS)" },
      { label: "Konfigurer automatisk backup-plan", labelEn: "Set up automatic backup schedule" },
      { label: "Kjør en første full backup", labelEn: "Run an initial full backup" },
      { label: "Test gjenoppretting av en fil", labelEn: "Test restoring a file" },
    ],
    mfa: [
      { label: "Aktiver MFA i identitetsleverandøren", labelEn: "Enable MFA in identity provider" },
      { label: "Registrer enheten med MFA-metode", labelEn: "Register device with MFA method" },
      { label: "Test at MFA kreves ved innlogging", labelEn: "Test that MFA is required at login" },
    ],
    location: [
      { label: "Registrer fysisk plassering i systemet", labelEn: "Register physical location in the system" },
      { label: "Merk enheten med asset-tag", labelEn: "Label device with asset tag" },
    ],
    asset_manager: [
      { label: "Identifiser ansvarlig person", labelEn: "Identify responsible person" },
      { label: "Oppdater asset-profilen med ansvarlig", labelEn: "Update asset profile with responsible person" },
    ],
    lifecycle: [
      { label: "Vurder enhetens tilstand og alder", labelEn: "Assess device condition and age" },
      { label: "Sett riktig livssyklusstatus", labelEn: "Set correct lifecycle status" },
    ],
    user_linked: [
      { label: "Identifiser bruker som bruker enheten", labelEn: "Identify the user of the device" },
      { label: "Koble bruker til enheten i systemet", labelEn: "Link user to device in the system" },
    ],
  };

  return (steps[controlId] || [
    { label: "Vurder tiltak", labelEn: "Assess the action needed" },
    { label: "Utfør tiltak", labelEn: "Perform the action" },
    { label: "Dokumenter resultatet", labelEn: "Document the result" },
  ]).map((s, i) => ({ ...s, id: `step-${i}`, checked: false }));
}

export function FindingRemediationDialog({
  open,
  onOpenChange,
  finding,
  control,
}: FindingRemediationDialogProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [steps, setSteps] = useState<RemediationStep[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  // Reset state when finding changes
  const [lastFindingId, setLastFindingId] = useState<string | null>(null);
  if (finding && finding.controlId !== lastFindingId) {
    setLastFindingId(finding.controlId);
    setSteps(getRemediationSteps(finding.controlId));
    setNote("");
    setSaved(false);
  }

  if (!finding || !control) return null;

  const checkedCount = steps.filter(s => s.checked).length;
  const progress = steps.length > 0 ? Math.round((checkedCount / steps.length) * 100) : 0;

  const toggleStep = (id: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    toast.success(isNb ? "Tiltaksplan lagret" : "Remediation plan saved");
  };

  const sevColor = finding.severity === "critical"
    ? "text-destructive"
    : finding.severity === "high"
      ? "text-destructive"
      : "text-warning";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className={`h-5 w-5 ${sevColor}`} />
            {isNb ? finding.title : finding.titleEn}
          </DialogTitle>
        </DialogHeader>

        {/* Finding context */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={finding.severity === "medium" ? "secondary" : "destructive"}
              className="text-[10px] uppercase"
            >
              {finding.severity}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono">
              {control.isoRef}
            </Badge>
            {control.scoreImpact > 0 && (
              <Badge variant="outline" className="text-[10px] gap-1 text-success border-success/30">
                <TrendingUp className="h-3 w-3" />
                +{control.scoreImpact}% Trust Score
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {isNb ? finding.description : finding.descriptionEn}
          </p>

          {/* Recommendation */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isNb ? "Anbefalt tiltak" : "Recommended action"}
            </p>
            <p className="text-sm font-medium">
              {isNb ? control.recommendation : control.recommendationEn}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isNb ? control.fixEffort : control.fixEffortEn}
              </span>
              {control.serviceAvailable && (
                <span className="flex items-center gap-1 text-primary">
                  <ShoppingCart className="h-3 w-3" />
                  {isNb ? "Tilgjengelig som tjeneste" : "Available as service"}
                </span>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">
                {isNb ? "Fremgang" : "Progress"}
              </span>
              <span className={`font-semibold tabular-nums ${progress === 100 ? "text-success" : "text-muted-foreground"}`}>
                {checkedCount}/{steps.length} — {progress}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {isNb ? "Sjekkliste" : "Checklist"}
            </p>
            {steps.map((step) => (
              <label
                key={step.id}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  step.checked
                    ? "bg-success/5 border-success/20"
                    : "hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={step.checked}
                  onCheckedChange={() => toggleStep(step.id)}
                  className="mt-0.5"
                />
                <span className={`text-sm ${step.checked ? "line-through text-muted-foreground" : ""}`}>
                  {isNb ? step.label : step.labelEn}
                </span>
                {step.checked && (
                  <CheckCircle2 className="h-4 w-4 text-success ml-auto shrink-0" />
                )}
              </label>
            ))}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isNb ? "Notat (valgfritt)" : "Note (optional)"}
            </p>
            <Textarea
              placeholder={isNb ? "Beskriv hva som er gjort, eller legg til kommentar…" : "Describe what was done, or add a comment…"}
              value={note}
              onChange={(e) => { setNote(e.target.value); setSaved(false); }}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} className="gap-1.5 flex-1" disabled={saved && checkedCount === 0}>
              <Save className="h-4 w-4" />
              {saved
                ? (isNb ? "Lagret ✓" : "Saved ✓")
                : (isNb ? "Lagre tiltaksplan" : "Save remediation plan")
              }
            </Button>
            {control.serviceAvailable && (
              <Button variant="outline" className="gap-1.5">
                <Zap className="h-4 w-4" />
                {isNb ? "Aktiver tjeneste" : "Activate service"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
