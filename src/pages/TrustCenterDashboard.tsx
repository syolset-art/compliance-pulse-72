import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { TrustProfileHero } from "@/components/dashboard-trust/TrustProfileHero";
import { TrustCustomerRequestsWidget } from "@/components/dashboard-trust/TrustCustomerRequestsWidget";
import { CustomerDPAWidget } from "@/components/dashboard-trust/CustomerDPAWidget";
import { UpcomingTrustFeaturesCard } from "@/components/dashboard-trust/UpcomingTrustFeaturesCard";
import { AggregatedMaturityWidget } from "@/components/dashboard-v2/AggregatedMaturityWidget";
import { NextActionCards } from "@/components/dashboard-v2/NextActionCards";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { useUserTasks } from "@/hooks/useUserTasks";
import { useMemo } from "react";

function getGreeting(isNb: boolean) {
  const h = new Date().getHours();
  if (isNb) {
    if (h < 10) return "God morgen";
    if (h < 17) return "God dag";
    return "God kveld";
  }
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function TrustCenterDashboard() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const { grouped } = useComplianceRequirements();
  const { tasks: userTasks } = useUserTasks();

  const actions = useMemo(() => {
    const compliance = (grouped.incompleteManual || []).map((a) => ({ ...a, _source: "compliance" as const }));
    const open = userTasks
      .filter((t) => t.status !== "done")
      .map((t) => ({
        framework_id: "user",
        requirement_id: t.id,
        name: t.title,
        name_no: t.title,
        category: "organizational" as const,
        priority: "medium" as const,
        status: "not_started" as const,
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
    const all = [...compliance, ...open];
    all.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4));
    return all.slice(0, 5);
  }, [grouped.incompleteManual, userTasks]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-11">
        <div className="container max-w-5xl mx-auto p-6 lg:p-8 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {getGreeting(isNb)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isNb ? "Trust Center — oversikt over profil, modenhet og kundeforespørsler" : "Trust Center — overview of profile, maturity and customer requests"}
            </p>
          </div>

          <TrustProfileHero />

          <AggregatedMaturityWidget />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TrustCustomerRequestsWidget />
            <CustomerDPAWidget />
          </div>

          <NextActionCards actions={actions} />

          <UpcomingTrustFeaturesCard />
        </div>
      </main>
    </div>
  );
}
