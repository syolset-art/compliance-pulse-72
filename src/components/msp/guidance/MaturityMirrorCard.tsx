import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, Info } from "lucide-react";
import { MATURITY_AREAS } from "@/lib/trustMaturityQuestions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { BaselineAreaProgress } from "@/hooks/useCustomerBaseline";

interface Props {
  areaProgress: BaselineAreaProgress[];
  totalAnswered: number;
  totalQuestions: number;
}

/**
 * Read-only speiling av "Modenhet per kontrollområde" — synlig for partner på
 * Veiledning-tab. Ingen drill-down: kun status. Prosenten er andelen besvarte
 * baseline-spørsmål per område (proxy for modenhet inntil ekte scoring er inne).
 */
export function MaturityMirrorCard({ areaProgress, totalAnswered, totalQuestions }: Props) {
  const trustScore = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;
  const byId = new Map(areaProgress.map((a) => [a.id, a]));

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <ShieldCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Modenhet per kontrollområde</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Estimert fra svar i modenhetsvurderingen. Fyll ut flere spørsmål for et mer presist bilde.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-muted-foreground">Trust Score</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">{trustScore}</span>
          <span className="text-xs text-muted-foreground">/100</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs text-xs">
                Score = andel besvarte spørsmål i modenhetsvurderingen på tvers av alle kontrollområder.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {MATURITY_AREAS.map((area) => {
          const p = byId.get(area.id);
          const answered = p?.answered ?? 0;
          const total = p?.total ?? area.questions.length;
          const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
          const Icon = area.icon;
          return (
            <div key={area.id} className="rounded-lg border border-border/60 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[13px] font-medium text-foreground truncate">{area.title}</span>
                </div>
                <span className={`text-xs tabular-nums shrink-0 ${pct === 0 ? "text-destructive" : pct >= 75 ? "text-success" : "text-warning"}`}>
                  {pct}%
                </span>
              </div>
              <Progress value={pct} className="h-1 mt-2" />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
