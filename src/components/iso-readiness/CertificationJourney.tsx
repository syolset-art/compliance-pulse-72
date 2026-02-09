import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { CERTIFICATION_PHASES, getPhaseStatus, type CertificationPhase } from "@/lib/certificationPhases";
import { cn } from "@/lib/utils";

interface CertificationJourneyProps {
  completedPercent: number;
}

export function CertificationJourney({ completedPercent }: CertificationJourneyProps) {
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">
          {t("isoReadiness.journey.title")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {completedPercent}% {t("isoReadiness.journey.overall")}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        {CERTIFICATION_PHASES.map((phase, index) => {
          const status = getPhaseStatus(phase.id, completedPercent);
          const name = isNorwegian ? phase.name_no : phase.name_en;
          
          return (
            <div key={phase.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                {/* Phase icon */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors",
                  status === 'completed' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
                  status === 'in_progress' && "bg-primary/10 text-primary border-2 border-primary",
                  status === 'not_started' && "bg-muted text-muted-foreground"
                )}>
                  {status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                  {status === 'in_progress' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {status === 'not_started' && <Circle className="w-4 h-4" />}
                </div>
                
                {/* Phase name */}
                <span className={cn(
                  "text-[10px] sm:text-xs text-center font-medium leading-tight",
                  status === 'completed' && "text-emerald-600 dark:text-emerald-400",
                  status === 'in_progress' && "text-primary",
                  status === 'not_started' && "text-muted-foreground"
                )}>
                  {name}
                </span>
              </div>
              
              {/* Connector line */}
              {index < CERTIFICATION_PHASES.length - 1 && (
                <div className={cn(
                  "h-0.5 w-full min-w-4 mt-[-16px]",
                  status === 'completed' ? "bg-emerald-400 dark:bg-emerald-600" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
