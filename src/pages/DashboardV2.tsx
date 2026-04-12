import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { ComplianceShield } from "@/components/dashboard-v2/ComplianceShield";
import { NextActionCards } from "@/components/dashboard-v2/NextActionCards";
import { RiskAndCalendarSection } from "@/components/dashboard-v2/RiskAndCalendarSection";
import { SecurityBreachWidget } from "@/components/widgets/SecurityBreachWidget";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { getISOWeek, getISOWeekYear, subWeeks } from "date-fns";

const XP_MAP: Record<string, number> = { critical: 50, high: 30, medium: 20, low: 10 };

const MATURITY_LEVELS = [
  { min: 0, key: "initial", label_no: "Startfase", label_en: "Initial" },
  { min: 20, key: "defined", label_no: "Definert", label_en: "Defined" },
  { min: 40, key: "implementing", label_no: "Implementerer", label_en: "Implementing" },
  { min: 60, key: "measured", label_no: "Målt", label_en: "Measured" },
  { min: 80, key: "optimized", label_no: "Optimalisert", label_en: "Optimized" },
];

function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  const now = new Date();
  const weekSet = new Set(
    completedDates.map((d) => {
      const date = new Date(d);
      return `${getISOWeekYear(date)}-${getISOWeek(date)}`;
    })
  );

  let streak = 0;
  for (let i = 0; i < 52; i++) {
    const checkDate = subWeeks(now, i);
    const weekKey = `${getISOWeekYear(checkDate)}-${getISOWeek(checkDate)}`;
    if (weekSet.has(weekKey)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

const REGULATION_LABELS: Record<string, { label_no: string; label_en: string }> = {
  privacy: { label_no: "Personvern", label_en: "Privacy" },
  security: { label_no: "Sikkerhet", label_en: "Security" },
  ai: { label_no: "AI", label_en: "AI" },
};

const FOCUS_AREA_LABELS: Record<string, { label_no: string; label_en: string }> = {
  governance: { label_no: "Styring", label_en: "Governance" },
  operations: { label_no: "Drift og sikkerhet", label_en: "Operations & Security" },
  identity_access: { label_no: "Personvern og datahåndtering", label_en: "Privacy & Data Handling" },
  supplier_ecosystem: { label_no: "Tredjepartstyring og verdikjede", label_en: "Third-Party & Value Chain" },
  privacy_data: { label_no: "Personvern og datahåndtering", label_en: "Privacy & Data Handling" },
};

export default function DashboardV2() {
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";
  const { requirements, grouped, stats } = useComplianceRequirements();

  // XP
  const xp = useMemo(
    () =>
      requirements
        .filter((r) => r.status === "completed")
        .reduce((sum, r) => sum + (XP_MAP[r.priority] || 0), 0),
    [requirements]
  );

  // Streak
  const streak = useMemo(() => {
    const dates = requirements
      .filter((r) => r.completed_at)
      .map((r) => r.completed_at!);
    return calculateStreak(dates);
  }, [requirements]);

  // Shield score = overall maturity-based score
  const score = stats.progressPercent;

  // Level
  const level = useMemo(() => {
    const l = [...MATURITY_LEVELS].reverse().find((l) => score >= l.min);
    return l || MATURITY_LEVELS[0];
  }, [score]);

  // Regulation domains (Privacy / Security / AI)
  const regulationDomains = useMemo(() => {
    const byReg = stats.byRegulationDomain || {};
    return ["privacy", "security", "ai"].map((key) => ({
      label_no: REGULATION_LABELS[key]?.label_no || key,
      label_en: REGULATION_LABELS[key]?.label_en || key,
      percent: byReg[key]?.score || 0,
    }));
  }, [stats.byRegulationDomain]);

  // Focus areas (Governance / Operations / Identity & Access / Supplier & Ecosystem)
  const focusAreas = useMemo(() => {
    const byDomain = stats.byDomainArea || {};
    return ["governance", "operations", "identity_access", "supplier_ecosystem", "privacy_data"].map((key) => ({
      label_no: FOCUS_AREA_LABELS[key]?.label_no || key,
      label_en: FOCUS_AREA_LABELS[key]?.label_en || key,
      percent: byDomain[key]?.score || 0,
    }));
  }, [stats.byDomainArea]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="container max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              Dashboard 2.0
            </h1>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              Beta
            </span>
          </div>

          {/* Zone 1: Shield */}
          <ComplianceShield
            score={score}
            xp={xp}
            streak={streak}
            level={level.key}
            levelLabel_no={level.label_no}
            levelLabel_en={level.label_en}
            regulationDomains={regulationDomains}
            focusAreas={focusAreas}
            assessed={stats.overallScore?.assessed || 0}
            total={stats.overallScore?.total || 0}
            avgMaturity={stats.overallScore?.avgMaturity || 0}
          />

          {/* Zone 2: Security breach feed */}
          <SecurityBreachWidget />

          {/* Zone 3: Next actions */}
          <NextActionCards actions={grouped.incompleteManual} />

          {/* Zone 4: Risk + Calendar */}
          <RiskAndCalendarSection requirements={requirements} />
        </div>
      </main>
    </div>
  );
}
