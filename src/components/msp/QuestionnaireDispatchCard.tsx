import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Clock, Send, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PARTNER_SERVICES, type PartnerService } from "@/lib/serviceCatalog";
import { getQuestionnaire } from "@/lib/questionnaireRegistry";
import {
  useQuestionnaireDeliveries,
  scoreDelivery,
  type QuestionnaireDelivery,
} from "@/hooks/useQuestionnaireDeliveries";

interface Props {
  customerId: string;
  customerName: string;
  partnerName?: string;
}

const QUESTIONNAIRE_SERVICES = PARTNER_SERVICES.filter(
  (s): s is PartnerService & { questionnaireId: NonNullable<PartnerService["questionnaireId"]> } =>
    s.deliveryType === "questionnaire" && !!s.questionnaireId,
);

function formatRelative(iso?: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "i dag";
  if (days === 1) return "1 dag siden";
  return `${days} dager siden`;
}

export function QuestionnaireDispatchCard({ customerId, customerName, partnerName = "din partner" }: Props) {
  const { deliveries, sendDelivery } = useQuestionnaireDeliveries();
  const [sending, setSending] = useState<string | null>(null);

  const forCustomer = useMemo(
    () => deliveries.filter((d) => d.customerId === customerId),
    [deliveries, customerId],
  );

  const latestFor = (serviceId: string): QuestionnaireDelivery | undefined =>
    forCustomer.find((d) => d.serviceId === serviceId);

  const handleSend = (service: typeof QUESTIONNAIRE_SERVICES[number]) => {
    setSending(service.id);
    sendDelivery({
      serviceId: service.id,
      questionnaireId: service.questionnaireId,
      customerId,
      customerName,
      partnerName,
      intro: `Hei! Vi har bestilt en ${service.name.toLowerCase()} for dere. Skjemaet tar ca. ${service.estimatedMinutes ?? 15} minutter.`,
    });
    setTimeout(() => {
      setSending(null);
      toast.success(`${service.name} sendt til ${customerName}`, {
        description: "Kunden ser oppdraget i sin Mynder-innboks.",
      });
    }, 300);
  };

  return (
    <Card className="p-5 border-primary/20 bg-card">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <ClipboardList className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Spørreskjema som tjeneste</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Send et strukturert skjema til {customerName}. Svarene oppdaterer Partner-snapshot og lar
            Lara foreslå konkrete oppfølgingstjenester.
          </p>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {QUESTIONNAIRE_SERVICES.map((service) => {
          const def = getQuestionnaire(service.questionnaireId);
          const latest = latestFor(service.id);
          const isCompleted = latest?.status === "completed";
          const isPending = latest && latest.status !== "completed";
          const score = latest ? scoreDelivery(latest, def.totalQuestions) : null;

          return (
            <div
              key={service.id}
              className="rounded-xl border border-border bg-card/60 p-3 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{service.name}</p>
                  <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    {def.totalQuestions} spørsmål · <Clock className="h-3 w-3" /> {service.estimatedMinutes} min
                  </p>
                </div>
                {service.price && (
                  <Badge variant="outline" className="text-[10px] bg-success/5 text-success border-success/30 shrink-0">
                    {new Intl.NumberFormat("nb-NO").format(service.price)} kr
                  </Badge>
                )}
              </div>

              {isCompleted ? (
                <div className="rounded-md bg-success/10 border border-success/20 p-2 space-y-1">
                  <p className="text-[12px] text-success inline-flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Fullført · {score}% modenhet
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Lara har generert gap-liste nedenfor.
                  </p>
                </div>
              ) : isPending ? (
                <div className="rounded-md bg-warning/10 border border-warning/20 p-2 space-y-1">
                  <p className="text-[12px] text-warning font-medium">Venter på svar</p>
                  <p className="text-[11px] text-muted-foreground">Sendt {formatRelative(latest?.sentAt)}</p>
                </div>
              ) : (
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 mt-auto"
                  onClick={() => handleSend(service)}
                  disabled={sending === service.id}
                >
                  <Send className="h-3.5 w-3.5" />
                  {sending === service.id ? "Sender …" : "Send til kunde"}
                  <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
