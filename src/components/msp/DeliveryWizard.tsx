import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  CheckCircle2,
  FileText,
  Upload,
  ArrowRight,
  ArrowLeft,
  Bot,
  PartyPopper,
  Send,
  Undo2,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DeliveryItem,
  type DeliveryControl,
  type DeliveryActivity,
  getStepText,
  getStepVia,
} from "./MSPMaturityServiceMatrix";
import type { ConfirmPayload, EvidenceFileMeta } from "./ConfirmActivityDialog";
import { ConfirmActivityDialog } from "./ConfirmActivityDialog";
import { LaraDraftDialog } from "./LaraDraftDialog";
import { DeliverySummaryDialog } from "./DeliverySummaryDialog";
import { LaraMechanicsCallout } from "./LaraMechanicsCallout";
import { getService } from "@/lib/serviceCatalog";
import { toast } from "sonner";

interface FlatStep {
  control: DeliveryControl;
  activity: DeliveryActivity;
  index: number;
}

const flatten = (d: DeliveryItem): FlatStep[] =>
  d.controls.flatMap((c) =>
    c.activities.map((a, i) => ({ control: c, activity: a, index: i })),
  );

interface Props {
  deliveries: DeliveryItem[];
  onConfirm: (
    deliveryId: string,
    controlId: string,
    activityId: string,
    payload: ConfirmPayload,
  ) => void;
  onUndo: (deliveryId: string, controlId: string, activityId: string) => void;
}

export const DeliveryWizard = ({ deliveries, onConfirm, onUndo }: Props) => {
  const [activeDeliveryId, setActiveDeliveryId] = useState<string>(
    deliveries[0]?.id ?? "",
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [draftOpen, setDraftOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [approvedDeliveries, setApprovedDeliveries] = useState<Set<string>>(
    new Set(),
  );

  const activeDelivery =
    deliveries.find((d) => d.id === activeDeliveryId) ?? deliveries[0];

  const steps = useMemo(
    () => (activeDelivery ? flatten(activeDelivery) : []),
    [activeDelivery],
  );

  // Auto-park på første ikke-ferdige steg når leveranse byttes
  const initialCursor = useMemo(() => {
    const i = steps.findIndex((s) => !s.activity.done);
    return i === -1 ? Math.max(0, steps.length - 1) : i;
  }, [steps]);

  const cursor = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const effectiveCursor = stepIndex === 0 ? initialCursor : cursor;
  const step = steps[effectiveCursor];

  const doneCount = steps.filter((s) => s.activity.done).length;
  const allDone = steps.length > 0 && doneCount === steps.length;

  const service = activeDelivery?.serviceId
    ? getService(activeDelivery.serviceId)
    : undefined;
  const frameworkLabel = service?.frameworkMappings?.[0]?.frameworkLabel;

  const goTo = (i: number) =>
    setStepIndex(Math.max(0, Math.min(steps.length - 1, i)));

  const advance = () => {
    // gå til neste ikke-ferdige etter dette steget
    const next = steps.findIndex((s, i) => i > effectiveCursor && !s.activity.done);
    if (next !== -1) setStepIndex(next);
  };

  const handleSwitchDelivery = (id: string) => {
    setActiveDeliveryId(id);
    setStepIndex(0);
  };

  if (!activeDelivery || steps.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Ingen pågående oppdrag.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Oppdragvelger + total progresjon */}
      <Card className="p-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <Select value={activeDelivery.id} onValueChange={handleSwitchDelivery}>
              <SelectTrigger className="h-10 border-0 shadow-none bg-transparent px-2 hover:bg-muted/40 [&>span]:text-left">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {deliveries.map((d) => {
                  const f = flatten(d);
                  const done = f.filter((s) => s.activity.done).length;
                  return (
                    <SelectItem key={d.id} value={d.id}>
                      <div className="flex items-center gap-2">
                        <span>{d.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {done}/{f.length}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground px-2">{activeDelivery.meta}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Fremdrift</p>
              <p className="text-sm font-semibold tabular-nums">
                {doneCount}/{steps.length}
              </p>
            </div>
            <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  allDone ? "bg-success" : "bg-primary",
                )}
                style={{ width: `${(doneCount / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Lara-kort (eller suksess) */}
      {allDone ? (
        approvedDeliveries.has(activeDelivery.id) ? (
          <Card className="p-6 border-success/30 bg-gradient-to-br from-success/10 via-success/5 to-transparent">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                <PartyPopper className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Leveranserapport generert
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Rapporten er klar for sending. Trust Profile er beriket med{" "}
                    {steps.reduce(
                      (s, st) => s + (st.activity.evidence?.length ?? 0),
                      0,
                    )}{" "}
                    bevis.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <SummaryStat
                    value={activeDelivery.controls.length.toString()}
                    label="Kontrollpunkter oppfylt"
                  />
                  <SummaryStat
                    value={steps
                      .reduce((s, st) => s + (st.activity.evidence?.length ?? 0), 0)
                      .toString()}
                    label="Bevis lagt ved"
                  />
                  <SummaryStat value="+12 pp" label="TP-økning" />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      toast.success("Leveranserapport sendt til kunde", {
                        description:
                          "Kunden får varsel og kan signere kvittering.",
                      })
                    }
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send leveranserapport til kunde
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSummaryOpen(true)}
                    className="gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Se sammendrag
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Klar for gjennomgang
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Alle {steps.length} aktiviteter er bekreftet. Åpne
                    sammendraget for å se hva Lara har utført og hva du har gjort
                    manuelt — godkjenn for å generere leveranserapport.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <SummaryStat
                    value={steps
                      .reduce((s, st) => s + (st.activity.laraSteps?.length ?? 0), 0)
                      .toString()}
                    label="Steg utført av Lara"
                  />
                  <SummaryStat
                    value={steps
                      .reduce(
                        (s, st) => s + (st.activity.partnerSteps?.length ?? 0),
                        0,
                      )
                      .toString()}
                    label="Steg utført manuelt"
                  />
                  <SummaryStat
                    value={steps
                      .reduce((s, st) => s + (st.activity.evidence?.length ?? 0), 0)
                      .toString()}
                    label="Bevis lagt ved"
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => setSummaryOpen(true)}
                    className="gap-1.5"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Åpne gjennomgang og godkjenn
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )
      ) : step ? (
        <Card className="p-5 md:p-6 border-primary/20 bg-gradient-to-br from-primary/[0.04] via-card to-transparent">
          <div className="flex items-start gap-4">
            {/* Lara-avatar */}
            <div className="relative shrink-0">
              <div className="h-11 w-11 rounded-full bg-primary/15 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping opacity-60" />
            </div>

            <div className="flex-1 min-w-0 space-y-4">
              {/* Kontekst-pill */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] font-mono">
                  {step.control.id}
                </Badge>
                <span className="text-xs text-muted-foreground truncate">{step.control.name}</span>
                {frameworkLabel && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <FileText className="h-3 w-3" />
                    {frameworkLabel}
                  </Badge>
                )}
              </div>

              {/* Lara-melding */}
              <div>
                <p className="text-base font-semibold text-foreground">
                  {step.activity.label}
                </p>
                {step.activity.date && (
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Planlagt: {step.activity.date}
                    {step.activity.owner && <> · Eier: {step.activity.owner}</>}
                  </p>
                )}
              </div>

              {/* Lara + Partner-tråd */}
              {((step.activity.laraSteps && step.activity.laraSteps.length > 0) ||
                (step.activity.partnerSteps &&
                  step.activity.partnerSteps.length > 0)) && (
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {step.activity.laraSteps && step.activity.laraSteps.length > 0 && (
                    <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-3">
                      <p className="text-[11px] font-medium text-primary uppercase tracking-wide flex items-center gap-1.5 mb-2">
                        <Bot className="h-3 w-3" />
                        Lara utfører automatisk
                      </p>
                      <ul className="space-y-1.5">
                        {step.activity.laraSteps.map((s, i) => {
                          const via = getStepVia(s);
                          return (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-[12px] text-foreground"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                              <span className="flex-1">{getStepText(s)}</span>
                              {via && <IntegrationBadge name={via} />}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {step.activity.partnerSteps &&
                    step.activity.partnerSteps.length > 0 && (
                      <div className="rounded-lg border border-border bg-muted/30 p-3">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                          <UserRound className="h-3 w-3" />
                          Du må gjøre manuelt
                        </p>
                        <ul className="space-y-1.5">
                          {step.activity.partnerSteps.map((s, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-[12px] text-foreground"
                            >
                              <span className="text-muted-foreground mt-0.5">·</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}

              {/* Status / handlinger */}
              {step.activity.done ? (
                <div className="rounded-lg bg-success/10 border border-success/20 p-3.5 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Bekreftet ferdig
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {step.activity.evidence?.length
                        ? `${step.activity.evidence.length} bevis lagt ved`
                        : "Ingen bevis lastet opp"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      onUndo(activeDelivery.id, step.control.id, step.activity.id)
                    }
                    className="gap-1.5 text-muted-foreground hover:text-destructive"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    Angre
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-primary/20 bg-background/60 p-3.5 flex items-start gap-3">
                    <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground">
                        Lara genererer leveranserapport automatisk
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        Når du bekrefter ferdig, lager Lara{" "}
                        <span className="font-mono text-foreground">
                          {step.activity.laraDraft?.fileName ??
                            `${step.control.id}-rapport.pdf`}
                        </span>{" "}
                        og legger den klar for sending til kunde.
                      </p>
                    </div>
                    {step.activity.laraDraft && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDraftOpen(true)}
                        className="shrink-0 text-primary hover:text-primary"
                      >
                        Forhåndsvis
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      onClick={() => {
                        const fileName =
                          step.activity.laraDraft?.fileName ??
                          `${step.control.id}-rapport.pdf`;
                        const title =
                          step.activity.laraDraft?.title ??
                          `Leveranserapport: ${step.activity.label}`;
                        const file: EvidenceFileMeta = {
                          id: `lara-${Date.now()}`,
                          name: fileName,
                          size: 124_000,
                          uploadedAt: new Date().toISOString(),
                        };
                        onConfirm(
                          activeDelivery.id,
                          step.control.id,
                          step.activity.id,
                          {
                            note: `Autogenerert av Lara: ${title}`,
                            files: [file],
                            sharedWithCustomer: true,
                          },
                        );
                        toast.success("Rapport generert og klar for sending", {
                          description: fileName,
                        });
                        setTimeout(advance, 250);
                      }}
                      className="gap-1.5"
                    >
                      <Sparkles className="h-4 w-4" />
                      Bekreft ferdig – generer rapport
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setUploadOpen(true)}
                      className="gap-1.5 text-muted-foreground"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Last opp eget bevis i stedet
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      {/* Stepper + navigasjon */}
      <Card className="p-3">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => goTo(effectiveCursor - 1)}
            disabled={effectiveCursor === 0}
            className="h-8 w-8 shrink-0"
            aria-label="Forrige"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 flex items-center justify-center gap-1.5 flex-wrap">
            {steps.map((s, i) => {
              const active = i === effectiveCursor;
              const done = s.activity.done;
              return (
                <button
                  key={`${s.control.id}-${s.activity.id}`}
                  type="button"
                  onClick={() => goTo(i)}
                  title={`${s.control.id} · ${s.activity.label}`}
                  className={cn(
                    "h-2.5 rounded-full transition-all",
                    active
                      ? "w-6 bg-primary"
                      : done
                        ? "w-2.5 bg-success"
                        : "w-2.5 bg-muted hover:bg-muted-foreground/40",
                  )}
                />
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground tabular-nums shrink-0">
            Steg {effectiveCursor + 1}/{steps.length}
          </p>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => goTo(effectiveCursor + 1)}
            disabled={effectiveCursor >= steps.length - 1}
            className="h-8 w-8 shrink-0"
            aria-label="Neste"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Dialoger */}
      {step?.activity.laraDraft && (
        <LaraDraftDialog
          open={draftOpen}
          onOpenChange={setDraftOpen}
          draft={step.activity.laraDraft}
          contextLabel={`${step.control.id} · ${step.activity.label}`}
          onUseAsEvidence={() => {
            const draft = step.activity.laraDraft!;
            const file: EvidenceFileMeta = {
              id: `lara-${Date.now()}`,
              name: draft.fileName,
              size: 124_000,
              uploadedAt: new Date().toISOString(),
            };
            onConfirm(activeDelivery.id, step.control.id, step.activity.id, {
              note: `Generert av Lara: ${draft.title}`,
              files: [file],
              sharedWithCustomer: true,
            });
            setTimeout(advance, 250);
          }}
        />
      )}

      {step && (
        <ConfirmActivityDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          activityLabel={step.activity.label}
          controlId={step.control.id}
          controlName={step.control.name}
          frameworkLabel={frameworkLabel}
          onConfirm={(payload) => {
            onConfirm(activeDelivery.id, step.control.id, step.activity.id, payload);
            setTimeout(advance, 250);
          }}
        />
      )}

      <DeliverySummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        delivery={activeDelivery}
        onApprove={() => {
          setApprovedDeliveries((prev) => {
            const next = new Set(prev);
            next.add(activeDelivery.id);
            return next;
          });
          setSummaryOpen(false);
          toast.success("Leveranserapport generert", {
            description: "Klar for sending til kunde.",
          });
        }}
      />
    </div>
  );
};

const SummaryStat = ({ value, label }: { value: string; label: string }) => (
  <div className="rounded-lg border border-border bg-card p-3">
    <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
    <p className="text-[11px] text-muted-foreground">{label}</p>
  </div>
);

interface ActionTileProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  accent?: boolean;
  onClick: () => void;
}

const ActionTile = ({ icon: Icon, title, desc, accent, onClick }: ActionTileProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-lg border p-3 text-left transition-colors flex items-start gap-2.5",
      accent
        ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
        : "border-border bg-card hover:border-primary/30 hover:bg-muted/30",
    )}
  >
    <div
      className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
        accent ? "bg-primary/15 text-primary" : "bg-muted text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-medium text-foreground">{title}</p>
      <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
    </div>
  </button>
);
