import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TrendingUp, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { cn } from "@/lib/utils";

const FOCUS_AREAS = [
  { key: "governance", label_no: "Styring", label_en: "Governance" },
  { key: "operations", label_no: "Drift og bruk", label_en: "Operations & Use" },
  { key: "identity_access", label_no: "Identitet og tilgang", label_en: "Identity & Access" },
  { key: "supplier_ecosystem", label_no: "Leverandører og økosystem", label_en: "Vendors & Ecosystem" },
  { key: "privacy_data", label_no: "Personvern og datahåndtering", label_en: "Privacy & Data" },
];

function scoreColor(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

export function DashboardOverallMaturity() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const navigate = useNavigate();
  const { stats } = useComplianceRequirements();

  const overall = Math.round(stats.overallScore?.score || 0);
  const byDomain = stats.byDomainArea || {};

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          {isNb ? "Samlet modenhetsscore" : "Overall maturity score"}
        </h3>
      </div>

      <div className="text-5xl font-bold text-foreground mb-5 tracking-tight">
        {overall}%
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
        {FOCUS_AREAS.map((area) => {
          const score = Math.round(byDomain[area.key]?.score || 0);
          return (
            <div key={area.key} className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {isNb ? area.label_no : area.label_en}
              </p>
              <p className={cn("text-base font-bold tabular-nums", scoreColor(score))}>
                {score}%
              </p>
              <Progress value={score} className="h-1 [&>div]:bg-primary" />
            </div>
          );
        })}
        <div className="hidden lg:flex items-end justify-end">
          <button
            onClick={() => navigate("/reports/compliance")}
            className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1 font-medium"
          >
            {isNb ? "Se detaljer per område" : "See details per area"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex justify-end mt-4 lg:hidden">
        <button
          onClick={() => navigate("/reports/compliance")}
          className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1 font-medium"
        >
          {isNb ? "Se detaljer per område" : "See details per area"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
