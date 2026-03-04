import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle, Shield, Info } from "lucide-react";

interface CheckItem {
  id: string;
  label: string;
  isoRef: string;
  description: string;
  check: (meta: Record<string, any>, asset: Record<string, any>) => "pass" | "fail" | "warn";
  recommendation: string;
}

const ISO_CHECKS: CheckItem[] = [
  {
    id: "encryption",
    label: "Diskkryptering aktivert",
    isoRef: "A.8.1 / A.7.10",
    description: "Lagrede data skal beskyttes med kryptering for å forhindre uautorisert tilgang ved tap eller tyveri.",
    check: (m) => m.encryption ? "pass" : "fail",
    recommendation: "Aktiver BitLocker (Windows), FileVault (macOS) eller LUKS (Linux).",
  },
  {
    id: "mdm",
    label: "MDM / Endpoint management",
    isoRef: "A.8.1",
    description: "Enheten skal administreres sentralt via et MDM-system for å sikre konfigurasjonskontroll.",
    check: (m) => m.mdm ? "pass" : "fail",
    recommendation: "Registrer enheten i Microsoft Intune, Jamf eller tilsvarende MDM-løsning.",
  },
  {
    id: "antivirus",
    label: "Antivirus / EDR aktiv",
    isoRef: "A.8.7",
    description: "Enheten skal ha aktivt antivirus- eller EDR-verktøy for å oppdage og forhindre skadevare.",
    check: (m) => {
      if (!m.antivirus) return "fail";
      if (m.antivirus === "utgått") return "warn";
      return "pass";
    },
    recommendation: "Installer og aktiver en EDR-løsning (f.eks. Microsoft Defender for Endpoint, CrowdStrike).",
  },
  {
    id: "patching",
    label: "OS oppdatert (< 30 dager)",
    isoRef: "A.8.8",
    description: "Operativsystemet bør ha sikkerhetsoppdateringer installert innen 30 dager etter utgivelse.",
    check: (m) => {
      if (!m.last_patch_date) return "fail";
      const daysSince = Math.floor((Date.now() - new Date(m.last_patch_date).getTime()) / 86400000);
      if (daysSince <= 30) return "pass";
      if (daysSince <= 60) return "warn";
      return "fail";
    },
    recommendation: "Konfigurer automatisk oppdatering eller planlegg månedlig patchvindu.",
  },
  {
    id: "backup",
    label: "Backup konfigurert",
    isoRef: "A.8.13",
    description: "Kritiske data på enheten skal sikkerhetskopieres regelmessig.",
    check: (m) => m.backup ? "pass" : "fail",
    recommendation: "Sett opp automatisk backup til skylagring eller sentral NAS.",
  },
  {
    id: "location",
    label: "Fysisk plassering dokumentert",
    isoRef: "A.7.9",
    description: "Plasseringen til enheten skal være dokumentert for å sikre fysisk tilgangskontroll.",
    check: (m) => m.location ? "pass" : "fail",
    recommendation: "Registrer enhetens plassering (kontor, serverrom, hjemmekontor etc.).",
  },
  {
    id: "asset_manager",
    label: "Ansvarlig person tilordnet",
    isoRef: "A.8.1",
    description: "Enheten skal ha en definert ansvarlig person for drift og sikkerhet.",
    check: (_m, a) => a.asset_manager ? "pass" : "fail",
    recommendation: "Tilordne en ansvarlig person i enhetens profil.",
  },
  {
    id: "lifecycle",
    label: "Livssyklusstatus definert",
    isoRef: "A.7.14",
    description: "Enheten skal ha en definert livssyklusstatus for å sikre korrekt avhending og gjenbruk.",
    check: (_m, a) => a.lifecycle_status && a.lifecycle_status !== "unknown" ? "pass" : "fail",
    recommendation: "Sett livssyklusstatus til aktiv, planlagt utfaset eller avhendet.",
  },
];

const statusIcon = (s: "pass" | "fail" | "warn") => {
  if (s === "pass") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (s === "warn") return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-destructive" />;
};

interface Props {
  assetId: string;
  metadata: Record<string, any>;
  asset: Record<string, any>;
}

export function DeviceComplianceTab({ metadata, asset }: Props) {
  const results = useMemo(() => {
    return ISO_CHECKS.map((c) => ({
      ...c,
      result: c.check(metadata || {}, asset || {}),
    }));
  }, [metadata, asset]);

  const passCount = results.filter((r) => r.result === "pass").length;
  const score = Math.round((passCount / results.length) * 100);

  const scoreColor =
    score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-destructive";

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              ISO 27001 Enhetssamsvar
            </CardTitle>
            <Badge variant={score >= 80 ? "default" : score >= 50 ? "secondary" : "destructive"}>
              {score >= 80 ? "Tilfredsstillende" : score >= 50 ? "Delvis" : "Kritisk"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className={`text-3xl font-bold ${scoreColor}`}>{score}%</span>
            <div className="flex-1">
              <Progress value={score} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {passCount} av {results.length} kontrollpunkter oppfylt
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Kontrollpunkter – Annex A</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-0">
          {results.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 px-6 py-3 border-b last:border-b-0"
            >
              <div className="mt-0.5">{statusIcon(item.result)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{item.label}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                    {item.isoRef}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                {item.result !== "pass" && (
                  <div className="flex items-start gap-1.5 mt-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{item.recommendation}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
