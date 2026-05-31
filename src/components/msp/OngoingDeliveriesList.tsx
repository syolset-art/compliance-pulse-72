import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  Clock,
  FileText,
  Sparkles,
  Send,
  ShieldCheck,
  PartyPopper,
  Paperclip,
  MinusCircle,
  User as UserIcon,
  ClipboardList,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DeliveryItem,
  type DeliveryActivity,
  type DeliveryControl,
  type ActivityStatus,
} from "./MSPMaturityServiceMatrix";
import type { ConfirmPayload } from "./ConfirmActivityDialog";
import { ConfirmActivityDialog } from "./ConfirmActivityDialog";
import { DeliverySummaryDialog } from "./DeliverySummaryDialog";
import { SendDeliveryReportDialog } from "./SendDeliveryReportDialog";
import { getService } from "@/lib/serviceCatalog";
import { addDeliveryReport, type DeliveryReport } from "@/lib/deliveryReports";
import { toast } from "sonner";

type ActivityFilter = "all" | "not_started" | "in_progress" | "not_relevant" | "done" | "evidence";

interface DeliveryMeta {
  reportGeneratedAt?: string;
  reportFileName?: string;
  sentToCustomerAt?: string;
  customerApprovedAt?: string;
}

interface Props {
  deliveries: DeliveryItem[];
  customerName: string;
  customerEmail?: string;
  onConfirm: (
    deliveryId: string,
    controlId: string,
    activityId: string,
    payload: ConfirmPayload,
  ) => void;
  onUndo: (deliveryId: string, controlId: string, activityId: string) => void;
  onSetStatus?: (
    deliveryId: string,
    controlId: string,
    activityId: string,
    status: ActivityStatus,
  ) => void;
}

const getStatus = (a: DeliveryActivity): ActivityStatus => {
  if (a.status) return a.status;
  return a.done ? "done" : "in_progress";
};

const STATUS_META: Record<
  ActivityStatus,
  { label: string; Icon: React.ComponentType<{ className?: string }>; cls: string; activeCls: string }
> = {
  not_started: {
    label: "Ikke påstartet",
    Icon: Circle,
    cls: "text-muted-foreground",
    activeCls: "bg-muted text-foreground border-border ring-1 ring-border",
  },
  in_progress: {
    label: "Pågår",
    Icon: Clock,
    cls: "text-warning",
    activeCls: "bg-warning/10 text-warning border-warning/40 ring-1 ring-warning/30",
  },
  not_relevant: {
    label: "Ikke aktuelt",
    Icon: MinusCircle,
    cls: "text-muted-foreground",
    activeCls: "bg-secondary text-foreground border-border ring-1 ring-border",
  },
  done: {
    label: "Fullført",
    Icon: CheckCircle2,
    cls: "text-success",
    activeCls: "bg-success/10 text-success border-success/40 ring-1 ring-success/30",
  },
};

export const OngoingDeliveriesList = ({
  deliveries,
  customerName,
  customerEmail,
  onConfirm,
  onUndo,
  onSetStatus,
}: Props) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<Record<string, ActivityFilter>>({});
  const [confirmCtx, setConfirmCtx] = useState<{
    open: boolean;
    deliveryId?: string;
    controlId?: string;
    activityId?: string;
    readOnly?: boolean;
    /** Forhåndsvalgt status — settes når dialogen åpnes via en status-knapp (f.eks. "Fullført"). */
    intendedStatus?: ActivityStatus;
  }>({ open: false });
  const [summaryCtx, setSummaryCtx] = useState<{ open: boolean; deliveryId?: string }>({
    open: false,
  });
  const [sendCtx, setSendCtx] = useState<{ open: boolean; deliveryId?: string }>({
    open: false,
  });
  const [meta, setMeta] = useState<Record<string, DeliveryMeta>>({});

  const getMeta = (id: string): DeliveryMeta => meta[id] ?? {};

  const getFilter = (id: string): ActivityFilter => filter[id] ?? "all";

  const openConfirm = (
    deliveryId: string,
    controlId: string,
    activityId: string,
    intendedStatus?: ActivityStatus,
  ) => {
    setConfirmCtx({ open: true, deliveryId, controlId, activityId, intendedStatus });
  };


  const confirmCtxResolved = useMemo(() => {
    if (!confirmCtx.open) return null;
    const d = deliveries.find((x) => x.id === confirmCtx.deliveryId);
    const c = d?.controls.find((x) => x.id === confirmCtx.controlId);
    const a = c?.activities.find((x) => x.id === confirmCtx.activityId);
    if (!d || !c || !a) return null;
    const service = d.serviceId ? getService(d.serviceId) : undefined;
    return {
      d,
      c,
      a,
      frameworkLabel: service?.frameworkMappings?.[0]?.frameworkLabel,
    };
  }, [confirmCtx, deliveries]);

  const summaryDelivery = summaryCtx.deliveryId
    ? deliveries.find((d) => d.id === summaryCtx.deliveryId)
    : undefined;

  const sendDelivery = sendCtx.deliveryId
    ? deliveries.find((d) => d.id === sendCtx.deliveryId)
    : undefined;

  const handleApproveReport = (delivery: DeliveryItem) => {
    const fileName = `${slug(delivery.title)}-leveranserapport.pdf`;
    setMeta((m) => ({
      ...m,
      [delivery.id]: {
        ...m[delivery.id],
        reportGeneratedAt: new Date().toISOString(),
        reportFileName: fileName,
      },
    }));
    setSummaryCtx({ open: false });
    toast.success("Leveranserapport generert", {
      description: `${fileName} er klar til å sendes til kunden.`,
    });
  };

  const handleSendReport = (delivery: DeliveryItem, payload: { email: string; message: string }) => {
    const m = getMeta(delivery.id);
    const service = delivery.serviceId ? getService(delivery.serviceId) : undefined;
    const frameworkLabel = service?.frameworkMappings?.[0]?.frameworkLabel;
    const allActivities = delivery.controls.flatMap((c) => c.activities);
    const evidenceCount = allActivities.reduce(
      (s, a) => s + (a.evidence?.length ?? 0),
      0,
    );
    const report: DeliveryReport = {
      id: `${delivery.id}-${Date.now()}`,
      deliveryId: delivery.id,
      deliveryTitle: delivery.title,
      frameworkLabel,
      fileName: m.reportFileName ?? `${slug(delivery.title)}-leveranserapport.pdf`,
      message: payload.message,
      customerName,
      customerEmail: payload.email,
      sentAt: new Date().toISOString(),
      status: "sent",
      controlIds: delivery.controls.map((c) => c.id),
      activitiesCount: allActivities.length,
      evidenceCount,
      maturityDeltaPercent: Math.min(12, Math.max(4, delivery.controls.length * 3)),
    };
    addDeliveryReport(report);
    setMeta((mm) => ({
      ...mm,
      [delivery.id]: {
        ...mm[delivery.id],
        sentToCustomerAt: new Date().toISOString(),
      },
    }));
    setSendCtx({ open: false });
    toast.success("Sendt til kunde", {
      description: `${customerName} kan godkjenne rapporten i sin meldingsboks.`,
    });
  };

  if (deliveries.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <p className="text-sm">Ingen pågående oppdrag.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hva er dette? */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Din arbeidsstasjon</p>
            <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
              Hvert oppdrag er et sett spørsmål du svarer ut sammen med agenter. For hvert spørsmål setter du om det er
              <span className="text-foreground font-medium"> ikke påstartet</span>,
              <span className="text-foreground font-medium"> pågår</span>,
              <span className="text-foreground font-medium"> ikke aktuelt</span>{" "}
              eller
              <span className="text-foreground font-medium"> fullført</span>.
              Når alle er svart ut, genereres rapporten til {customerName} automatisk og kundens modenhet økes på de tilhørende kontrollpunktene.
            </p>
          </div>
        </div>
      </Card>

      {deliveries.map((d) => {
        const isOpen = expanded === d.id;
        const allActivities = d.controls.flatMap((c) => c.activities);
        const total = allActivities.length;
        const statusCounts = {
          not_started: allActivities.filter((a) => getStatus(a) === "not_started").length,
          in_progress: allActivities.filter((a) => getStatus(a) === "in_progress").length,
          not_relevant: allActivities.filter((a) => getStatus(a) === "not_relevant").length,
          done: allActivities.filter((a) => getStatus(a) === "done").length,
        };
        const resolved = statusCounts.done + statusCounts.not_relevant;
        const allResolved = total > 0 && resolved === total;
        const resolvedPct = total > 0 ? Math.round((resolved / total) * 100) : 0;
        const evidenceCount = allActivities.reduce(
          (s, a) => s + (a.evidence?.length ?? 0),
          0,
        );
        const service = d.serviceId ? getService(d.serviceId) : undefined;
        const frameworkLabel = service?.frameworkMappings?.[0]?.frameworkLabel;
        const m = getMeta(d.id);
        const reportSent = !!m.sentToCustomerAt;
        const reportReady = !!m.reportGeneratedAt;
        const f = getFilter(d.id);

        return (
          <Card
            key={d.id}
            className="overflow-hidden hover:border-primary/30 transition-colors"
          >
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : d.id)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 cursor-pointer"
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  reportSent
                    ? "bg-primary/10"
                    : reportReady || allResolved
                      ? "bg-success/10"
                      : "bg-warning/10",
                )}
              >
                {reportSent ? (
                  <Send className="h-4 w-4 text-primary" />
                ) : reportReady || allResolved ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <ClipboardList className="h-4 w-4 text-warning" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {d.title}
                  </p>
                  {frameworkLabel && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <FileText className="h-3 w-3" />
                      {frameworkLabel}
                    </Badge>
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground">{d.meta}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Progress value={resolvedPct} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    {resolved}/{total} svart ut · {resolvedPct}%
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs shrink-0",
                  reportSent
                    ? "bg-primary/10 text-primary border-primary/30"
                    : reportReady
                      ? "bg-success/10 text-success border-success/30"
                      : allResolved
                        ? "bg-success/10 text-success border-success/30"
                        : "bg-warning/10 text-warning border-warning/30",
                )}
              >
                {reportSent
                  ? "Sendt – venter godkjenning"
                  : reportReady
                    ? "Rapport klar"
                    : allResolved
                      ? "Klar for rapport"
                      : "Under arbeid"}
              </Badge>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            {isOpen && (
              <div className="border-t border-border bg-muted/20 p-3 space-y-3">
                {/* Status-stats / filter-piller */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { v: "all", label: "Alle", n: total, tone: "neutral" as const },
                      { v: "not_started", label: "Ikke påstartet", n: statusCounts.not_started, tone: "muted" as const },
                      { v: "in_progress", label: "Pågår", n: statusCounts.in_progress, tone: "warning" as const },
                      { v: "not_relevant", label: "Ikke aktuelt", n: statusCounts.not_relevant, tone: "muted" as const },
                      { v: "done", label: "Fullført", n: statusCounts.done, tone: "success" as const },
                      { v: "evidence", label: "Med bevis", n: allActivities.filter((a) => (a.evidence?.length ?? 0) > 0).length, tone: "primary" as const },
                    ] as const
                  ).map((p) => {
                    const active = f === p.v;
                    const toneCls =
                      p.tone === "warning"
                        ? "bg-warning/10 text-warning border-warning/40"
                        : p.tone === "success"
                          ? "bg-success/10 text-success border-success/40"
                          : p.tone === "primary"
                            ? "bg-primary/10 text-primary border-primary/40"
                            : "bg-muted text-foreground border-border";
                    return (
                      <button
                        key={p.v}
                        type="button"
                        onClick={() => setFilter((s) => ({ ...s, [d.id]: p.v }))}
                        className={cn(
                          "h-7 px-2.5 rounded-full text-xs border transition-colors",
                          active
                            ? toneCls
                            : "bg-background text-muted-foreground border-border hover:text-foreground",
                        )}
                      >
                        {p.label}{" "}
                        <span className="tabular-nums">({p.n})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Kontrollpunkter + spørsmål */}
                <div className="space-y-3">
                  {d.controls.map((c) => {
                    const visible = c.activities.filter((a) => matchFilter(a, f));
                    if (visible.length === 0) return null;
                    const controlDone = c.activities.every((a) => getStatus(a) === "done");
                    return (
                      <div
                        key={c.id}
                        className="rounded-lg border border-border bg-background p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono text-xs",
                              controlDone && "bg-success/10 text-success border-success/30",
                            )}
                          >
                            {c.id}
                          </Badge>
                          <span className="text-[13px] font-medium text-foreground">
                            {c.name}
                          </span>
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {controlDone ? "Kontrollpunkt lukkes" : `Lukker ${c.id}${frameworkLabel ? ` i ${frameworkLabel}` : ""}`}
                          </Badge>
                          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                            {c.progress}%
                          </span>
                        </div>
                        <Progress value={c.progress} className="h-1.5" />
                        <div className="space-y-1.5 pt-1">
                          {visible.map((a) => (
                            <ActivityRow
                              key={a.id}
                              activity={a}
                              onOpenDetails={() => openConfirm(d.id, c.id, a.id)}
                              onSetStatus={(status) => {
                                if (status === "done") {
                                  // Krev note/bevis-bekreftelse via dialogen — preutfyll med "Ferdig"
                                  openConfirm(d.id, c.id, a.id, "done");
                                } else if (a.done && onUndo) {
                                  // Hvis vi forlater done, angre evt. confirmation, så sett ny status
                                  onSetStatus?.(d.id, c.id, a.id, status);
                                } else {
                                  onSetStatus?.(d.id, c.id, a.id, status);
                                }
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="rounded-lg border border-border bg-background p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-foreground">
                      Totalt svart ut
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {resolved}/{total} · {resolvedPct}%
                    </span>
                  </div>
                  <Progress value={resolvedPct} className="h-2" />
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {!reportReady ? (
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        disabled={!allResolved}
                        onClick={() =>
                          setSummaryCtx({ open: true, deliveryId: d.id })
                        }
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Generer sluttrapport
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5"
                          onClick={() =>
                            setSummaryCtx({ open: true, deliveryId: d.id })
                          }
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Vis rapport
                        </Button>
                        {!reportSent && (
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() =>
                              setSendCtx({ open: true, deliveryId: d.id })
                            }
                          >
                            <Send className="h-3.5 w-3.5" />
                            Send til kunde
                          </Button>
                        )}
                        {reportSent && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                            Sendt til {customerName} – venter godkjenning
                          </div>
                        )}
                      </>
                    )}
                    {allResolved && !reportReady && (
                      <span className="text-xs text-success flex items-center gap-1">
                        <PartyPopper className="h-3 w-3" />
                        Alle spørsmål er svart ut · {statusCounts.done} fullført, {statusCounts.not_relevant} ikke aktuelt
                      </span>
                    )}
                    {!allResolved && (
                      <span className="text-xs text-muted-foreground">
                        Alle spørsmål må svares ut (fullført eller ikke aktuelt) før rapporten kan genereres.
                      </span>
                    )}
                    {evidenceCount > 0 && (
                      <span className="text-xs text-muted-foreground ml-auto inline-flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        {evidenceCount} bevis lastet opp
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {confirmCtxResolved && (
        <ConfirmActivityDialog
          open={confirmCtx.open}
          onOpenChange={(o) => setConfirmCtx((s) => ({ ...s, open: o }))}
          activityLabel={confirmCtxResolved.a.label}
          controlId={confirmCtxResolved.c.id}
          controlName={confirmCtxResolved.c.name}
          frameworkLabel={confirmCtxResolved.frameworkLabel}
          readOnly={confirmCtx.readOnly}
          initial={{
            note: confirmCtxResolved.a.note,
            files: confirmCtxResolved.a.evidence,
            sharedWithCustomer: confirmCtxResolved.a.sharedWithCustomer,
            status: confirmCtx.intendedStatus ?? getStatus(confirmCtxResolved.a),
          }}
          onConfirm={(payload) =>
            onConfirm(
              confirmCtxResolved.d.id,
              confirmCtxResolved.c.id,
              confirmCtxResolved.a.id,
              payload,
            )
          }
        />
      )}

      {summaryDelivery && (
        <DeliverySummaryDialog
          open={summaryCtx.open}
          onOpenChange={(o) => setSummaryCtx((s) => ({ ...s, open: o }))}
          delivery={summaryDelivery}
          onApprove={() => handleApproveReport(summaryDelivery)}
        />
      )}

      {sendDelivery && (
        <SendDeliveryReportDialog
          open={sendCtx.open}
          onOpenChange={(o) => setSendCtx((s) => ({ ...s, open: o }))}
          deliveryTitle={sendDelivery.title}
          fileName={
            getMeta(sendDelivery.id).reportFileName ??
            `${slug(sendDelivery.title)}-leveranserapport.pdf`
          }
          frameworkLabel={
            sendDelivery.serviceId
              ? getService(sendDelivery.serviceId)?.frameworkMappings?.[0]
                  ?.frameworkLabel
              : undefined
          }
          customerName={customerName}
          defaultEmail={customerEmail}
          controlsCount={sendDelivery.controls.length}
          activitiesCount={sendDelivery.controls.reduce(
            (s, c) => s + c.activities.length,
            0,
          )}
          evidenceCount={sendDelivery.controls.reduce(
            (s, c) =>
              s +
              c.activities.reduce((ss, a) => ss + (a.evidence?.length ?? 0), 0),
            0,
          )}
          onSend={(payload) => handleSendReport(sendDelivery, payload)}
        />
      )}
    </div>
  );
};

function matchFilter(a: DeliveryActivity, f: ActivityFilter): boolean {
  if (f === "all") return true;
  if (f === "evidence") return (a.evidence?.length ?? 0) > 0;
  return getStatus(a) === f;
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[æå]/g, "a")
    .replace(/ø/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const STATUS_ORDER: ActivityStatus[] = ["not_started", "in_progress", "not_relevant", "done"];

const ActivityRow = ({
  activity,
  onOpenDetails,
  onSetStatus,
}: {
  activity: DeliveryActivity;
  onOpenDetails: () => void;
  onSetStatus: (status: ActivityStatus) => void;
}) => {
  const status = getStatus(activity);
  const isDone = status === "done";
  const notRelevant = status === "not_relevant";
  const evidenceCount = activity.evidence?.length ?? 0;
  const hasNote = !!activity.note && activity.note.trim().length > 0;

  return (
    <div
      className={cn(
        "group rounded-md border px-2.5 py-2 text-left transition-colors",
        notRelevant
          ? "bg-muted/40 border-border opacity-80"
          : isDone
            ? "bg-success/[0.04] border-success/20"
            : "bg-background border-border hover:border-primary/30",
      )}
    >
      <div className="flex items-start gap-2">
        <HelpCircle
          className={cn(
            "h-4 w-4 mt-0.5 shrink-0",
            isDone ? "text-success" : notRelevant ? "text-muted-foreground" : "text-primary/70",
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-[13px]",
                isDone
                  ? "text-muted-foreground line-through"
                  : "text-foreground font-medium",
              )}
            >
              {activity.label}
            </span>
            <Badge variant="outline" className="text-xs gap-1 h-5">
              <UserIcon className="h-2.5 w-2.5" />
              {activity.owner ?? "Partner"}
            </Badge>
            {activity.date && (
              <span className="text-xs text-muted-foreground">
                {activity.date}
              </span>
            )}
            {evidenceCount > 0 && (
              <Badge
                variant="outline"
                className="text-xs gap-1 h-5 bg-primary/5 text-primary border-primary/20"
              >
                <Paperclip className="h-2.5 w-2.5" />
                {evidenceCount}
              </Badge>
            )}
          </div>
          {hasNote && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {activity.note}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenDetails}
          className="text-xs text-muted-foreground hover:text-primary shrink-0 underline-offset-2 hover:underline mt-0.5"
        >
          Detaljer
        </button>
      </div>

      {/* Status-piller */}
      <div className="mt-2 flex items-center gap-1 flex-wrap pl-6">
        {STATUS_ORDER.map((s) => {
          const meta = STATUS_META[s];
          const Icon = meta.Icon;
          const active = status === s;
          return (
            <button
              key={s}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetStatus(s);
              }}
              className={cn(
                "inline-flex items-center gap-1 h-6 px-2 rounded-full border text-xs transition-colors",
                active
                  ? meta.activeCls
                  : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted/40",
              )}
              aria-pressed={active}
            >
              <Icon className={cn("h-3 w-3", active ? "" : meta.cls)} />
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
