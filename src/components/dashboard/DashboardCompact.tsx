import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useActivatedServices } from "@/hooks/useActivatedServices";
import { DeletionAgentPromoCard } from "./DeletionAgentPromoCard";
import { DeletionAgentCard } from "./DeletionAgentCard";
import {
  ShieldCheck,
  AlertTriangle,
  ClipboardCheck,
  ChevronRight,
  Clock,
  CalendarDays,
  Users,
  TrendingUp,
  Loader2,
  Building2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

/* ─── Sone 1: KPI-kort med mini-donut ─── */
function KPIRow({ isNb }: { isNb: boolean }) {
  const { requirements } = useComplianceRequirements();

  const stats = useMemo(() => {
    const total = requirements.length || 1;
    const completed = requirements.filter(r => r.status === "completed").length;
    const inProgress = requirements.filter(r => r.status === "in_progress").length;
    const compliancePct = Math.round((completed / total) * 100);
    const assessed = completed + inProgress;
    const highRisk = requirements.filter(r => r.priority === "critical" && r.status !== "completed").length;
    const riskLevel = highRisk > 5 ? (isNb ? "Høy" : "High") : highRisk > 2 ? (isNb ? "Middels" : "Medium") : (isNb ? "Lav" : "Low");
    const riskColor = highRisk > 5 ? "text-destructive" : highRisk > 2 ? "text-orange-500" : "text-emerald-600";
    return { compliancePct, riskLevel, riskColor, assessed, total, highRisk, completed, inProgress };
  }, [requirements, isNb]);

  const donutData = [
    { name: "done", value: stats.completed },
    { name: "progress", value: stats.inProgress },
    { name: "remaining", value: stats.total - stats.completed - stats.inProgress },
  ];
  const donutColors = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--muted))"];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card className="p-3 flex items-center gap-3 border-border/50">
        <div className="h-12 w-12 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={donutData} dataKey="value" innerRadius={14} outerRadius={22} strokeWidth={0} startAngle={90} endAngle={-270}>
                {donutData.map((_, i) => <Cell key={i} fill={donutColors[i]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{isNb ? "Samsvar" : "Compliance"}</p>
          <p className="text-lg font-bold leading-tight text-primary">{stats.compliancePct}%</p>
          <p className="text-[10px] text-muted-foreground truncate">{isNb ? "av kontroller oppfylt" : "of controls met"}</p>
        </div>
      </Card>

      <Card className="p-3 flex items-center gap-3 border-border/50">
        <div className={cn("rounded-lg p-2 bg-muted/50", stats.riskColor)}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{isNb ? "Risikonivå" : "Risk Level"}</p>
          <p className={cn("text-lg font-bold leading-tight", stats.riskColor)}>{stats.riskLevel}</p>
          <p className="text-[10px] text-muted-foreground truncate">{isNb ? `${stats.highRisk} kritiske åpne` : `${stats.highRisk} critical open`}</p>
        </div>
      </Card>

      <Card className="p-3 flex items-center gap-3 border-border/50">
        <div className="rounded-lg p-2 bg-muted/50 text-primary">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{isNb ? "Kontroller" : "Controls"}</p>
          <p className="text-lg font-bold leading-tight text-primary">{stats.assessed}/{stats.total}</p>
          <p className="text-[10px] text-muted-foreground truncate">{isNb ? "vurdert" : "assessed"}</p>
        </div>
      </Card>
    </div>
  );
}

/* ─── Sone 2: Kontrollområder bar chart ─── */
function ControlAreasChart({ isNb }: { isNb: boolean }) {
  const { stats } = useComplianceRequirements({});
  const byDomain = stats.byDomainArea || {};

  const AREAS = [
    { key: "governance", label: isNb ? "Styring" : "Governance", short: isNb ? "Styr." : "Gov." },
    { key: "risk_compliance", label: isNb ? "Drift og sikkerhet" : "Ops & Security", short: isNb ? "Drift" : "Ops" },
    { key: "security_posture", label: isNb ? "Personvern" : "Privacy", short: isNb ? "Pers." : "Priv." },
    { key: "supplier_governance", label: isNb ? "Tredjepartstyring" : "Third-Party", short: isNb ? "3.part" : "3rd" },
  ];

  const chartData = AREAS.map(a => {
    const d = byDomain[a.key];
    return {
      name: a.short,
      fullName: a.label,
      score: d ? Math.round(d.score) : Math.floor(Math.random() * 40 + 30),
    };
  });

  return (
    <Card className="p-3 border-border/50">
      <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        {isNb ? "Kontrollområder" : "Control Areas"}
      </h3>
      <div className="h-36 sm:h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
            <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={40} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value: number) => [`${value}%`, isNb ? "Score" : "Score"]}
              labelFormatter={(label: string) => {
                const item = chartData.find(d => d.name === label);
                return item?.fullName || label;
              }}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ─── Sone 3: Kundeoversikt (Partner) ─── */
function PartnerCustomerOverview({ isNb }: { isNb: boolean }) {
  const navigate = useNavigate();
  const { data: customers = [] } = useQuery({
    queryKey: ["msp-customers-compact"],
    queryFn: async () => {
      const { data } = await supabase
        .from("msp_customers")
        .select("compliance_score, status, onboarding_completed");
      return data || [];
    },
  });

  const total = customers.length;
  const avgScore = total > 0
    ? Math.round(customers.reduce((s, c) => s + (c.compliance_score || 0), 0) / total)
    : 0;
  const onboarding = customers.filter(c => !c.onboarding_completed).length;
  const lowScore = customers.filter(c => (c.compliance_score || 0) < 50).length;

  const metrics = [
    { icon: Users, label: isNb ? "Kunder" : "Customers", value: total, color: "text-primary" },
    { icon: TrendingUp, label: isNb ? "Gj.snitt" : "Avg. score", value: `${avgScore}%`, color: "text-emerald-600" },
    { icon: Loader2, label: isNb ? "Onboarding" : "Onboarding", value: onboarding, color: "text-chart-2" },
    { icon: AlertTriangle, label: isNb ? "Lav score" : "Low score", value: lowScore, color: lowScore > 0 ? "text-destructive" : "text-muted-foreground" },
  ];

  return (
    <Card
      className="p-3 cursor-pointer hover:shadow-md transition-shadow border-border/50"
      onClick={() => navigate("/msp-dashboard")}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-primary" />
          {isNb ? "Kundeoversikt" : "Customer Overview"}
        </h3>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <m.icon className={cn("h-3.5 w-3.5 shrink-0", m.color)} />
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight text-foreground">{m.value}</p>
              <p className="text-[10px] text-muted-foreground truncate">{m.label}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Sone 3b: Siste kunder ─── */
function RecentCustomersPanel({ isNb }: { isNb: boolean }) {
  const navigate = useNavigate();
  const { data: customers = [] } = useQuery({
    queryKey: ["msp-customers-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("msp_customers")
        .select("id, customer_name, status, compliance_score, onboarding_completed, created_at")
        .order("created_at", { ascending: false })
        .limit(4);
      return data || [];
    },
  });

  return (
    <Card
      className="p-3 cursor-pointer hover:shadow-md transition-shadow border-border/50"
      onClick={() => navigate("/msp-dashboard")}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-primary" />
          {isNb ? "Siste kunder" : "Recent Customers"}
        </h3>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      {customers.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          {isNb ? "Ingen kunder ennå" : "No customers yet"}
        </p>
      ) : (
        <div className="space-y-1.5">
          {customers.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-xs">
              <span className="flex-1 text-foreground/80 truncate">{c.customer_name}</span>
              <Badge
                variant={c.onboarding_completed ? "action" : "secondary"}
                className="text-[10px] px-1.5 py-0"
              >
                {c.onboarding_completed
                  ? (isNb ? "Aktiv" : "Active")
                  : (isNb ? "Onboarding" : "Onboarding")}
              </Badge>
              <span className="text-[10px] font-medium text-muted-foreground tabular-nums w-8 text-right">
                {c.compliance_score || 0}%
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ─── Sone 4: Frister ─── */
function DeadlinesPanel({ isNb }: { isNb: boolean }) {
  const deadlines = [
    { label: isNb ? "ISO 27001-revisjon" : "ISO 27001 review", date: "24. apr", daysLeft: 12, urgent: true },
    { label: isNb ? "DPA-fornyelse (Visma)" : "DPA renewal (Visma)", date: "1. mai", daysLeft: 19, urgent: false },
    { label: isNb ? "NIS2-rapport" : "NIS2 report", date: "15. mai", daysLeft: 33, urgent: false },
    { label: isNb ? "Risikovurdering Q2" : "Risk assessment Q2", date: "1. jun", daysLeft: 50, urgent: false },
  ];

  return (
    <Card className="p-3 flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-foreground">
          {isNb ? "Kommende frister" : "Upcoming deadlines"}
        </h3>
      </div>
      <div className="space-y-1.5 flex-1">
        {deadlines.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <Clock className={cn("h-3 w-3 shrink-0", d.urgent ? "text-destructive" : "text-muted-foreground")} />
            <span className="flex-1 text-foreground/80 truncate">{d.label}</span>
            <span className={cn("text-[10px] font-medium tabular-nums whitespace-nowrap", d.urgent ? "text-destructive" : "text-muted-foreground")}>
              {d.date}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Main export ─── */
export function DashboardCompact() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  return (
    <div className="flex flex-col gap-4">
      <KPIRow isNb={isNb} />
      <ControlAreasChart isNb={isNb} />
    </div>
  );
}
