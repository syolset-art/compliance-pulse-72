import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Upload,
  ArrowRight,
  ArrowLeft,
  PartyPopper,
  Send,
  Undo2,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  Pause,
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
  const [showControls, setShowControls] = useState(false);
  const [approvedDeliveries, setApprovedDeliveries] = useState<Set<string>>(
    new Set(),
  );

  const activeDelivery =
    deliveries.find((d) => d.id === activeDeliveryId) ?? deliveries[0];

  const steps = useMemo(
    () => (activeDelivery ? flatten(activeDelivery) : []),
    [activeDelivery],
  );

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

  // Suksess- / godkjenningstilstander beholdes
  if (allDone) {
    return (
      <div className="space-y-4">
        <DeliveryHeader
          deliveries={deliveries}
          activeDelivery={activeDelivery}
          onSwitch={handleSwitchDelivery}
          steps={steps}
          effectiveCursor={effectiveCursor}
        />

        {approvedDeliveries.has(activeDelivery.id) ? (
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
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      toast.success("Leveranserapport sendt til kunde", {
                        description: "Kunden får varsel og kan signere kvittering.",
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
                    Alle {steps.length} aktiviteter er bekreftet. Åpne sammendraget
                    for å se hva Lara har utført og hva du har gjort manuelt —
                    godkjenn for å generere leveranserapport.
                  </p>
                </div>
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
          </Card>
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
  }

  if (!step) return null;

  const laraSteps = step.activity.laraSteps ?? [];
  const partnerSteps = step.activity.partnerSteps ?? [];

  return (
    <div className="space-y-6">
      <DeliveryHeader
        deliveries={deliveries}
        activeDelivery={activeDelivery}
        onSwitch={handleSwitchDelivery}
        steps={steps}
        effectiveCursor={effectiveCursor}
      />

      {/* Steg-info */}
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Steg {effectiveCursor + 1} av {steps.length}
        </p>
        <h2 className="text-2xl font-semibold text-foreground leading-tight">
          {step.activity.label}
        </h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap pt-0.5">
          {step.activity.date && <span>Planlagt {step.activity.date}</span>}
          <Collapsible open={showControls} onOpenChange={setShowControls}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                Vis kontrollpunkter
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    showControls && "rotate-180",
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 text-sm text-foreground">
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                <span className="font-mono text-xs text-muted-foreground mr-2">
                  {step.control.id}
                </span>
                {step.control.name}
                {frameworkLabel && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    · {frameworkLabel}
                  </span>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* To kolonner: Lara har gjort / Du må gjøre */}
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <Column
          icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
          title="Lara har gjort"
          accent="primary"
          items={laraSteps.map((s) => ({
            text: getStepText(s),
            state: "done" as const,
            via: getStepVia(s),
          }))}
        />
        <Column
          icon={<UserDot />}
          title="Du må gjøre"
          accent="muted"
          items={partnerSteps.map((s, i) => ({
            text: s,
            state: i === 0 ? ("pending" as const) : ("todo" as const),
          }))}
        />
      </div>

      {/* Handlingsrad nederst */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setUploadOpen(true)}
          className="gap-2 text-sm text-muted-foreground hover:text-foreground -ml-2"
        >
          <Upload className="h-4 w-4" />
          Last opp eget bevis
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goTo(effectiveCursor - 1)}
            disabled={effectiveCursor === 0}
            aria-label="Forrige steg"
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast("Oppdraget er satt på pause", {
                description: "Du finner det igjen under Pågående oppdrag.",
              })
            }
            className="gap-1.5"
          >
            <Pause className="h-3.5 w-3.5" />
            Pause
          </Button>
          {step.activity.done ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onUndo(activeDelivery.id, step.control.id, step.activity.id)
              }
              className="gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Angre
            </Button>
          ) : (
            <Button
              size="sm"
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
                onConfirm(activeDelivery.id, step.control.id, step.activity.id, {
                  note: `Autogenerert av Lara: ${title}`,
                  files: [file],
                  sharedWithCustomer: true,
                });
                toast.success("Steget er bekreftet ferdig", {
                  description: fileName,
                });
                setTimeout(advance, 250);
              }}
              className="gap-1.5"
            >
              Bekreft ferdig
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Dialoger */}
      {step.activity.laraDraft && (
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

// ---------- Underkomponenter ----------

interface HeaderProps {
  deliveries: DeliveryItem[];
  activeDelivery: DeliveryItem;
  onSwitch: (id: string) => void;
  steps: FlatStep[];
  effectiveCursor: number;
}

const DeliveryHeader = ({
  deliveries,
  activeDelivery,
  onSwitch,
  steps,
  effectiveCursor,
}: HeaderProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span>Pågående oppdrag</span>
        <span aria-hidden="true">/</span>
        <Select value={activeDelivery.id} onValueChange={onSwitch}>
          <SelectTrigger
            aria-label="Velg oppdrag"
            className="h-7 border-0 shadow-none bg-transparent px-1 text-foreground font-medium hover:bg-muted/40 focus:ring-0 [&>svg]:h-4 [&>svg]:w-4"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {deliveries.map((d) => {
              const f = flatten(d);
              const done = f.filter((s) => s.activity.done).length;
              return (
                <SelectItem key={d.id} value={d.id}>
                  <span>{d.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {done}/{f.length}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Segmentert progressbar */}
      <div
        className="flex items-center gap-1.5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={effectiveCursor + 1}
        aria-label={`Fremdrift: steg ${effectiveCursor + 1} av ${steps.length}`}
      >
        {steps.map((s, i) => {
          const done = s.activity.done;
          const active = i === effectiveCursor;
          return (
            <span
              key={`${s.control.id}-${s.activity.id}`}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                done
                  ? "bg-success"
                  : active
                    ? "bg-primary"
                    : "bg-muted",
              )}
            />
          );
        })}
      </div>
    </div>
  );
};

type ItemState = "done" | "pending" | "todo";

interface ColumnItem {
  text: string;
  state: ItemState;
  via?: string;
}

const Column = ({
  icon,
  title,
  items,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  items: ColumnItem[];
  accent: "primary" | "muted";
}) => {
  return (
    <section>
      <h3
        className={cn(
          "flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase mb-4",
          accent === "primary" ? "text-primary" : "text-muted-foreground",
        )}
      >
        <span aria-hidden="true">{icon}</span>
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Ingen punkter.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] leading-snug">
              <StateIcon state={it.state} />
              <span
                className={cn(
                  "flex-1",
                  it.state === "pending" && "text-warning font-medium",
                  it.state === "done" && "text-foreground",
                  it.state === "todo" && "text-foreground",
                )}
              >
                {it.text}
                {it.via && (
                  <span className="ml-2 text-xs font-mono text-muted-foreground">
                    via {it.via}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const StateIcon = ({ state }: { state: ItemState }) => {
  if (state === "done")
    return (
      <CheckCircle2
        className="h-4 w-4 text-success shrink-0 mt-0.5"
        aria-label="Ferdig"
      />
    );
  if (state === "pending")
    return (
      <Clock
        className="h-4 w-4 text-warning shrink-0 mt-0.5"
        aria-label="Venter"
      />
    );
  return (
    <Circle
      className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5"
      aria-label="Gjenstår"
    />
  );
};

const UserDot = () => (
  <span
    className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted-foreground/50"
    aria-hidden="true"
  >
    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70" />
  </span>
);

export const IntegrationBadge = ({ name }: { name: string }) => (
  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/15 shrink-0 leading-none flex items-center">
    via {name}
  </span>
);
