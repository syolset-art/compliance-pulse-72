import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TrendingUp, ArrowRight, ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { cn } from "@/lib/utils";
import { maturityTextClass, maturityProgressClass, maturityLabelNb, getMaturityLevel } from "@/lib/maturityLevel";
import { MaturityIndicator } from "@/components/shared/MaturityIndicator";

const FOCUS_AREAS = [
  { key: "governance", label_no: "Styring", label_en: "Governance" },
  { key: "operations", label_no: "Drift og bruk", label_en: "Operations & Use" },
  { key: "identityAccess", label_no: "Identitet og tilgang", label_en: "Identity & Access" },
  { key: "vendor", label_no: "Leverandører og økosystem", label_en: "Vendors & Ecosystem" },
  { key: "privacy", label_no: "Personvern og datahåndtering", label_en: "Privacy & Data" },
];

// Demo-gulv: sikrer at widgeten viser et variert mix av høy/middels/lav modenhet
// (grønn/gul/rød) selv når underliggende data fortsatt er tynn.
const PILLAR_DEMO_FLOOR: Record<string, number> = {
  governance: 78,           // høy → grønn
  operations: 55,           // middels → orange
  identityAccess: 42,      // middels → orange
  vendor: 50,   // middels → orange
  privacy: 80,         // høy → grønn
};

function applyFloor(key: string, raw: number) {
  return Math.max(raw, PILLAR_DEMO_FLOOR[key] ?? 0);
}

const scoreColor = maturityTextClass;
const scoreProgressClass = maturityProgressClass;


export function DashboardOverallMaturity() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const navigate = useNavigate();
  const { stats } = useComplianceRequirements();

  const overall = Math.round(stats.overallScore?.score || 0);
  const byDomain = stats.byDomainArea || {};

  // Beregn aggregert score med demo-gulv så samlescore matcher kortene under.
  const flooredScores = FOCUS_AREAS.map((a) => applyFloor(a.key, Math.round(byDomain[a.key]?.score || 0)));
  const aggregatedOverall = Math.round(
    flooredScores.reduce((s, v) => s + v, 0) / Math.max(1, flooredScores.length)
  );
  const displayOverall = Math.max(overall, aggregatedOverall);


  const { data: frameworkCount = 0 } = useQuery({
    queryKey: ["dashboard-active-frameworks-count"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("selected_frameworks")
        .select("id", { count: "exact" })
        .eq("is_selected", true);
      if (error) return 0;
      return (data || []).length;
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {isNb ? "Samlet modenhet" : "Overall maturity"}
          </h3>
        </div>
        <button
          onClick={() => navigate("/regulations")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-foreground tabular-nums">{frameworkCount}</span>
          <span>
            {isNb
              ? `aktive regelverk${frameworkCount === 1 ? "" : ""}`
              : `active framework${frameworkCount === 1 ? "" : "s"}`}
          </span>
        </button>
      </div>

      <div className="mb-5 flex items-center gap-2">
        <span className={cn("text-4xl sm:text-5xl font-bold tracking-tight", scoreColor(displayOverall))}>
          {maturityLabelNb(getMaturityLevel(displayOverall))}
        </span>
        <MaturityIndicator score={displayOverall} variant="badge" showInfo className="mt-2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
        {FOCUS_AREAS.map((area) => {
          const score = applyFloor(area.key, Math.round(byDomain[area.key]?.score || 0));

          return (
            <div key={area.key} className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                {isNb ? area.label_no : area.label_en}
              </p>
              <p className={cn("text-lg font-bold", scoreColor(score))}>
                {maturityLabelNb(getMaturityLevel(score))}
              </p>
              <Progress value={score} className={cn("h-2", scoreProgressClass(score))} />
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
