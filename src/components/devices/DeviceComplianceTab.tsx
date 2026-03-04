import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle, Shield, Info, BrainCircuit, ShieldAlert, ShieldCheck } from "lucide-react";

interface LLMUsageEntry {
  name: string;
  provider: string;
  accessLevel: "unrestricted" | "managed" | "blocked";
  sensitiveDataRisk: "high" | "medium" | "low";
}

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
  {
    id: "llm_secured",
    label: "LLM-tilgang sikret",
    isoRef: "A.8.11 / A.8.12",
    description: "Enheter med tilgang til språkmodeller (LLM) skal ha DLP-kontroll for å forhindre deling av sensitiv informasjon.",
    check: (m) => {
      const llm = m.llm_usage as LLMUsageEntry[] | undefined;
      if (!llm || llm.length === 0) return "pass"; // no LLM = no risk
      const hasUnrestricted = llm.some((l) => l.accessLevel === "unrestricted");
      if (hasUnrestricted) return "fail";
      return "pass";
    },
    recommendation: "Aktiver AI/LLM DLP-tjeneste via sikkerhetstjenestekatalogen (Leverandører → Sikkerhetstjenester).",
  },
];

const statusIcon = (s: "pass" | "fail" | "warn") => {
  if (s === "pass") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (s === "warn") return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-destructive" />;
};

const accessLevelConfig: Record<string, { label: string; color: string; icon: typeof ShieldCheck }> = {
  managed: { label: "Administrert (DLP)", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", icon: ShieldCheck },
  unrestricted: { label: "Ubegrenset", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", icon: ShieldAlert },
  blocked: { label: "Blokkert", color: "bg-muted text-muted-foreground", icon: Shield },
};

const riskColors: Record<string, string> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
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

  const llmUsage = (metadata?.llm_usage || []) as LLMUsageEntry[];

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

      {/* LLM Usage Section */}
      {llmUsage.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BrainCircuit className="h-5 w-5 text-fuchsia-500" />
              Språkmodeller i bruk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {llmUsage.map((llm, idx) => {
              const config = accessLevelConfig[llm.accessLevel] || accessLevelConfig.unrestricted;
              const IconComp = config.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className={`rounded-full p-1.5 ${config.color}`}>
                    <IconComp className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{llm.name}</span>
                      <span className="text-xs text-muted-foreground">{llm.provider}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                        {config.label}
                      </span>
                      <Badge variant={riskColors[llm.sensitiveDataRisk] as any} className="text-[10px]">
                        Risiko: {llm.sensitiveDataRisk === "high" ? "Høy" : llm.sensitiveDataRisk === "medium" ? "Middels" : "Lav"}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
            {llmUsage.some((l) => l.accessLevel === "unrestricted") && (
              <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Enheten har ubegrenset tilgang til språkmodeller uten DLP-beskyttelse.
                  Sensitiv informasjon kan deles med tredjeparter. Aktiver <strong>AI/LLM-sikkerhet</strong> via sikkerhetstjenestekatalogen.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
