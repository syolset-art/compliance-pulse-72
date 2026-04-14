import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { ComplianceShield } from "@/components/dashboard-v2/ComplianceShield";
import { KPIRow } from "@/components/dashboard-v2/KPIRow";
import { AggregatedMaturityWidget } from "@/components/dashboard-v2/AggregatedMaturityWidget";
import { RecentActivityFeed } from "@/components/dashboard-v2/RecentActivityFeed";
import { NextActionCards } from "@/components/dashboard-v2/NextActionCards";
import { RiskAndCalendarSection } from "@/components/dashboard-v2/RiskAndCalendarSection";
import { SecurityBreachWidget } from "@/components/widgets/SecurityBreachWidget";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { useUserTasks } from "@/hooks/useUserTasks";

const MATURITY_LEVELS = [
  { min: 0, key: "initial", label_no: "Startfase", label_en: "Initial" },
  { min: 20, key: "defined", label_no: "Definert", label_en: "Defined" },
  { min: 40, key: "implementing", label_no: "Implementerer", label_en: "Implementing" },
  { min: 60, key: "measured", label_no: "Målt", label_en: "Measured" },
  { min: 80, key: "optimized", label_no: "Optimalisert", label_en: "Optimized" },
];

const FOCUS_AREA_LABELS: Record<string, { label_no: string; label_en: string }> = {
  governance: { label_no: "Styring", label_en: "Governance" },
  operations: { label_no: "Drift og sikkerhet", label_en: "Operations & Security" },
  identity_access: { label_no: "Identitet og tilgang", label_en: "Identity & Access" },
  supplier_ecosystem: { label_no: "Tredjepartstyring", label_en: "Third-Party Management" },
  privacy_data: { label_no: "Personvern og data", label_en: "Privacy & Data" },
};

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function DashboardV2() {
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";
  const { requirements, grouped, stats } = useComplianceRequirements();
  const { tasks: userTasks } = useUserTasks();

  const score = stats.progressPercent;

  const level = useMemo(() => {
    const l = [...MATURITY_LEVELS].reverse().find((l) => score >= l.min);
    return l || MATURITY_LEVELS[0];
  }, [score]);

  const focusAreas = useMemo(() => {
    const byDomain = stats.byDomainArea || {};
    return ["governance", "operations", "identity_access", "supplier_ecosystem", "privacy_data"].map((key) => ({
      label_no: FOCUS_AREA_LABELS[key]?.label_no || key,
      label_en: FOCUS_AREA_LABELS[key]?.label_en || key,
      percent: byDomain[key]?.score || 0,
    }));
  }, [stats.byDomainArea]);

  // Merge compliance actions + user tasks, sort by priority
  const mergedActions = useMemo(() => {
    const complianceActions = grouped.incompleteManual.map((a) => ({
      ...a,
      _source: "compliance" as const,
    }));

    const openUserTasks = userTasks
      .filter((t) => t.status !== "done")
      .map((t) => ({
        framework_id: "user",
        requirement_id: t.id,
        name: t.title,
        name_no: t.title,
        category: "organizational" as const,
        priority: "medium" as const,
        status: (t.status === "done" ? "completed" : "not_started") as "completed" | "not_started",
        description: t.description,
        description_no: t.description,
        domain: "security" as const,
        agent_capability: "manual" as const,
        sort_order: 0,
        is_active: true,
        is_relevant: true,
        created_at: t.created_at,
        updated_at: t.updated_at,
        completed_at: null,
        completed_by: null,
        maturity_level: null,
        progress_percent: 0,
        is_ai_handling: false,
        id: t.id,
        _source: "user" as const,
      }));

    const all = [...complianceActions, ...openUserTasks];
    all.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4));
    return all.slice(0, 5);
  }, [grouped.incompleteManual, userTasks]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="container max-w-5xl mx-auto space-y-5">
          {/* Header */}
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard
          </h1>

          {/* Zone 1: Shield + KPI */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
            <ComplianceShield
              score={score}
              levelLabel_no={level.label_no}
              levelLabel_en={level.label_en}
              assessed={stats.overallScore?.assessed || 0}
              total={stats.overallScore?.total || 0}
              avgMaturity={stats.overallScore?.avgMaturity || 0}
            />
            <KPIRow />
          </div>

          {/* Zone 2: Aggregated Maturity + Activity */}
          <AggregatedMaturityWidget />
          <div className="grid grid-cols-1 gap-4">
            <RecentActivityFeed />
          </div>

          {/* Zone 4: Actions */}
          <NextActionCards actions={mergedActions} />

          {/* Zone 5: Security + Risk/Calendar */}
          <SecurityBreachWidget />
          <RiskAndCalendarSection requirements={requirements} />
        </div>
      </main>
    </div>
  );
}
