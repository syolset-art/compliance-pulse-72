import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { ControlsSummaryCard } from "@/components/trust-controls/ControlsSummaryCard";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";

interface ValidationTabProps {
  assetId: string;
}

type ComplianceView = "framework" | "control_area";

const FRAMEWORK_DATA = [
  { key: "GDPR", baseOffset: 15 },
  { key: "NIS2", baseOffset: -10 },
  { key: "CRA", baseOffset: -25 },
  { key: "AIAACT", baseOffset: -45 },
];

const AREA_LABELS: Record<string, { en: string; nb: string }> = {
  governance: { en: "Governance", nb: "Styring" },
  risk_compliance: { en: "Operations", nb: "Drift" },
  security_posture: { en: "Identity & Access", nb: "Identitet og tilgang" },
  supplier_governance: { en: "Supplier & Ecosystem", nb: "Leverandør og økosystem" },
};

export const ValidationTab = ({ assetId }: ValidationTabProps) => {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<ComplianceView>("framework");
  const evaluation = useTrustControlEvaluation(assetId);

  const lang = i18n.language === "nb" ? "nb" : "en";

  // Framework scores (demo/fallback)
  const baseScore = 45;
  const frameworkItems = FRAMEWORK_DATA.map((f) => {
    const score = Math.max(Math.min(baseScore + f.baseOffset, 100), 0);
    const status = score >= 80 ? "compliant" : score >= 30 ? "in_progress" : "non_compliant";
    return { label: f.key, score, status };
  });

  // Control area scores from real evaluation
  const areaItems = evaluation
    ? (Object.keys(AREA_LABELS) as Array<keyof typeof AREA_LABELS>).map((area) => ({
        label: AREA_LABELS[area][lang],
        score: evaluation.areaScore(area as any),
        status: evaluation.areaScore(area as any) >= 80 ? "compliant" : evaluation.areaScore(area as any) >= 30 ? "in_progress" : "non_compliant",
      }))
    : [];

  const items = view === "framework" ? frameworkItems : areaItems;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "non_compliant":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-destructive";
  };

  return (
    <div className="space-y-6">
      <ControlsSummaryCard assetId={assetId} />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {view === "framework"
                ? (lang === "nb" ? "Etterlevelse per rammeverk" : "Compliance by Framework")
                : (lang === "nb" ? "Etterlevelse per kontrollområde" : "Compliance by Control Area")}
            </CardTitle>
            <div className="inline-flex rounded-md bg-muted p-0.5 text-xs">
              <button
                onClick={() => setView("framework")}
                className={`px-3 py-1 rounded-sm transition-colors ${
                  view === "framework"
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang === "nb" ? "Rammeverk" : "Framework"}
              </button>
              <button
                onClick={() => setView("control_area")}
                className={`px-3 py-1 rounded-sm transition-colors ${
                  view === "control_area"
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang === "nb" ? "Kontrollområder" : "Control Areas"}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{item.score}%</span>
                </div>
                <Progress value={item.score} className={`h-2 ${getBarColor(item.score)}`} />
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {lang === "nb" ? "Ingen data tilgjengelig" : "No data available"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
