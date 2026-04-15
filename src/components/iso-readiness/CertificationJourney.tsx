import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle, ChevronDown, BookOpen } from "lucide-react";
import { CERTIFICATION_PHASES, getPhaseStatus, type CertificationPhase } from "@/lib/certificationPhases";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CertificationJourneyProps {
  completedPercent: number;
}

export function CertificationJourney({ completedPercent }: CertificationJourneyProps) {
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb";
  const [expandedPhase, setExpandedPhase] = useState<CertificationPhase | null>(null);

  const corePhases = CERTIFICATION_PHASES.filter(p => !p.optional);
  const optionalPhases = CERTIFICATION_PHASES.filter(p => p.optional);

  const togglePhase = (id: CertificationPhase) => {
    setExpandedPhase(prev => prev === id ? null : id);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t("isoReadiness.journey.title")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {completedPercent}% {t("isoReadiness.journey.overall")}
        </span>
      </div>

      {/* Core phases */}
      <div className="space-y-1.5">
        {corePhases.map((phase) => {
          const status = getPhaseStatus(phase.id, completedPercent);
          const name = isNorwegian ? phase.name_no : phase.name_en;
          const isExpanded = expandedPhase === phase.id;

          return (
            <PhaseItem
              key={phase.id}
              phase={phase}
              status={status}
              name={name}
              isExpanded={isExpanded}
              isNorwegian={isNorwegian}
              onToggle={() => togglePhase(phase.id)}
              completedPercent={completedPercent}
            />
          );
        })}
      </div>

      {/* Optional phases separator */}
      <div className="flex items-center gap-2 my-3">
        <div className="h-px flex-1 bg-border" />
        <Badge variant="outline" className="text-[13px] text-muted-foreground font-normal">
          {isNorwegian ? "Valgfritt" : "Optional"}
        </Badge>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Optional phases */}
      <div className="space-y-1.5">
        {optionalPhases.map((phase) => {
          const status = getPhaseStatus(phase.id, completedPercent);
          const name = isNorwegian ? phase.name_no : phase.name_en;
          const isExpanded = expandedPhase === phase.id;

          return (
            <PhaseItem
              key={phase.id}
              phase={phase}
              status={status}
              name={name}
              isExpanded={isExpanded}
              isNorwegian={isNorwegian}
              onToggle={() => togglePhase(phase.id)}
              completedPercent={completedPercent}
              dimmed
            />
          );
        })}
      </div>
    </div>
  );
}

interface PhaseItemProps {
  phase: (typeof CERTIFICATION_PHASES)[number];
  status: 'completed' | 'in_progress' | 'not_started';
  name: string;
  isExpanded: boolean;
  isNorwegian: boolean;
  onToggle: () => void;
  completedPercent: number;
  dimmed?: boolean;
}

function PhaseItem({ phase, status, name, isExpanded, isNorwegian, onToggle, completedPercent, dimmed }: PhaseItemProps) {
  // Calculate activity progress within a phase
  const phaseRange = phase.percentageRange[1] - phase.percentageRange[0];
  const phaseProgress = Math.max(0, Math.min(1, (completedPercent - phase.percentageRange[0]) / phaseRange));
  const activitiesCount = phase.activities_no.length;
  const completedActivities = status === 'completed' ? activitiesCount : Math.floor(phaseProgress * activitiesCount);
  const activities = isNorwegian ? phase.activities_no : phase.activities_en;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left group",
            isExpanded ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/20 hover:bg-muted/50",
            dimmed && status === 'not_started' && "opacity-60"
          )}
        >
          {/* Status icon */}
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors",
            status === 'completed' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
            status === 'in_progress' && "bg-primary/10 text-primary ring-2 ring-primary/30",
            status === 'not_started' && "bg-muted text-muted-foreground"
          )}>
            {status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
            {status === 'in_progress' && (
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            )}
            {status === 'not_started' && <Circle className="w-4 h-4" />}
          </div>

          {/* Phase name and description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-medium",
                status === 'completed' && "text-emerald-600 dark:text-emerald-400",
                status === 'in_progress' && "text-primary",
                status === 'not_started' && "text-muted-foreground"
              )}>
                {name}
              </span>
              {status === 'in_progress' && (
                <Badge variant="outline" className="text-[13px] text-primary border-primary/30">
                  {isNorwegian ? "Aktiv" : "Active"}
                </Badge>
              )}
              {status === 'completed' && (
                <Badge variant="action" className="text-[13px]">
                  {isNorwegian ? "Fullført" : "Complete"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {isNorwegian ? phase.description_no : phase.description_en}
            </p>
          </div>

          {/* Progress indicator */}
          <span className="text-xs text-muted-foreground shrink-0">
            {completedActivities}/{activitiesCount}
          </span>

          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform shrink-0",
            isExpanded && "rotate-180"
          )} />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="ml-10 mr-3 mt-1 mb-2 p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3">
          {/* What to expect */}
          <div>
            <p className="text-xs font-medium text-foreground mb-1">
              {isNorwegian ? "Hva skjer i denne fasen?" : "What happens in this phase?"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isNorwegian ? phase.whatToExpect_no : phase.whatToExpect_en}
            </p>
          </div>

          {/* Activities checklist */}
          <div>
            <p className="text-xs font-medium text-foreground mb-1.5">
              {isNorwegian ? "Aktiviteter" : "Activities"}
            </p>
            <div className="space-y-1">
              {activities.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className={cn(
                    "w-3.5 h-3.5 shrink-0",
                    idx < completedActivities
                      ? "text-emerald-500 dark:text-emerald-400"
                      : "text-muted-foreground/40"
                  )} />
                  <span className={cn(
                    "text-xs",
                    idx < completedActivities ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {activity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Learning content */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-start gap-2">
              <BookOpen className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isNorwegian ? phase.learningContent_no : phase.learningContent_en}
              </p>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
