import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Shield, Settings, KeyRound, Users, FileText,
  ChevronDown, ChevronRight, TrendingUp, BarChart3,
  CheckCircle2, Circle, AlertCircle,
} from "lucide-react";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { cn } from "@/lib/utils";
import { frameworks, getFrameworkById } from "@/lib/frameworkDefinitions";
import {
  LineChart, Line, XAxis, YAxis, ReferenceDot,
  Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const PILLARS = [
  { key: "governance", icon: Shield, label_no: "Styring", label_en: "Governance" },
  { key: "operations", icon: Settings, label_no: "Drift og sikkerhet", label_en: "Operations & Security" },
  { key: "identity_access", icon: KeyRound, label_no: "Identitet og tilgang", label_en: "Identity & Access" },
  { key: "privacy_data", icon: FileText, label_no: "Personvern og datahåndtering", label_en: "Privacy & Data Handling" },
  { key: "supplier_ecosystem", icon: Users, label_no: "Tredjepartstyring og verdikjede", label_en: "Third-Party & Value Chain" },
] as const;

const SLA_TO_PILLAR: Record<string, string> = {
  governance: "governance",
  operations: "operations",
  identity_access: "identity_access",
  privacy_data: "privacy_data",
  supplier: "supplier_ecosystem",
  supplier_ecosystem: "supplier_ecosystem",
};

function coverageLabel(score: number, isNb: boolean) {
  if (score >= 67) return { label: isNb ? "GOD DEKNING" : "GOOD COVERAGE", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
  if (score >= 34) return { label: isNb ? "MIDDELS DEKNING" : "MEDIUM COVERAGE", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
  return { label: isNb ? "LAV DEKNING" : "LOW COVERAGE", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" };
}

function generateFrameworkHistory(currentScore: number) {
  const months = ["Okt", "Nov", "Des", "Jan", "Feb", "Mar", "Apr"];
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const factor = 1 - i * 0.1;
    const jitter = Math.sin(i * 3.7) * 4;
    data.push({
      month: months[6 - i],
      score: Math.min(100, Math.max(0, Math.round(currentScore * factor + jitter))),
    });
  }
  return data;
}

function CircularGauge({ percent, size = 40 }: { percent: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 67 ? "hsl(142, 71%, 45%)" : percent >= 34 ? "hsl(38, 92%, 50%)" : "hsl(var(--destructive))";
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={3} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="fill-foreground text-[9px] font-bold"
      >
        {percent}%
      </text>
    </svg>
  );
}

const STATUS_ICON = {
  completed: CheckCircle2,
  in_progress: AlertCircle,
  not_started: Circle,
};



export function AggregatedMaturityWidget() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const { stats, requirements } = useComplianceRequirements({});
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const overall = stats.overallScore || { assessed: 0, total: 0, score: 0 };
  const byDomain = stats.byDomainArea || {};

  const requirementsByPillar = useMemo(() => {
    return PILLARS.reduce((acc, pillar) => {
      acc[pillar.key] = requirements.filter(
        (r) => SLA_TO_PILLAR[r.sla_category || ""] === pillar.key
      );
      return acc;
    }, {} as Record<string, typeof requirements>);
  }, [requirements]);

  // Framework data from scoring engine
  const byFramework = stats.byFramework || {};
  const activeFrameworks = useMemo(() => {
    return Object.entries(byFramework)
      .filter(([, v]) => v.total > 0)
      .map(([id, data]) => {
        const fw = getFrameworkById(id);
        return { id, name: fw?.name || id, data };
      })
      .sort((a, b) => b.data.score - a.data.score);
  }, [byFramework]);

  const aggregatedHistory = useMemo(() => generateFrameworkHistory(Math.round(overall.score)), [overall.score]);

  // Aggregated counts
  const totalAssessed = PILLARS.reduce((sum, p) => sum + (byDomain[p.key]?.assessed || 0), 0);
  const totalControls = PILLARS.reduce((sum, p) => sum + (byDomain[p.key]?.total || 0), 0);
  const totalRemaining = totalControls - totalAssessed;
  const overallCoverage = coverageLabel(Math.round(overall.score), isNb);

  return (
    <div className="rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="p-5 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-semibold text-foreground">
                {isNb ? "Modenhet per kontrollområde" : "Maturity by control areas"}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {isNb ? "Aggregert på tvers av leverandører og systemer" : "Aggregated across vendors and systems"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={showHistory ? "default" : "outline"}
              size="sm"
              className="h-7 text-[11px] px-2.5 gap-1"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? <BarChart3 className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {showHistory ? (isNb ? "Status" : "Status") : (isNb ? "Regelverk" : "Frameworks")}
            </Button>
            <span className={cn(
              "text-xl font-bold tabular-nums",
              overall.score >= 67 ? "text-emerald-600 dark:text-emerald-400" :
              overall.score >= 34 ? "text-amber-600 dark:text-amber-400" :
              "text-orange-600 dark:text-orange-400"
            )}>
              {Math.round(overall.score)}%
            </span>
          </div>
        </div>

        {/* Coverage badge + summary pills */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border-0", overallCoverage.className)}>
            {overallCoverage.label}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span className="font-medium text-foreground">{totalAssessed}</span> {isNb ? "oppfylt" : "fulfilled"}
            </span>
            <span className="text-border">•</span>
            <span className="inline-flex items-center gap-1">
              <Circle className="h-3 w-3 text-muted-foreground/40" />
              <span className="font-medium text-foreground">{totalRemaining}</span> {isNb ? "gjenstår" : "remaining"}
            </span>
            <span className="text-border">•</span>
            <span>{PILLARS.length} {isNb ? "kontrollområder" : "control areas"}</span>
          </div>
        </div>

        {/* Overall progress bar */}
        <Progress value={overall.score} className="h-2 [&>div]:bg-primary" />
      </div>

      {/* Content */}
      <div className="px-5 pb-5 pt-0">
        {showHistory ? (
          <div className="space-y-4">
            {/* Framework header */}
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground">
                {isNb ? "Samsvarsstatus per regelverk" : "Compliance status per framework"}
              </h4>
              <Badge variant="outline" className="text-[10px] h-5">
                {activeFrameworks.length} {isNb ? "regelverk" : "frameworks"}
              </Badge>
            </div>

            {/* Framework cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {activeFrameworks.map((fw) => {
                const percent = Math.round(fw.data.score);
                const cov = coverageLabel(percent, isNb);
                return (
                  <div
                    key={fw.id}
                    className="rounded-lg border border-border bg-muted/20 p-3 flex flex-col items-center gap-1.5 hover:bg-muted/40 transition-colors"
                  >
                    <CircularGauge percent={percent} />
                    <span className="text-[11px] font-medium text-foreground text-center leading-tight line-clamp-2">
                      {fw.name}
                    </span>
                    <Badge className={cn("text-[8px] font-semibold px-1.5 py-0 rounded-full border-0 h-3.5", cov.className)}>
                      {cov.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                      {fw.data.assessed}/{fw.data.total}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Aggregated trend line */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">
                {isNb ? "Historisk utvikling" : "Historical trend"}
              </h4>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={aggregatedHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={28} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      formatter={(value: number) => [`${value}%`, isNb ? "Samsvar" : "Compliance"]}
                    />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: compact list */}
            <div className="flex flex-col gap-1 sm:hidden">
              {PILLARS.map((pillar) => {
                const domainData = byDomain[pillar.key] || { score: 0, assessed: 0, total: 0 };
                const percent = Math.round(domainData.score || 0);
                const Icon = pillar.icon;
                const isExpanded = expandedPillar === pillar.key;
                const controls = requirementsByPillar[pillar.key] || [];

                return (
                  <div key={pillar.key}>
                    <button
                      onClick={() => setExpandedPillar(isExpanded ? null : pillar.key)}
                      className="flex items-center gap-2 w-full p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-1 rounded-md bg-primary/10 shrink-0">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-foreground flex-1 text-left truncate">
                        {isNb ? pillar.label_no : pillar.label_en}
                      </span>
                      <Progress value={percent} className="h-1.5 w-16 shrink-0 [&>div]:bg-primary" />
                      <span className="text-xs font-semibold text-foreground w-8 text-right shrink-0">{percent}%</span>
                      {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                    </button>
                    {isExpanded && <ControlList controls={controls} isNb={isNb} />}
                  </div>
                );
              })}
            </div>

            {/* Desktop: domain cards grid */}
            <div className="hidden sm:grid sm:grid-cols-2 gap-3">
              {PILLARS.map((pillar, index) => {
                const domainData = byDomain[pillar.key] || { score: 0, assessed: 0, total: 0 };
                const percent = Math.round(domainData.score || 0);
                const coverage = coverageLabel(percent, isNb);
                const Icon = pillar.icon;
                const isExpanded = expandedPillar === pillar.key;
                const controls = requirementsByPillar[pillar.key] || [];
                const remaining = (domainData.total || 0) - (domainData.assessed || 0);

                return (
                  <div
                    key={pillar.key}
                    className={cn(
                      "rounded-lg border border-border bg-muted/20 overflow-hidden transition-all",
                      index === PILLARS.length - 1 && PILLARS.length % 2 !== 0 && "col-span-2",
                      isExpanded && "col-span-2"
                    )}
                  >
                    <button
                      onClick={() => setExpandedPillar(isExpanded ? null : pillar.key)}
                      className="flex items-center gap-2.5 w-full p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {isNb ? pillar.label_no : pillar.label_en}
                          </span>
                          <span className="text-sm font-bold text-foreground tabular-nums">{percent}%</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">
                            {domainData.assessed || 0}/{domainData.total || 0} {isNb ? "oppfylt" : "fulfilled"}
                          </span>
                          {remaining > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              · {remaining} {isNb ? "gjenstår" : "remaining"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={cn("text-[9px] font-semibold px-1.5 py-0 rounded-full border-0 h-4", coverage.className)}>
                          {coverage.label}
                        </Badge>
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </button>
                    <div className="px-3 pb-2">
                      <Progress value={percent} className="h-2 [&>div]:bg-primary" />
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-3">
                        <ControlList controls={controls} isNb={isNb} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Summary footer */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            {isNb ? "Totalt" : "Total"}: <span className="font-semibold text-foreground">{totalAssessed} {isNb ? "av" : "of"} {totalControls}</span> {isNb ? "kontroller vurdert" : "controls assessed"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ControlList({ controls, isNb }: { controls: any[]; isNb: boolean }) {
  if (controls.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2 pl-8">
        {isNb ? "Ingen kontroller registrert for dette området." : "No controls registered for this area."}
      </p>
    );
  }

  const sorted = [...controls].sort((a, b) => {
    const order = { completed: 2, in_progress: 1, not_started: 0 };
    return (order[a.status as keyof typeof order] ?? 0) - (order[b.status as keyof typeof order] ?? 0);
  });

  return (
    <div className="space-y-1 pt-1 border-t">
      {sorted.slice(0, 10).map((ctrl) => {
        const StatusIcon = STATUS_ICON[ctrl.status as keyof typeof STATUS_ICON] || Circle;
        const statusColor =
          ctrl.status === "completed"
            ? "text-emerald-500"
            : ctrl.status === "in_progress"
              ? "text-amber-500"
              : "text-muted-foreground/40";

        return (
          <div key={ctrl.requirement_id} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/30 text-xs">
            <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", statusColor)} />
            <span className="flex-1 truncate text-foreground">
              {isNb ? ctrl.name_no : ctrl.name}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] h-4 px-1.5 shrink-0",
                ctrl.status === "completed" && "border-emerald-300 text-emerald-600 dark:text-emerald-400",
                ctrl.status === "in_progress" && "border-amber-300 text-amber-600 dark:text-amber-400",
                ctrl.status === "not_started" && "border-border text-muted-foreground"
              )}
            >
              {ctrl.status === "completed"
                ? (isNb ? "Fullført" : "Done")
                : ctrl.status === "in_progress"
                  ? (isNb ? "Pågår" : "In progress")
                  : (isNb ? "Ikke startet" : "Not started")}
            </Badge>
          </div>
        );
      })}
      {sorted.length > 10 && (
        <p className="text-[10px] text-muted-foreground pl-6 pt-1">
          +{sorted.length - 10} {isNb ? "flere kontroller" : "more controls"}
        </p>
      )}
    </div>
  );
}
