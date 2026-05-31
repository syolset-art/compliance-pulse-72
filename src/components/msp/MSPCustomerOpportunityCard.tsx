import { useMemo } from "react";
import { TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FRAMEWORK_CATALOG } from "@/lib/frameworkCoverageCatalog";

interface Props {
  customerName: string;
  hourlyRate?: number; // partner default
  customerCoveragePct?: number; // hvor mye kunden allerede dekker (0-100)
  onCreateOffer?: (frameworkId: string) => void;
}

/**
 * Aggregert tjenestepotensial for partneren basert på antatt udekket
 * andel av kontrollpunkter i de aktiverte rammeverkene. Bruker
 * frameworkCoverageCatalog.hoursByLevel som heuristikk.
 */
export function MSPCustomerOpportunityCard({
  customerName,
  hourlyRate = 1500,
  customerCoveragePct = 45,
  onCreateOffer,
}: Props) {
  const opportunities = useMemo(() => {
    const uncovered = Math.max(0, Math.min(1, (100 - customerCoveragePct) / 100));
    return FRAMEWORK_CATALOG.slice(0, 4).map(fw => {
      const totalGapHours = fw.controlPoints.reduce(
        (sum, cp) => sum + cp.hoursByLevel.partial, 0
      );
      const hours = Math.round(totalGapHours * uncovered);
      return {
        id: fw.id,
        name: fw.label,
        hours,
        amount: hours * hourlyRate,
        points: fw.controlPoints.length,
        gapPoints: Math.round(fw.controlPoints.length * uncovered),
      };
    }).filter(o => o.hours > 0).sort((a, b) => b.amount - a.amount);
  }, [customerCoveragePct, hourlyRate]);

  const total = opportunities.reduce((sum, o) => sum + o.amount, 0);
  const totalHours = opportunities.reduce((sum, o) => sum + o.hours, 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Inntekts- og tjenestepotensial
            </h3>
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Lara har estimert restgapet hos {customerName} basert på aktive regelverk og typetimer per kontrollpunkt.
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total</p>
          <p className="text-xl font-bold text-primary tabular-nums">
            {total.toLocaleString("nb-NO")} kr
          </p>
          <p className="text-[12px] text-muted-foreground">{totalHours} t · {hourlyRate} kr/t</p>
        </div>
      </div>

      <div className="space-y-2">
        {opportunities.map(o => (
          <div
            key={o.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-3 hover:border-primary/40 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground truncate">{o.name}</span>
                <Badge variant="secondary" className="text-xs h-5">
                  {o.gapPoints}/{o.points} KP å dekke
                </Badge>
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Estimert {o.hours} timer for å lukke restgap til delvis dekning
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {o.amount.toLocaleString("nb-NO")} kr
              </p>
              {onCreateOffer && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[12px] text-primary"
                  onClick={() => onCreateOffer(o.id)}
                >
                  Lag tilbud <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {opportunities.length === 0 && (
          <p className="text-[13px] text-muted-foreground py-4 text-center">
            Ingen åpenbare gap akkurat nå — kunden er i god rute.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-[12px] text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5 text-success" />
        <span>Beløpene er retningsgivende — juster timepris og dekningsnivå i Tjenestekatalogen for nøyaktig tilbud.</span>
      </div>
    </div>
  );
}
