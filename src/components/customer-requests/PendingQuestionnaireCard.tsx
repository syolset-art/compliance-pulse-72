import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Clock, ArrowRight } from "lucide-react";
import { getQuestionnaire } from "@/lib/questionnaireRegistry";
import { PARTNER_SERVICES } from "@/lib/serviceCatalog";
import {
  useQuestionnaireDeliveries,
  type QuestionnaireDelivery,
} from "@/hooks/useQuestionnaireDeliveries";
import { AnswerQuestionnaireDialog } from "./AnswerQuestionnaireDialog";

/**
 * Vises øverst i kundens inbox når en partner har bestilt et spørreskjema.
 * Vises ikke når det ikke er noe å gjøre.
 */
export function PendingQuestionnaireCard() {
  const { deliveries } = useQuestionnaireDeliveries();
  const [active, setActive] = useState<QuestionnaireDelivery | null>(null);

  const pending = useMemo(
    () => deliveries.filter((d) => d.status !== "completed"),
    [deliveries],
  );

  if (pending.length === 0) return null;

  return (
    <>
      <div className="space-y-2">
        {pending.map((d) => {
          const def = getQuestionnaire(d.questionnaireId);
          const service = PARTNER_SERVICES.find((s) => s.id === d.serviceId);
          const answered = Object.keys(d.answers).length;
          const isInProgress = answered > 0;

          return (
            <Card
              key={d.id}
              className="p-4 border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <ClipboardList className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      {d.partnerName} har bestilt: {service?.name ?? def.title}
                    </span>
                    {isInProgress && (
                      <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">
                        Pågår
                      </Badge>
                    )}
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-snug">
                    {d.intro || def.intro}
                  </p>
                  <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    {def.totalQuestions} spørsmål
                    {service?.estimatedMinutes && (
                      <> · <Clock className="h-3 w-3" /> ca. {service.estimatedMinutes} min</>
                    )}
                    {isInProgress && <> · {answered} av {def.totalQuestions} besvart</>}
                  </p>
                </div>
                <Button size="sm" className="h-8 gap-1.5 shrink-0" onClick={() => setActive(d)}>
                  {isInProgress ? "Fortsett" : "Besvar nå"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <AnswerQuestionnaireDialog
        delivery={active}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
      />
    </>
  );
}
