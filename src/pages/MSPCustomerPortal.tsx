import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Eye } from "lucide-react";
import { ComplianceShield } from "@/components/dashboard-v2/ComplianceShield";
import { NextActionCards } from "@/components/dashboard-v2/NextActionCards";
import { RiskAndCalendarSection } from "@/components/dashboard-v2/RiskAndCalendarSection";
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

export default function MSPCustomerPortal() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";

  const { data: customer, isLoading } = useQuery({
    queryKey: ["msp-customer", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_customers" as any)
        .select("*")
        .eq("id", customerId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!customerId,
  });

  const { requirements, grouped, stats } = useComplianceRequirements();

  const xp = useMemo(
    () => requirements.filter((r) => r.status === "completed").reduce((sum, r) => sum + (XP_MAP[r.priority] || 0), 0),
    [requirements]
  );

  const streak = useMemo(() => {
    const dates = requirements.filter((r) => r.completed_at).map((r) => r.completed_at!);
    return calculateStreak(dates);
  }, [requirements]);

  const score = stats.progressPercent;

  const level = useMemo(() => {
    const l = [...MATURITY_LEVELS].reverse().find((l) => score >= l.min);
    return l || MATURITY_LEVELS[0];
  }, [score]);

  const regulationDomains = useMemo(() => {
    const byReg = stats.byRegulationDomain || {};
    return [
      { label_no: "Personvern", label_en: "Privacy", percent: (byReg as any)?.privacy?.score || 0 },
      { label_no: "Sikkerhet", label_en: "Security", percent: (byReg as any)?.security?.score || 0 },
      { label_no: "AI", label_en: "AI", percent: (byReg as any)?.ai?.score || 0 },
    ];
  }, [stats.byRegulationDomain]);

  const focusAreas = useMemo(() => {
    const byDomain = stats.byDomainArea || {};
    return [
      { label_no: "Governance", label_en: "Governance", percent: (byDomain as any)?.governance?.score || 0 },
      { label_no: "Operations", label_en: "Operations", percent: (byDomain as any)?.operations?.score || 0 },
      { label_no: "Identity & Access", label_en: "Identity & Access", percent: (byDomain as any)?.identity_access?.score || 0 },
      { label_no: "Supplier & Ecosystem", label_en: "Supplier & Ecosystem", percent: (byDomain as any)?.supplier_ecosystem?.score || 0 },
    ];
  }, [stats.byDomainArea]);

  const incompleteActions = grouped.incompleteManual.slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Laster kundeportal...</p>
        </main>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Kunde ikke funnet</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/msp-dashboard")}>
              Tilbake til partneroversikt
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Partner mode banner */}
        <div className="sticky top-0 z-20 bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
          <div className="container max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Eye className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Du ser nå <span className="text-primary">{customer.customer_name}</span> sin portal
                </p>
                <p className="text-xs text-muted-foreground">Partnermodus – du kan vise kunden rundt og forklare compliance-status</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/msp-dashboard/${customerId}`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbake
            </Button>
          </div>
        </div>

        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{customer.customer_name} – Compliance Dashboard</h1>
          </div>

          <ComplianceShield
            score={score}
            xp={xp}
            streak={streak}
            level={level.key}
            levelLabel_no={level.label_no}
            levelLabel_en={level.label_en}
            domains={domains}
          />
          <NextActionCards actions={incompleteActions} />
          <RiskAndCalendarSection requirements={requirements} />
        </div>
      </main>
    </div>
  );
}
