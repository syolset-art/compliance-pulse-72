import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp, XCircle, AlertTriangle, ArrowLeft } from "lucide-react";

import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";

interface ValidationTabProps {
  assetId: string;
}

type ComplianceView = "framework" | "control_area";

// Framework definitions with related control keys and GDPR-relevant info
const FRAMEWORK_ITEMS = [
  {
    key: "GDPR",
    label: "GDPR",
    descEn: "General Data Protection Regulation",
    descNb: "Personvernforordningen",
    baseOffset: 15,
    relatedControlKeys: ["dpa_verified", "sub_processors_disclosed", "documentation_available", "description_defined", "owner_assigned"],
    gapItems: [
      { en: "Data processing agreement not verified", nb: "Databehandleravtale ikke verifisert", severity: "high" as const },
      { en: "Sub-processors not disclosed", nb: "Underleverandører ikke oppgitt", severity: "high" as const },
      { en: "DPIA documentation incomplete", nb: "DPIA-dokumentasjon ufullstendig", severity: "medium" as const },
    ],
  },
  {
    key: "NIS2",
    label: "NIS2",
    descEn: "Network and Information Security Directive",
    descNb: "Nettverks- og informasjonssikkerhetsdirektivet",
    baseOffset: -10,
    relatedControlKeys: ["risk_assessment", "security_logging", "backup_configured", "incident_reporting"],
    gapItems: [
      { en: "Risk assessment not performed", nb: "Risikovurdering ikke utført", severity: "high" as const },
      { en: "Security logging not enabled", nb: "Sikkerhetslogging ikke aktivert", severity: "medium" as const },
      { en: "Incident reporting process undefined", nb: "Hendelseshåndtering ikke definert", severity: "medium" as const },
    ],
  },
  {
    key: "CRA",
    label: "CRA",
    descEn: "Cyber Resilience Act",
    descNb: "Cyberresiliensloven",
    baseOffset: -25,
    relatedControlKeys: ["patch_management", "encryption_enabled", "backup_configured", "vendor_security_review"],
    gapItems: [
      { en: "Vulnerability management not established", nb: "Sårbarhetsstyring ikke etablert", severity: "high" as const },
      { en: "Secure development lifecycle missing", nb: "Sikker utviklingssyklus mangler", severity: "high" as const },
    ],
  },
  {
    key: "AIAACT",
    label: "AI Act",
    descEn: "EU Artificial Intelligence Act",
    descNb: "EUs kunstig intelligens-forordning",
    baseOffset: -45,
    relatedControlKeys: [],
    gapItems: [
      { en: "AI usage assessment not started", nb: "AI-bruksvurdering ikke startet", severity: "high" as const },
      { en: "AI risk classification required", nb: "AI-risikoklassifisering påkrevd", severity: "high" as const },
    ],
  },
];

const AREA_DEFS = [
  { key: "governance", labelEn: "Governance", labelNb: "Styring", descEn: "Ownership, accountability and documentation", descNb: "Eierskap, ansvar og dokumentasjon" },
  { key: "risk_compliance", labelEn: "Operations & Security", labelNb: "Drift og sikkerhet", descEn: "Risk assessment and operational processes", descNb: "Risikovurdering og driftsprosesser" },
  { key: "security_posture", labelEn: "Privacy & Data Handling", labelNb: "Personvern og datahåndtering", descEn: "Privacy, processing records and data subject rights", descNb: "Personvern, behandlingsoversikt og registrertes rettigheter" },
  { key: "supplier_governance", labelEn: "Third-Party & Value Chain", labelNb: "Tredjepartstyring og verdikjede", descEn: "Third-party oversight and supply chain controls", descNb: "Tredjeparts tilsyn og leverandørkontroll" },
] as const;

export const ValidationTab = ({ assetId }: ValidationTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [view, setView] = useState<ComplianceView>("framework");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const evaluation = useTrustControlEvaluation(assetId);

  const baseScore = 45;

  const frameworkItems = FRAMEWORK_ITEMS.map(f => {
    const score = Math.max(Math.min(baseScore + f.baseOffset, 100), 0);
    const status = score >= 80 ? "compliant" : score >= 30 ? "in_progress" : "non_compliant";
    return { ...f, score, status };
  });

  const areaItems = AREA_DEFS.map(a => {
    const score = evaluation ? evaluation.areaScore(a.key as any) : 0;
    const status = score >= 80 ? "compliant" : score >= 30 ? "in_progress" : "non_compliant";
    const controls = evaluation ? evaluation.allControls.filter(c => (c as any).area === a.key) : [];
    const missing = controls.filter(c => c.status === "missing");
    const partial = controls.filter(c => c.status === "partial");
    const gapItems = [
      ...missing.map(c => ({ en: c.labelEn, nb: c.labelNb, severity: "high" as const })),
      ...partial.map(c => ({ en: c.labelEn + " (incomplete)", nb: c.labelNb + " (ufullstendig)", severity: "medium" as const })),
    ];
    return { ...a, score, status, gapItems, key: a.key, label: isNb ? a.labelNb : a.labelEn, descEn: a.descEn, descNb: a.descNb };
  });

  const items = view === "framework" ? frameworkItems : areaItems;
  const selectedItem = items.find(i => i.key === selectedKey);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant": return <CheckCircle className="h-3.5 w-3.5 text-success" />;
      case "non_compliant": return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      default: return <Clock className="h-3.5 w-3.5 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant": return <Badge className="bg-success/10 text-success border-success/20 text-[13px]">{isNb ? "Oppfylt" : "Compliant"}</Badge>;
      case "non_compliant": return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[13px]">{isNb ? "Ikke oppfylt" : "Non-compliant"}</Badge>;
      default: return <Badge className="bg-warning/10 text-warning border-warning/20 text-[13px]">{isNb ? "Pågår" : "In progress"}</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Compliance Card with view switcher */}
      <Card>
        <CardHeader className="pb-0 pt-4 px-5">
          <div className="flex items-center justify-between">
            <div>
              {selectedItem ? (
                <button
                  onClick={() => setSelectedKey(null)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  {isNb ? "Tilbake til oversikt" : "Back to overview"}
                </button>
              ) : null}
              <h3 className="text-sm font-semibold text-foreground">
                {selectedItem
                  ? (view === "framework" ? (selectedItem as any).label : (isNb ? (selectedItem as any).labelNb : (selectedItem as any).labelEn))
                  : view === "framework"
                    ? (isNb ? "Etterlevelse per rammeverk" : "Compliance by Framework")
                    : (isNb ? "Etterlevelse per kontrollområde" : "Compliance by Control Area")}
              </h3>
              {selectedItem && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isNb ? (selectedItem as any).descNb : (selectedItem as any).descEn}
                </p>
              )}
            </div>
            {!selectedItem && (
              <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs shrink-0">
                <button
                  onClick={() => { setView("framework"); setSelectedKey(null); }}
                  className={`px-3 py-1.5 rounded-md transition-colors ${view === "framework" ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {isNb ? "Rammeverk" : "Framework"}
                </button>
                <button
                  onClick={() => { setView("control_area"); setSelectedKey(null); }}
                  className={`px-3 py-1.5 rounded-md transition-colors ${view === "control_area" ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {isNb ? "Kontrollområder" : "Control Areas"}
                </button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 px-5 pb-5">
          {/* ── Drill-down detail view ── */}
          {selectedItem ? (
            <div className="space-y-4">
              {/* Score summary */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/40">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{selectedItem.score}%</div>
                  <div className="text-[13px] text-muted-foreground uppercase tracking-wide">Score</div>
                </div>
                <div className="flex-1">
                  <Progress value={selectedItem.score} className="h-2 mb-1.5" />
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedItem.status)}
                    <span className="text-xs text-muted-foreground">
                      {selectedItem.gapItems.length === 0
                        ? (isNb ? "Ingen mangler funnet" : "No gaps found")
                        : `${selectedItem.gapItems.length} ${isNb ? "mangler gjenstår" : "gaps remaining"}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gaps / what's missing */}
              {selectedItem.gapItems.length > 0 ? (
                <div>
                  <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {isNb ? "Hva gjenstår" : "What's missing"}
                  </p>
                  <div className="space-y-2">
                    {selectedItem.gapItems.map((gap, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-background">
                        {gap.severity === "high"
                          ? <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                          : <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{isNb ? gap.nb : gap.en}</p>
                        </div>
                        <Badge className={`text-[13px] shrink-0 ${gap.severity === "high" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                          {gap.severity === "high" ? (isNb ? "Høy" : "High") : (isNb ? "Middels" : "Med")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm text-success font-medium">
                    {isNb ? "Ingen mangler — krav er oppfylt" : "No gaps — requirements met"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* ── List view ── */
            <div className="space-y-2">
              {items.map((item) => {
                const label = view === "framework" ? (item as any).label : (isNb ? (item as any).labelNb : (item as any).labelEn);
                const gapCount = item.gapItems.length;
                return (
                  <button
                    key={item.key}
                    onClick={() => setSelectedKey(item.key)}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-all">
                      {/* Status icon */}
                      <div className="shrink-0">{getStatusIcon(item.status)}</div>

                      {/* Label + progress */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{label}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {gapCount > 0 && (
                              <span className="text-[13px] text-destructive font-medium">
                                {gapCount} {isNb ? "mangler" : "gaps"}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground tabular-nums">{item.score}%</span>
                          </div>
                        </div>
                        <Progress value={item.score} className="h-1" />
                      </div>

                      {/* Chevron */}
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground rotate-[-90deg] shrink-0 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
