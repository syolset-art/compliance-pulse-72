import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield, Settings, KeyRound, Users, FileText,
  ChevronRight, TrendingUp, BarChart3, Layers,
  CheckCircle2, Circle, AlertCircle, HelpCircle, Sparkles,
} from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useGlobalChat } from "@/components/GlobalChatProvider";
import { Button } from "@/components/ui/button";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { cn } from "@/lib/utils";
import { getFrameworkById } from "@/lib/frameworkDefinitions";
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const PILLARS = [
  { key: "governance", icon: Shield, label_no: "Styring", label_en: "Governance", color: "hsl(var(--primary))" },
  { key: "operations", icon: Settings, label_no: "Drift og sikkerhet", label_en: "Drift og sikkerhet", color: "hsl(142, 71%, 45%)" },
  { key: "identityAccess", icon: KeyRound, label_no: "Identitet og tilgang", label_en: "Identity & Access", color: "hsl(262, 83%, 58%)" },
  { key: "privacy", icon: FileText, label_no: "Personvern og datahåndtering", label_en: "Privacy & Data Handling", color: "hsl(142, 71%, 45%)" },
  { key: "vendor", icon: Users, label_no: "Tredjepart og verdikjede", label_en: "Third-Party & Supply Chain", color: "hsl(340, 82%, 52%)" },
] as const;

const SLA_TO_PILLAR: Record<string, string> = {
  governance: "governance",
  operations: "operations",
  identityAccess: "identityAccess",
  privacy: "privacy",
  supplier: "vendor",
  vendor: "vendor",
};

type ViewMode = "status" | "history" | "frameworks";

// Demo-gulv: sørger for at widgeten viser et realistisk mix av høy/middels/lav
// modenhet (grønn/gul/rød) når underliggende data ennå er tynn.
const PILLAR_DEMO_FLOOR: Record<string, number> = {
  governance: 78,           // høy  → grønn
  operations: 58,           // middels → gul
  identityAccess: 41,      // middels → gul
  privacy: 82,         // høy  → grønn
  vendor: 24,   // lav  → rød
};

function applyFloor(key: string, raw: number) {
  return Math.max(raw, PILLAR_DEMO_FLOOR[key] ?? 0);
}

/**
 * Returnerer modenhetsnivå med farge-tokens.
 * Terskler følger Mynders scoringsmodell (v1): 0 = ikke vurdert,
 * 1–49 % lav, 50–74 % middels, 75–100 % høy.
 */
function maturityLevel(score: number, isNb: boolean) {
  if (score >= 75) {
    return {
      id: "high",
      label: isNb ? "Høy modenhet" : "High maturity",
      shortLabel: isNb ? "Høy" : "High",
      range: "75–100 %",
      hint: isNb
        ? "De fleste krav er oppfylt og dokumentert."
        : "Most requirements are fulfilled and documented.",
      badgeClass: "bg-success/15 text-success dark:bg-success/25 dark:text-success",
      textClass: "text-success",
      progressClass: "[&>div]:bg-success",
      dotClass: "bg-success",
      gaugeColor: "hsl(var(--success))",
    };
  }
  if (score >= 50) {
    return {
      id: "medium",
      label: isNb ? "Middels modenhet" : "Medium maturity",
      shortLabel: isNb ? "Middels" : "Medium",
      range: "50–74 %",
      hint: isNb
        ? "På god vei, men det er fortsatt vesentlige hull."
        : "On track, but significant gaps remain.",
      badgeClass: "bg-warning/15 text-warning dark:bg-warning/25 dark:text-warning",
      textClass: "text-warning",
      progressClass: "[&>div]:bg-warning",
      dotClass: "bg-warning",
      gaugeColor: "hsl(var(--warning))",
    };
  }
  if (score > 0) {
    return {
      id: "low",
      label: isNb ? "Lav modenhet" : "Low maturity",
      shortLabel: isNb ? "Lav" : "Low",
      range: "1–49 %",
      hint: isNb
        ? "Få krav er oppfylt eller dokumentert."
        : "Few requirements are fulfilled or documented.",
      badgeClass: "bg-destructive/15 text-destructive dark:bg-destructive/25 dark:text-destructive",
      textClass: "text-destructive",
      progressClass: "[&>div]:bg-destructive",
      dotClass: "bg-destructive",
      gaugeColor: "hsl(var(--destructive))",
    };
  }
  return {
    id: "none",
    label: isNb ? "Ikke vurdert" : "Not assessed",
    shortLabel: isNb ? "Ikke vurdert" : "Not assessed",
    range: "0 %",
    hint: isNb
      ? "Ingen krav er besvart ennå."
      : "No requirements answered yet.",
    badgeClass: "bg-muted text-muted-foreground",
    textClass: "text-muted-foreground",
    progressClass: "[&>div]:bg-muted-foreground/30",
    dotClass: "bg-muted-foreground/30",
    gaugeColor: "hsl(var(--muted-foreground))",
  };
}

/** Fargeforklaring – hva rød/gul/grønn betyr. */
function MaturityLegend({ isNb }: { isNb: boolean }) {
  const levels = [100, 60, 25, 0].map((v) => maturityLevel(v, isNb)).reverse();
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3">
      {levels.map((lvl) => (
        <span key={lvl.id} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn("h-2 w-2 rounded-full shrink-0", lvl.dotClass)} />
          <span className="font-medium text-foreground">{lvl.label}</span>
          <span className="tabular-nums">{lvl.range}</span>
        </span>
      ))}
      <span className="ml-auto text-[11px] text-muted-foreground">
        {isNb ? "Basert på Mynders scoringsmodell (v1)" : "Based on Mynder's scoring model (v1)"}
      </span>
    </div>
  );
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

function generatePillarHistory(pillars: typeof PILLARS, byDomain: Record<string, { score: number }>) {
  const months = ["Okt", "Nov", "Des", "Jan", "Feb", "Mar", "Apr"];
  return months.map((month, idx) => {
    const point: Record<string, string | number> = { month };
    pillars.forEach((p) => {
      const current = applyFloor(p.key, byDomain[p.key]?.score || 0);
      const factor = 1 - (6 - idx) * 0.1;
      const jitter = Math.sin((6 - idx) * 2.3 + pillars.indexOf(p) * 1.7) * 5;
      point[p.key] = Math.min(100, Math.max(0, Math.round(current * factor + jitter)));
    });
    return point;
  });
}

function CircularGauge({ percent, isNb, size = 48, showPercent = false }: { percent: number; isNb: boolean; size?: number; showPercent?: boolean }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const level = maturityLevel(percent, isNb);
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={3} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={level.gaugeColor} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="fill-foreground text-[10px] font-bold"
      >
        {showPercent ? `${percent}%` : level.shortLabel}
      </text>
    </svg>
  );
}

const STATUS_ICON = {
  completed: CheckCircle2,
  in_progress: AlertCircle,
  not_started: Circle,
};

const VIEW_MODES: { key: ViewMode; icon: typeof BarChart3; label_no: string; label_en: string }[] = [
  { key: "status", icon: BarChart3, label_no: "Status", label_en: "Status" },
  { key: "history", icon: TrendingUp, label_no: "Historikk", label_en: "History" },
  { key: "frameworks", icon: Layers, label_no: "Regelverk", label_en: "Frameworks" },
];

export function AggregatedMaturityWidget() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const navigate = useNavigate();
  const { stats, requirements } = useComplianceRequirements({});
  const [viewMode, setViewMode] = useState<ViewMode>("status");
  const { openChatWithMessage } = useGlobalChat();

  const overall = stats.overallScore || { assessed: 0, total: 0, score: 0 };
  const byDomain = stats.byDomainArea || {};


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
  const pillarHistory = useMemo(() => generatePillarHistory(PILLARS, byDomain), [byDomain]);

  const totalAssessed = PILLARS.reduce((sum, p) => sum + (byDomain[p.key]?.assessed || 0), 0);
  const totalControls = PILLARS.reduce((sum, p) => sum + (byDomain[p.key]?.total || 0), 0);
  const totalRemaining = totalControls - totalAssessed;

  // Aggregert score med demo-gulv slik at overordnet nivå reflekterer pilarene.
  const flooredPillarScores = PILLARS.map((p) => applyFloor(p.key, byDomain[p.key]?.score || 0));
  const aggregatedScore = Math.round(
    flooredPillarScores.reduce((s, v) => s + v, 0) / Math.max(1, flooredPillarScores.length)
  );
  const overallLevel = maturityLevel(aggregatedScore, isNb);

  return (
    <div className="rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="p-4 sm:p-5 pb-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-semibold text-foreground">
                {isNb ? "Modenhet per kontrollområde" : "Maturity by control areas"}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {isNb ? "Aggregert på tvers av leverandører og systemer" : "Aggregated across vendors and systemer"}
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:shrink-0">

            {/* Segmented control */}
            <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
              {VIEW_MODES.map((mode) => {
                const Icon = mode.icon;
                const isActive = viewMode === mode.key;
                return (
                  <button
                    key={mode.key}
                    onClick={() => setViewMode(mode.key)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md text-[13px] font-medium transition-all",
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{isNb ? mode.label_no : mode.label_en}</span>
                  </button>
                );
              })}
            </div>
            <HoverCard openDelay={120} closeDelay={80}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 bg-muted/20 px-2.5 py-1 rounded-xl border border-border/50 hover:border-border transition-colors cursor-help"
                  aria-label={isNb ? "Forklar Mynder-scoren" : "Explain the Mynder score"}
                >
                  <span className={cn("text-xs font-bold uppercase tracking-wider", overallLevel.textClass)}>
                    {overallLevel.shortLabel}
                  </span>
                  <CircularGauge percent={aggregatedScore} isNb={isNb} size={36} showPercent={true} />
                </button>
              </HoverCardTrigger>
              <HoverCardContent align="end" className="w-80 p-4 space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {isNb ? "Slik er scoren regnet ut" : "How the score is calculated"}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {isNb
                      ? "Prosenten viser hvor mye du har dokumentert av etterlevelse av lover og regler, basert på besvarte kontrollpunkter med bekreftet dokumentasjon."
                      : "The percentage shows how much compliance you have documented, based on answered control points with verified evidence."}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {isNb
                      ? "Fargene følger Mynders scoringsmodell (v1): rød 1–49 % (lav), gul 50–74 % (middels), grønn 75–100 % (høy). Grå betyr at området ikke er vurdert ennå."
                      : "Colors follow Mynder's scoring model (v1): red 1–49% (low), amber 50–74% (medium), green 75–100% (high). Grey means the area is not assessed yet."}
                  </p>
                </div>

                <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {isNb
                    ? `Bygger på ${totalAssessed} av ${totalControls} kontrollpunkter. «Ikke relevant» teller ikke med.`
                    : `Based on ${totalAssessed} of ${totalControls} control points. "Not relevant" is excluded.`}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() => window.dispatchEvent(new Event("open-page-help"))}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    {isNb ? "Mer hjelp" : "More help"}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() =>
                      openChatWithMessage(
                        isNb
                          ? "Kan du forklare hvordan Mynder-scoren min er beregnet, og hva jeg bør gjøre for å øke den?"
                          : "Can you explain how my Mynder score is calculated and what I should do to improve it?"
                      )
                    }
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {isNb ? "Spør Lara" : "Ask Lara"}
                  </Button>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-status-closed" />
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
      </div>

      {/* Content */}
      <div className="px-5 pb-5 pt-0">
        {viewMode === "history" && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-foreground">
              {isNb ? "Historisk utvikling per kontrollområde" : "Historical trend per control area"}
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pillarHistory}>
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
                    formatter={(value: number, name: string) => {
                      const p = PILLARS.find((pl) => pl.key === name);
                      return [`${value}%`, p ? (isNb ? p.label_no : p.label_en) : name];
                    }}
                  />
                  {PILLARS.map((p) => (
                    <Line
                      key={p.key}
                      type="monotone"
                      dataKey={p.key}
                      stroke={p.color}
                      strokeWidth={2}
                      dot={{ r: 2.5, fill: p.color }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PILLARS.map((p) => {
                const Icon = p.icon;
                const score = applyFloor(p.key, Math.round(byDomain[p.key]?.score || 0));
                const lvl = maturityLevel(score, isNb);
                return (
                  <div key={p.key} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate text-foreground">{isNb ? p.label_no : p.label_en}</span>
                    <span className={cn("font-semibold ml-auto", lvl.textClass)}>{lvl.shortLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === "frameworks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground">
                {isNb ? "Samsvarsstatus per regelverk" : "Compliance status per framework"}
              </h4>
              <Badge variant="outline" className="text-[13px] h-5">
                {activeFrameworks.length} {isNb ? "regelverk" : "frameworks"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeFrameworks.map((fw) => {
                const percent = Math.round(fw.data.score);
                const lvl = maturityLevel(percent, isNb);
                return (
                  <div key={fw.id} className="rounded-lg border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[13px] font-medium text-foreground truncate">{fw.name}</span>
                      <span className={cn("text-[13px] font-bold tabular-nums shrink-0", lvl.textClass)}>{percent}%</span>
                    </div>
                    <Progress value={percent} className={cn("h-1.5 rounded-full", lvl.progressClass)} />
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5 text-status-closed" />
                        {fw.data.assessed}/{fw.data.total}
                      </span>
                      <span className={cn("text-[10px] font-semibold uppercase tracking-wider", lvl.textClass)}>
                        {lvl.shortLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">
                {isNb ? "Aggregert historisk utvikling" : "Aggregated historical trend"}
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
        )}

        {viewMode === "status" && (
          <>
            {/* Mobile: compact list */}
            <div className="flex flex-col gap-1 sm:hidden">
              {PILLARS.map((pillar) => {
                const domainData = byDomain[pillar.key] || { score: 0, assessed: 0, total: 0 };
                const percent = applyFloor(pillar.key, Math.round(domainData.score || 0));
                const lvl = maturityLevel(percent, isNb);
                const Icon = pillar.icon;
                return (
                  <button
                    key={pillar.key}
                    title={`${lvl.label} (${percent} %) – ${lvl.hint}`}
                    onClick={() => navigate("/reports/compliance")}

                    className="flex items-center gap-2 w-full p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-1 rounded-md bg-primary/10 shrink-0">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground flex-1 text-left truncate">
                      {isNb ? pillar.label_no : pillar.label_en}
                    </span>
                    <Progress value={percent} className={cn("h-1.5 w-16 shrink-0", lvl.progressClass)} />
                    <span className={cn("text-xs font-semibold w-14 text-right shrink-0", lvl.textClass)}>{lvl.shortLabel}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Desktop: domain cards grid */}
            <div className="hidden sm:grid sm:grid-cols-2 gap-3">
              {PILLARS.map((pillar, index) => {
                const domainData = byDomain[pillar.key] || { score: 0, assessed: 0, total: 0 };
                const percent = applyFloor(pillar.key, Math.round(domainData.score || 0));
                const lvl = maturityLevel(percent, isNb);
                const Icon = pillar.icon;
                const remaining = (domainData.total || 0) - (domainData.assessed || 0);
                return (
                  <button
                    key={pillar.key}
                    title={`${lvl.label} (${percent} %) – ${lvl.hint}`}
                    onClick={() => navigate("/reports/compliance")}

                    className={cn(
                      "rounded-lg border border-border bg-muted/20 overflow-hidden transition-all text-left hover:border-primary/50 hover:bg-muted/40 cursor-pointer",
                      index === PILLARS.length - 1 && PILLARS.length % 2 !== 0 && "col-span-2"
                    )}
                  >
                    <div className="flex items-center gap-2.5 w-full p-3">
                      <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {isNb ? pillar.label_no : pillar.label_en}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[13px] text-muted-foreground">
                            {domainData.assessed || 0}/{domainData.total || 0} {isNb ? "oppfylt" : "fulfilled"}
                          </span>
                          {remaining > 0 && (
                            <span className="text-[13px] text-muted-foreground">
                              · {remaining} {isNb ? "gjenstår" : "remaining"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={cn("text-[13px] font-semibold px-1.5 py-0 rounded-full border-0 h-4", lvl.badgeClass)}>
                          {lvl.label.toUpperCase()}
                        </Badge>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="px-3 pb-2">
                      <Progress value={percent} className={cn("h-2", lvl.progressClass)} />
                    </div>
                  </button>
                );
              })}
            </div>

            <MaturityLegend isNb={isNb} />
          </>

        )}

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
          ctrl.status === "completed" ? "text-status-closed"
            : ctrl.status === "in_progress" ? "text-warning"
              : "text-muted-foreground/40";
        return (
          <div key={ctrl.requirement_id} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/30 text-xs">
            <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", statusColor)} />
            <span className="flex-1 truncate text-foreground">{isNb ? ctrl.name_no : ctrl.name}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[13px] h-4 px-1.5 shrink-0",
                ctrl.status === "completed" && "border-status-closed/20 text-status-closed dark:text-status-closed",
                ctrl.status === "in_progress" && "border-warning/20 text-warning dark:text-warning",
                ctrl.status === "not_started" && "border-border text-muted-foreground"
              )}
            >
              {ctrl.status === "completed" ? (isNb ? "Fullført" : "Done")
                : ctrl.status === "in_progress" ? (isNb ? "Pågår" : "In progress")
                  : (isNb ? "Ikke startet" : "Not started")}
            </Badge>
          </div>
        );
      })}
      {sorted.length > 10 && (
        <p className="text-[13px] text-muted-foreground pl-6 pt-1">
          +{sorted.length - 10} {isNb ? "flere kontroller" : "more controls"}
        </p>
      )}
    </div>
  );
}