import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, CheckCircle2, Circle, Clock, Target,
  TrendingUp, BookOpen, Shield, Layers,
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
import { CertificationJourney } from "@/components/iso-readiness/CertificationJourney";
import { cn } from "@/lib/utils";

export default function MaturityDashboard() {
  const navigate = useNavigate();
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
        (r) =>
          getPhaseForRequirement(r.category, r.priority, r.sla_category) === phase.id
      );
      const total = phaseReqs.length;
      const completed = phaseReqs.filter((r) => r.status === "completed").length;
      const inProgress = phaseReqs.filter((r) => r.status === "in_progress").length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const status = getPhaseStatus(phase.id, score);

      // Top 3 incomplete requirements for this phase
      const remaining = phaseReqs
        .filter((r) => r.status !== "completed")
        .sort((a, b) => {
          const prio = { critical: 0, high: 1, medium: 2, low: 3 };
          return (prio[a.priority as keyof typeof prio] ?? 3) - (prio[b.priority as keyof typeof prio] ?? 3);
        })
        .slice(0, 3);

      return { phase, total, completed, inProgress, percent, status, remaining };
    });
  }, [requirements, score]);

  // Current phase (first in_progress)
  const currentPhaseData = phaseData.find((p) => p.status === "in_progress") || phaseData[0];
  const nextPhaseData = phaseData.find(
    (p) => p.status === "not_started" && !p.phase.optional
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("Modenhet", "Maturity")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t(
                  "Se hvor du er og hva som gjenstår for neste milepæl",
                  "See where you are and what's left for the next milestone"
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t("Modenhetsnivå", "Maturity level")}</p>
                <p className="text-lg font-bold text-primary">
                  {isNorwegian ? maturityInfo.name_no : maturityInfo.name_en}
                </p>
              </div>
              <div className="relative w-14 h-14">
                <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${score * 0.94} 100`}
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                  {score}%
                </span>
              </div>
            </div>
          </div>

          {/* Journey stepper */}
          <Card className="p-4">
            <CertificationJourney completedPercent={score} />
          </Card>

          {/* Current phase detail */}
          {currentPhaseData && (
            <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {t("Nåværende fase", "Current phase")}: {isNorwegian ? currentPhaseData.phase.name_no : currentPhaseData.phase.name_en}
                  </CardTitle>
                  <Badge variant="outline" className="gap-1 text-xs bg-primary/10 text-primary border-primary/30">
                    <Clock className="h-3 w-3" />
                    {t("Pågår", "In progress")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {isNorwegian ? currentPhaseData.phase.description_no : currentPhaseData.phase.description_en}
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {currentPhaseData.completed}/{currentPhaseData.total} {t("krav fullført", "requirements completed")}
                      </span>
                      <span className="font-semibold text-foreground">{currentPhaseData.percent}%</span>
                    </div>
                    <Progress value={currentPhaseData.percent} className="h-2" />
                  </div>
                </div>

                {/* Remaining requirements */}
                {currentPhaseData.remaining.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("Neste oppgaver", "Next tasks")}
                    </p>
                    {currentPhaseData.remaining.map((req) => (
                      <div
                        key={req.requirement_id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {isNorwegian && req.name_no ? req.name_no : req.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {req.requirement_id} · {req.priority}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 shrink-0"
                          onClick={() => navigate(`/controls`)}
                        >
                          {t("Åpne", "Open")}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Phase activities */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {(isNorwegian ? currentPhaseData.phase.activities_no : currentPhaseData.phase.activities_en).map((activity) => (
                    <div key={activity} className="text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5 text-center">
                      {activity}
                    </div>
                  ))}
                </div>

                {/* Mynder features for this phase */}
                {currentPhaseData.phase.mynderFeatures.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("Mynder-verktøy for denne fasen", "Mynder tools for this phase")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentPhaseData.phase.mynderFeatures.map((feature) => (
                        <button
                          key={feature.route}
                          onClick={() => navigate(feature.route)}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left group"
                        >
                          <Layers className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0">
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
              </CardContent>
            </Card>
          )}

          {/* All phases overview */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {t("Alle faser", "All phases")}
            </h2>
            <div className="grid gap-3">
              {phaseData.map(({ phase, total, completed, percent, status, remaining }) => {
                const isCurrent = status === "in_progress";
                const isDone = status === "completed";

                return (
                  <Card
                    key={phase.id}
                    className={cn(
                      "transition-all",
                      isCurrent && "border-primary/30",
                      isDone && "opacity-70"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          isDone ? "bg-primary text-primary-foreground" :
                          isCurrent ? "bg-primary/10 border-2 border-primary text-primary" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-bold">
                              {CERTIFICATION_PHASES.findIndex((p) => p.id === phase.id) + 1}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-semibold text-foreground">
                              {isNorwegian ? phase.name_no : phase.name_en}
                            </h3>
                            {phase.optional && (
                              <Badge variant="outline" className="text-[10px] h-4">
                                {t("Valgfri", "Optional")}
                              </Badge>
                            )}
                            {isCurrent && (
                              <Badge className="text-[10px] h-4 bg-primary/10 text-primary border-primary/30">
                                {t("Nå", "Now")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {isNorwegian ? phase.description_no : phase.description_en}
                          </p>
                        </div>

                        <div className="text-right shrink-0 w-20">
                          <span className="text-lg font-bold text-foreground">{percent}%</span>
                          <p className="text-[10px] text-muted-foreground">
                            {completed}/{total}
                          </p>
                        </div>
                      </div>

                      {(isCurrent || isDone) && (
                        <Progress value={percent} className="h-1.5 mt-3" />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

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
