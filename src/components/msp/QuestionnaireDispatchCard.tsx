import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Eye,
  FileText,
  Download,
  Mail,
  Save,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { PARTNER_SERVICES, type PartnerService } from "@/lib/serviceCatalog";
import { getQuestionnaire } from "@/lib/questionnaireRegistry";
import {
  useQuestionnaireDeliveries,
  scoreDelivery,
  type QuestionnaireDelivery,
} from "@/hooks/useQuestionnaireDeliveries";
import { MSPCreateOfferDialog } from "./MSPCreateOfferDialog";
import type { TaskEstimate } from "./MSPMaturityServiceMatrix";

interface Props {
  customerId: string;
  customerName: string;
  partnerName?: string;
}

type QService = PartnerService & { questionnaireId: NonNullable<PartnerService["questionnaireId"]> };

const QUESTIONNAIRE_SERVICES = PARTNER_SERVICES.filter(
  (s): s is QService => s.deliveryType === "questionnaire" && !!s.questionnaireId,
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
  const { deliveries } = useQuestionnaireDeliveries();
  const [detailsFor, setDetailsFor] = useState<QService | null>(null);
  const [offerFor, setOfferFor] = useState<QService | null>(null);

  const forCustomer = useMemo(
    () => deliveries.filter((d) => d.customerId === customerId),
    [deliveries, customerId],
  );

  const latestFor = (serviceId: string): QuestionnaireDelivery | undefined =>
    forCustomer.find((d) => d.serviceId === serviceId);

  const detailsDef = detailsFor ? getQuestionnaire(detailsFor.questionnaireId) : null;

  const offerTasks: TaskEstimate[] = offerFor
    ? offerFor.defaultChecklist.map((label) => ({
        label,
        hours: Math.max(1, Math.round((offerFor.estimatedMinutes ?? 15) / 15)),
        owner: "Partner",
      }))
    : [];

  return (
    <>
      <Card className="p-5 border-primary/20 bg-card">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Spørreskjema som tjeneste</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Forhåndsdefinerte skjemaer du kan aktivere som tilbud til {customerName}. Se hva skjemaet
              inneholder før du lagrer det som tilbud, laster ned PDF eller sender på e-post.
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
                    <p className="text-[12px] text-warning font-medium">Lagret som aktivt tilbud</p>
                    <p className="text-[11px] text-muted-foreground">Lagt til {formatRelative(latest?.sentAt)}</p>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 mt-auto"
                    onClick={() => setDetailsFor(service)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Se detaljer
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detalj-dialog — vis hva skjemaet inneholder før det aktiveres som tilbud */}
      <Dialog open={!!detailsFor} onOpenChange={(o) => !o && setDetailsFor(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              {detailsFor?.name}
            </DialogTitle>
            <DialogDescription>
              {detailsFor?.description}
            </DialogDescription>
          </DialogHeader>

          {detailsDef && detailsFor && (
            <div className="flex-1 min-h-0 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2 text-[12px]">
                <Badge variant="outline" className="gap-1">
                  <ListChecks className="h-3 w-3" /> {detailsDef.totalQuestions} spørsmål
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" /> ca. {detailsFor.estimatedMinutes} min
                </Badge>
                {detailsFor.price && (
                  <Badge variant="outline" className="bg-success/5 text-success border-success/30">
                    {new Intl.NumberFormat("nb-NO").format(detailsFor.price)} kr
                  </Badge>
                )}
                {detailsFor.frameworkMappings.map((fm) => (
                  <Badge key={fm.frameworkId} variant="secondary" className="text-[10px]">
                    {fm.frameworkLabel}
                  </Badge>
                ))}
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 text-[12px] text-muted-foreground">
                <p className="font-medium text-foreground mb-1 inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Introduksjon kunden ser
                </p>
                {detailsDef.intro}
              </div>

              <ScrollArea className="flex-1 min-h-[200px] rounded-lg border border-border">
                <div className="p-3 space-y-4">
                  {detailsDef.sections.map((section, sIdx) => (
                    <div key={section.id}>
                      <p className="text-[12px] font-semibold text-foreground mb-1.5">
                        {sIdx + 1}. {section.title}
                        <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                          ({section.items.length} spørsmål)
                        </span>
                      </p>
                      <ol className="space-y-1.5 pl-4 list-decimal marker:text-muted-foreground">
                        {section.items.map((item) => (
                          <li key={item.key} className="text-[12px] text-foreground/90">
                            {item.text}
                            {item.reference && (
                              <span className="ml-1 text-[11px] text-muted-foreground">
                                — {item.reference}
                              </span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                toast.success("Skjema lastet ned som PDF", {
                  description: `${detailsFor?.name} er klar for deling.`,
                });
              }}
            >
              <Download className="h-4 w-4" /> Last ned PDF
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                toast.success("E-post forberedt", {
                  description: `Sender ${detailsFor?.name} til ${customerName} som vedlegg.`,
                });
              }}
            >
              <Mail className="h-4 w-4" /> Del på e-post
            </Button>
            <Button
              className="gap-1.5"
              onClick={() => {
                const svc = detailsFor;
                setDetailsFor(null);
                setOfferFor(svc);
              }}
            >
              <Save className="h-4 w-4" /> Legg til som tilbud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tilbudsverktøy — lagre under "Tilbud"-fanen */}
      {offerFor && (
        <MSPCreateOfferDialog
          open={!!offerFor}
          onOpenChange={(o) => !o && setOfferFor(null)}
          serviceTitle={offerFor.name}
          domainName={offerFor.name}
          variant="Tjeneste"
          partnerName={partnerName}
          customerContactName={customerName}
          defaultTasks={offerTasks}
          defaultMessage={`Hei! Vi foreslår å gjennomføre «${offerFor.name}» for dere. Skjemaet inneholder ${getQuestionnaire(offerFor.questionnaireId).totalQuestions} spørsmål og tar ca. ${offerFor.estimatedMinutes ?? 15} minutter å besvare.`}
          attachGap={false}
        />
      )}
    </>
  );
}
