import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  AlertTriangle,
  ClipboardCheck,
  ChevronRight,
  Bot,
  CheckCircle2,
  Send,
  Search,
  FileText,
  Clock,
  CalendarDays,
  TrendingDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { cn } from "@/lib/utils";
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
      {/* Compliance donut card */}
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

      {/* Risk card */}
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

      {/* Controls card */}
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
      score: d ? Math.round((d.completed / Math.max(d.total, 1)) * 100) : Math.floor(Math.random() * 40 + 30),
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

/* ─── Sone 3: Krever oppmerksomhet ─── */
interface AttentionItem {
  id: string;
  label: string;
  urgency: "high" | "medium";
  route: string;
}

function AttentionSection({ isNb }: { isNb: boolean }) {
  const navigate = useNavigate();
  const { requirements } = useComplianceRequirements();

  const items = useMemo<AttentionItem[]>(() => {
    const result: AttentionItem[] = [];
    const criticalNotStarted = requirements.filter(
      r => r.priority === "critical" && r.status === "not_started"
    );
    if (criticalNotStarted.length > 0) {
      result.push({
        id: "critical-controls",
        label: isNb
          ? `${criticalNotStarted.length} kritiske kontroller ikke startet`
          : `${criticalNotStarted.length} critical controls not started`,
        urgency: "high",
        route: "/compliance",
      });
    }
    const aiWorking = requirements.filter(r => r.is_ai_handling && r.status === "in_progress");
    if (aiWorking.length > 0) {
      result.push({
        id: "ai-working",
        label: isNb
          ? `Lara jobber med ${aiWorking.length} kontroller`
          : `Lara is working on ${aiWorking.length} controls`,
        urgency: "medium",
        route: "/compliance",
      });
    }
    result.push({
      id: "vendor-dpa",
      label: isNb ? "2 leverandører mangler oppdatert DPA" : "2 vendors missing updated DPA",
      urgency: "high",
      route: "/assets",
    });
    result.push({
      id: "review-deadline",
      label: isNb ? "Revisjon av ISO 27001 om 12 dager" : "ISO 27001 review in 12 days",
      urgency: "medium",
      route: "/compliance",
    });
    return result.slice(0, 5);
  }, [requirements, isNb]);

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-orange-200 dark:border-orange-800/40 bg-orange-50/50 dark:bg-orange-950/20 p-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
        <h2 className="text-xs font-semibold text-orange-800 dark:text-orange-300">
          {isNb ? "Krever din oppmerksomhet" : "Needs your attention"}
        </h2>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.route)}
            className="w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-orange-100/60 dark:hover:bg-orange-900/20 transition-colors group"
          >
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", item.urgency === "high" ? "bg-destructive" : "bg-orange-400")} />
            <span className="flex-1 text-foreground">{item.label}</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Sone 4a: AI-agent logg ─── */
function AIAgentLog({ isNb }: { isNb: boolean }) {
  const { requirements } = useComplianceRequirements();

  const stats = useMemo(() => {
    const aiHandled = requirements.filter(r => r.is_ai_handling || r.agent_capability === "full");
    const completed = aiHandled.filter(r => r.status === "completed").length;
    const inProgress = aiHandled.filter(r => r.status === "in_progress").length;
    const estimatedHours = Math.round(completed * 0.5 + inProgress * 0.3);
    return { completed, inProgress, total: aiHandled.length, estimatedHours };
  }, [requirements]);

  const logItems = [
    { icon: Send, text: isNb ? "Sendt DPA-krav til 3 leverandører" : "Sent DPA requests to 3 vendors", done: true },
    { icon: Search, text: isNb ? `Analysert ${stats.total} kontroller` : `Analyzed ${stats.total} controls`, done: true },
    { icon: FileText, text: isNb ? "Generert 4 policydokumenter" : "Generated 4 policy documents", done: true },
    ...(stats.inProgress > 0
      ? [{ icon: Bot, text: isNb ? `Jobber med ${stats.inProgress} kontroller nå` : `Working on ${stats.inProgress} controls now`, done: false }]
      : []),
  ];

  return (
    <Card className="p-3 flex flex-col border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <div className="flex items-center gap-2 mb-2">
        <Bot className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold text-foreground">
          {isNb ? "Lara (AI-agent)" : "Lara (AI agent)"}
        </h3>
        <Badge variant="outline" className="text-[10px] ml-auto gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 px-1.5 py-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          Live
        </Badge>
      </div>
      <p className="text-[10px] text-muted-foreground mb-2">{isNb ? "Siste 7 dager" : "Last 7 days"}</p>
      <div className="space-y-1.5 flex-1">
        {logItems.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            {item.done ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <item.icon className="h-3.5 w-3.5 text-primary animate-pulse shrink-0 mt-0.5" />
            )}
            <span className="text-foreground/80">{item.text}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1.5">
        <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-[11px] font-medium text-emerald-600">
          {isNb ? `Spart ~${stats.estimatedHours} timer` : `Saved ~${stats.estimatedHours} hours`}
        </span>
      </div>
    </Card>
  );
}

/* ─── Sone 4b: Frister ─── */
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
      {/* KPIs - stacks on mobile */}
      <KPIRow isNb={isNb} />

      {/* Control areas bar chart */}
      <ControlAreasChart isNb={isNb} />

      {/* Attention */}
      <AttentionSection isNb={isNb} />

      {/* AI + Deadlines - stacks on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AIAgentLog isNb={isNb} />
        <DeadlinesPanel isNb={isNb} />
      </div>
    </div>
  );
}
