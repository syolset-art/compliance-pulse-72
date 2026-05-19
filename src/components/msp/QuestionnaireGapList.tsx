import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { PARTNER_SERVICES } from "@/lib/serviceCatalog";
import { getQuestionnaire } from "@/lib/questionnaireRegistry";
import {
  useQuestionnaireDeliveries,
  scoreDelivery,
} from "@/hooks/useQuestionnaireDeliveries";

interface Props {
  customerId: string;
  onProposeService?: (serviceId: string, fromQuestionnaire: string) => void;
}

interface Gap {
  questionKey: string;
  questionText: string;
  fromQuestionnaire: string;
  suggestedServiceId?: string;
}

/**
 * Vises i partnerens "Veiledning fra Mynder" når kunden har fullført minst
 * ett spørreskjema. Hver "nei" → forslag til oppfølgingstjeneste.
 */
export function QuestionnaireGapList({ customerId, onProposeService }: Props) {
  const { deliveries } = useQuestionnaireDeliveries();

  const { gaps, score, source } = useMemo(() => {
    const completed = deliveries
      .filter((d) => d.customerId === customerId && d.status === "completed")
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

    if (completed.length === 0) return { gaps: [] as Gap[], score: null, source: null };

    const latest = completed[0];
    const def = getQuestionnaire(latest.questionnaireId);
    const items = def.sections.flatMap((s) => s.items);

    const gaps: Gap[] = Object.entries(latest.answers)
      .filter(([, v]) => v === "no")
      .map(([key]) => {
        const item = items.find((i) => i.key === key);
        return {
          questionKey: key,
          questionText: item?.text ?? key,
          fromQuestionnaire: def.title,
          suggestedServiceId: item?.suggestedServiceId,
        };
      });

    return {
      gaps,
      score: scoreDelivery(latest, def.totalQuestions),
      source: def.title,
    };
  }, [deliveries, customerId]);

  if (!source) return null;

  return (
    <Card className="p-5 border-primary/20 bg-card">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground">
              Lara fant {gaps.length} {gaps.length === 1 ? "gap" : "gap"} fra {source}
            </h3>
            {score != null && (
              <Badge variant="outline" className="text-[10px]">
                Modenhet: {score}%
              </Badge>
            )}
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Hver "nei" mapper til en oppfølgingstjeneste fra din katalog.
          </p>
        </div>
      </div>

      {gaps.length === 0 ? (
        <p className="text-[13px] text-success">Ingen åpne gap — kunden er i god rute.</p>
      ) : (
        <ul className="space-y-2">
          {gaps.slice(0, 6).map((g) => {
            const service = g.suggestedServiceId
              ? PARTNER_SERVICES.find((s) => s.id === g.suggestedServiceId)
              : undefined;
            return (
              <li
                key={g.questionKey}
                className="flex items-start gap-2 rounded-md border border-border bg-card/60 p-2.5"
              >
                <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground leading-snug">{g.questionText}</p>
                  {service && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Foreslått tjeneste: <span className="font-medium text-foreground">{service.name}</span>
                      {service.price && (
                        <> · {new Intl.NumberFormat("nb-NO").format(service.price)} kr</>
                      )}
                    </p>
                  )}
                </div>
                {service && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] gap-1 shrink-0"
                    onClick={() => onProposeService?.(service.id, source)}
                  >
                    Foreslå
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </li>
            );
          })}
          {gaps.length > 6 && (
            <li className="text-[12px] text-muted-foreground text-center pt-1">
              + {gaps.length - 6} til
            </li>
          )}
        </ul>
      )}
    </Card>
  );
}
