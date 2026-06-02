import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
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
  Eye,
  Upload,
  Send,
  Users,
  Save,
  Sparkles,
  Paperclip,
  CheckCircle2,
  Clock,
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
import { PartnerEvidenceUploadDialog } from "./PartnerEvidenceUploadDialog";
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

const ANSWER_OPTIONS: Array<{ key: string; label: string; cls: string }> = [
  { key: "yes", label: "Ja", cls: "bg-success/10 text-success border-success/30" },
  { key: "partial", label: "Delvis", cls: "bg-warning/10 text-warning border-warning/30" },
  { key: "no", label: "Nei", cls: "bg-destructive/10 text-destructive border-destructive/30" },
  { key: "na", label: "Ikke relevant", cls: "bg-muted text-muted-foreground border-border" },
];

export function QuestionnaireDispatchCard({ customerId, customerName, partnerName = "din partner" }: Props) {
  const { deliveries } = useQuestionnaireDeliveries();
  const [detailsFor, setDetailsFor] = useState<QService | null>(null);
  const [offerFor, setOfferFor] = useState<QService | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

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
              Fyll ut selv, samarbeid med {customerName}, eller last opp en rapport så svarer Lara ut det den dekker.
            </p>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {QUESTIONNAIRE_SERVICES.map((service) => {
            const def = getQuestionnaire(service.questionnaireId);
            const latest = latestFor(service.id);
            const isCompleted = latest?.status === "completed";
            const score = latest ? scoreDelivery(latest, def.totalQuestions) : null;
            const frameworks = service.frameworkMappings.map((f) => f.frameworkLabel).join(", ");

            return (
              <button
                key={service.id}
                type="button"
                onClick={() => setDetailsFor(service)}
                className="text-left rounded-xl border border-border bg-card/60 p-3 hover:border-primary/40 hover:bg-primary/[0.03] transition-colors flex flex-col gap-1.5"
              >
                <p className="text-[13px] font-semibold text-foreground truncate">{service.name}</p>
                <p className="text-xs text-muted-foreground">
                  {def.totalQuestions} spørsmål for å berike modenhet innen {frameworks || "kundens regelverk"}.
                </p>
                {isCompleted ? (
                  <p className="text-[11px] text-success inline-flex items-center gap-1 font-medium mt-auto">
                    <CheckCircle2 className="h-3 w-3" /> Fullført · {score}% modenhet
                  </p>
                ) : (
                  <p className="text-[11px] text-primary inline-flex items-center gap-1 mt-auto">
                    <Eye className="h-3 w-3" /> Forhåndsvis
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Forhåndsvisning — viser hvordan skjemaet ser ut + alle partner-handlinger */}
      <Dialog open={!!detailsFor} onOpenChange={(o) => !o && setDetailsFor(null)}>
        <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              {detailsFor?.name}
            </DialogTitle>
            <DialogDescription>
              {detailsDef?.totalQuestions} spørsmål · ca. {detailsFor?.estimatedMinutes} min ·
              berikker modenhet innen {detailsFor?.frameworkMappings.map((f) => f.frameworkLabel).join(", ")}.
            </DialogDescription>
          </DialogHeader>

          {detailsDef && detailsFor && (
            <div className="flex-1 min-h-0 flex flex-col gap-3">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-[12px] text-foreground/85 flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p>
                  Standard svaralternativer: <span className="font-medium text-foreground">Ja</span>,
                  <span className="font-medium text-foreground"> Delvis</span>,
                  <span className="font-medium text-foreground"> Nei</span>,
                  <span className="font-medium text-foreground"> Ikke relevant</span>. På hvert spørsmål kan dere laste opp dokumentasjon.
                </p>
              </div>

              <ScrollArea className="flex-1 min-h-[260px] rounded-lg border border-border bg-muted/20">
                <div className="p-3 space-y-4">
                  {detailsDef.sections.map((section, sIdx) => (
                    <div key={section.id} className="space-y-2">
                      <p className="text-[12px] font-semibold text-foreground">
                        {sIdx + 1}. {section.title}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          ({section.items.length})
                        </span>
                      </p>
                      <div className="space-y-2">
                        {section.items.slice(0, 3).map((item, iIdx) => (
                          <div
                            key={item.key}
                            className="rounded-md border border-border bg-card p-2.5 space-y-2"
                          >
                            <p className="text-[12px] text-foreground/90">
                              <span className="text-muted-foreground mr-1">{sIdx + 1}.{iIdx + 1}</span>
                              {item.text}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {ANSWER_OPTIONS.map((opt) => (
                                <span
                                  key={opt.key}
                                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${opt.cls}`}
                                >
                                  {opt.label}
                                </span>
                              ))}
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground ml-1">
                                <Paperclip className="h-3 w-3" /> Dokumentasjon
                              </span>
                            </div>
                          </div>
                        ))}
                        {section.items.length > 3 && (
                          <p className="text-[11px] text-muted-foreground italic px-1">
                            + {section.items.length - 3} flere spørsmål i denne seksjonen
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                setDetailsFor(null);
                setEvidenceOpen(true);
              }}
            >
              <Upload className="h-4 w-4" /> Last opp rapport
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                toast.success("Sendt til kunden", {
                  description: `${detailsFor?.name} delt med ${customerName} for felles utfylling.`,
                });
                setDetailsFor(null);
              }}
            >
              <Send className="h-4 w-4" /> Send til kunden
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                toast.success("Felles utfylling startet", {
                  description: `Du og ${customerName} kan svare hver for dere.`,
                });
                setDetailsFor(null);
              }}
            >
              <Users className="h-4 w-4" /> Fyll ut sammen
            </Button>
            <Button
              className="gap-1.5"
              onClick={() => {
                const svc = detailsFor;
                setDetailsFor(null);
                setOfferFor(svc);
              }}
            >
              <Save className="h-4 w-4" /> Lagre som tilbud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PartnerEvidenceUploadDialog
        open={evidenceOpen}
        onOpenChange={setEvidenceOpen}
        customerId={customerId}
      />

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
          coveredControls={offerFor.frameworkMappings?.map(fm => ({
            frameworkId: fm.frameworkId,
            frameworkLabel: fm.frameworkLabel,
            controlIds: fm.controlIds,
          }))}
        />
      )}
    </>
  );
}
