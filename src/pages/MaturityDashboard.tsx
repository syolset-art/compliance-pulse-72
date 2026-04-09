import { useMemo, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, CheckCircle2, Circle, Clock, Target,
  ChevronDown, ChevronRight, BookOpen, Layers,
} from "lucide-react";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import {
  CERTIFICATION_PHASES,
  MATURITY_LEVELS,
  getMaturityLevel,
  getPhaseForRequirement,
  getPhaseStatus,
  type CertificationPhase,
} from "@/lib/certificationPhases";
import { cn } from "@/lib/utils";

export default function MaturityDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusPhase = searchParams.get("phase") as CertificationPhase | null;
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language?.startsWith("nb") || i18n.language?.startsWith("no");
  const t = (no: string, en: string) => (isNorwegian ? no : en);

  const { requirements, stats } = useComplianceRequirements();
  const score = stats.progressPercent;
  const maturityLevel = getMaturityLevel(score);
  const maturityInfo = MATURITY_LEVELS.find((m) => m.level === maturityLevel)!;

  // Group requirements by phase
  const phaseData = useMemo(() => {
    return CERTIFICATION_PHASES.map((phase) => {
      const phaseReqs = requirements.filter(
        (r) => getPhaseForRequirement(r.category, r.priority, r.sla_category) === phase.id
      );
      const total = phaseReqs.length;
      const completed = phaseReqs.filter((r) => r.status === "completed").length;
      const inProgress = phaseReqs.filter((r) => r.status === "in_progress").length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const status = getPhaseStatus(phase.id, score);

      const remaining = phaseReqs
        .filter((r) => r.status !== "completed")
        .sort((a, b) => {
          const prio = { critical: 0, high: 1, medium: 2, low: 3 };
          return (prio[a.priority as keyof typeof prio] ?? 3) - (prio[b.priority as keyof typeof prio] ?? 3);
        });

      return { phase, total, completed, inProgress, percent, status, remaining };
    });
  }, [requirements, score]);

  // Determine which phase to expand: URL param > first in_progress
  const activePhaseId = focusPhase || phaseData.find((p) => p.status === "in_progress")?.phase.id || phaseData[0]?.phase.id;
  const focusedPhaseData = phaseData.find((p) => p.phase.id === activePhaseId);

  // Auto-scroll to focused phase
  const focusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focusPhase && focusRef.current) {
      setTimeout(() => {
        focusRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, [focusPhase]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto md:pt-11">
        <div className="container max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
          {/* Compact header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("Modenhet", "Maturity")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("Se hvor du er og hva som gjenstår", "See where you are and what's left")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("Nivå", "Level")}</p>
                <p className="text-sm font-bold text-primary">
                  {isNorwegian ? maturityInfo.name_no : maturityInfo.name_en}
                </p>
              </div>
              <div className="relative w-12 h-12">
                <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${score * 0.94} 100`}
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                  {score}%
                </span>
              </div>
            </div>
          </div>

          {/* Phase timeline - compact stepper */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {phaseData.map(({ phase, percent, status }, i) => {
              const isDone = status === "completed";
              const isCurrent = phase.id === activePhaseId;

              return (
                <div key={phase.id} className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(`/maturity?phase=${phase.id}`, { replace: true })}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                      isCurrent
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : isDone
                        ? "bg-muted/50 text-muted-foreground"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      isDone ? "bg-primary text-primary-foreground" :
                      isCurrent ? "border-2 border-primary text-primary" :
                      "border border-border text-muted-foreground"
                    )}>
                      {isDone ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                    </div>
                    {isNorwegian ? phase.name_no : phase.name_en}
                    {isDone && <span className="text-[10px] text-muted-foreground">{percent}%</span>}
                  </button>
                  {i < phaseData.length - 1 && (
                    <div className={cn("w-4 h-0.5 rounded-full shrink-0", isDone ? "bg-primary" : "bg-border")} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Focused phase — the main content */}
          {focusedPhaseData && (
            <div ref={focusRef} className="space-y-4">
              {/* Phase header card */}
              <Card className="border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-bold text-foreground">
                          {isNorwegian ? focusedPhaseData.phase.name_no : focusedPhaseData.phase.name_en}
                        </h2>
                        {focusedPhaseData.status === "completed" && (
                          <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {t("Fullført", "Complete")}
                          </Badge>
                        )}
                        {focusedPhaseData.status === "in_progress" && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Clock className="h-3 w-3" />
                            {t("Aktiv", "Active")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isNorwegian ? focusedPhaseData.phase.description_no : focusedPhaseData.phase.description_en}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-2xl font-bold text-foreground">{focusedPhaseData.percent}%</span>
                      <p className="text-[10px] text-muted-foreground">
                        {focusedPhaseData.completed}/{focusedPhaseData.total} {t("krav", "req.")}
                      </p>
                    </div>
                  </div>
                  <Progress value={focusedPhaseData.percent} className="h-2" />
                </CardContent>
              </Card>

              {/* What to do: remaining requirements */}
              {focusedPhaseData.remaining.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      {t("Hva du må gjøre", "What you need to do")}
                      <Badge variant="outline" className="text-[10px] ml-auto">
                        {focusedPhaseData.remaining.length} {t("gjenstår", "remaining")}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {focusedPhaseData.remaining.map((req, i) => (
                      <div
                        key={req.requirement_id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                          i === 0
                            ? "border-primary/20 bg-primary/5"
                            : "border-border bg-card hover:bg-muted/30"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                          i === 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {isNorwegian && req.name_no ? req.name_no : req.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {req.requirement_id}
                            {req.priority === "critical" && (
                              <span className="ml-1.5 text-destructive font-medium">
                                · {t("Kritisk", "Critical")}
                              </span>
                            )}
                            {req.priority === "high" && (
                              <span className="ml-1.5 text-orange-500 font-medium">
                                · {t("Høy", "High")}
                              </span>
                            )}
                          </p>
                        </div>
                        {i === 0 ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1.5 shrink-0"
                            onClick={() => navigate("/controls")}
                          >
                            {t("Start her", "Start here")}
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1 shrink-0 text-muted-foreground"
                            onClick={() => navigate("/controls")}
                          >
                            {t("Åpne", "Open")}
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Phase context: what happens + activities */}
              <Card className="bg-muted/30">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      {t("Hva skjer i denne fasen?", "What happens in this phase?")}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isNorwegian ? focusedPhaseData.phase.whatToExpect_no : focusedPhaseData.phase.whatToExpect_en}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {t("Aktiviteter", "Activities")}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {(isNorwegian ? focusedPhaseData.phase.activities_no : focusedPhaseData.phase.activities_en).map((activity) => (
                        <div key={activity} className="flex items-center gap-2 text-sm text-foreground">
                          <Circle className="h-3 w-3 text-muted-foreground shrink-0" />
                          {activity}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mynder tools */}
              {focusedPhaseData.phase.mynderFeatures.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    {t("Verktøy for denne fasen", "Tools for this phase")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {focusedPhaseData.phase.mynderFeatures.map((feature) => (
                      <button
                        key={feature.route}
                        onClick={() => navigate(feature.route)}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left group"
                      >
                        <Layers className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {isNorwegian ? feature.title_no : feature.title_en}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isNorwegian ? feature.description_no : feature.description_en}
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Methodology link */}
          <div className="flex items-center justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground gap-1.5"
              onClick={() => navigate("/resources/maturity")}
            >
              <BookOpen className="h-3.5 w-3.5" />
              {t("Les om vår modenhetsmethodikk", "Read about our maturity methodology")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
