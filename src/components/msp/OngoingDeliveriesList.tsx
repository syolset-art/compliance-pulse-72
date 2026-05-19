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
  Upload,
  Sparkles,
  Send,
  ShieldCheck,
  PartyPopper,
  RotateCcw,
  Paperclip,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DeliveryItem,
  type DeliveryActivity,
  type DeliveryControl,
} from "./MSPMaturityServiceMatrix";
import type { ConfirmPayload } from "./ConfirmActivityDialog";
import { ConfirmActivityDialog } from "./ConfirmActivityDialog";
import { DeliverySummaryDialog } from "./DeliverySummaryDialog";
import { SendDeliveryReportDialog } from "./SendDeliveryReportDialog";
import { getService } from "@/lib/serviceCatalog";
import { addDeliveryReport, type DeliveryReport } from "@/lib/deliveryReports";
import { toast } from "sonner";

type ActivityFilter = "all" | "open" | "done" | "evidence";

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
}

export const OngoingDeliveriesList = ({
  deliveries,
  customerName,
  customerEmail,
  onConfirm,
  onUndo,
}: Props) => {
  const [expanded, setExpanded] = useState<string | null>(deliveries[0]?.id ?? null);
  const [filter, setFilter] = useState<Record<string, ActivityFilter>>({});
  const [confirmCtx, setConfirmCtx] = useState<{
    open: boolean;
    deliveryId?: string;
    controlId?: string;
    activityId?: string;
    readOnly?: boolean;
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

  const confirmActivity = (
    deliveryId: string,
    controlId: string,
    activityId: string,
  ) => {
    setConfirmCtx({ open: true, deliveryId, controlId, activityId });
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
    <div className="space-y-2">
      {deliveries.map((d) => {
        const isOpen = expanded === d.id;
        const allActivities = d.controls.flatMap((c) => c.activities);
        const doneCount = allActivities.filter((a) => a.done).length;
        const total = allActivities.length;
        const allDone = total > 0 && doneCount === total;
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

        const counts = {
          all: total,
          open: allActivities.filter((a) => !a.done).length,
          done: doneCount,
          evidence: allActivities.filter((a) => (a.evidence?.length ?? 0) > 0).length,
        };

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
                    : reportReady
                      ? "bg-success/10"
                      : allDone
                        ? "bg-success/10"
                        : "bg-warning/10",
                )}
              >
                {reportSent ? (
                  <Send className="h-4 w-4 text-primary" />
                ) : reportReady || allDone ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Clock className="h-4 w-4 text-warning" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {d.title}
                  </p>
                  {frameworkLabel && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <FileText className="h-3 w-3" />
                      {frameworkLabel}
                    </Badge>
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground">{d.meta}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {doneCount} av {total} aktiviteter fullført
                  {evidenceCount > 0 && (
                    <>
                      {" · "}
                      <span className="text-foreground">{evidenceCount} vedlegg</span>
                    </>
                  )}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  reportSent
                    ? "bg-primary/10 text-primary border-primary/30"
                    : reportReady
                      ? "bg-success/10 text-success border-success/30"
                      : allDone
                        ? "bg-success/10 text-success border-success/30"
                        : "bg-warning/10 text-warning border-warning/30",
                )}
              >
                {reportSent
                  ? "Sendt – venter godkjenning"
                  : reportReady
                    ? "Rapport klar"
                    : allDone
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
                {/* Filter pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { v: "all", label: "Alle", n: counts.all },
                      { v: "open", label: "Gjenstår", n: counts.open },
                      { v: "done", label: "Fullført", n: counts.done },
                      { v: "evidence", label: "Med dokument", n: counts.evidence },
                    ] as const
                  ).map((p) => {
                    const active = f === p.v;
                    return (
                      <button
                        key={p.v}
                        type="button"
                        onClick={() => setFilter((s) => ({ ...s, [d.id]: p.v }))}
                        className={cn(
                          "h-7 px-2.5 rounded-full text-[11px] border transition-colors",
                          active
                            ? "bg-primary/10 text-primary border-primary/40"
                            : "bg-background text-muted-foreground border-border hover:text-foreground",
                        )}
                      >
                        {p.label}{" "}
                        <span className="tabular-nums">({p.n})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Controls + activities */}
                <div className="space-y-3">
                  {d.controls.map((c) => {
                    const visible = c.activities.filter((a) => matchFilter(a, f));
                    if (visible.length === 0) return null;
                    return (
                      <div
                        key={c.id}
                        className="rounded-lg border border-border bg-background p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px]"
                          >
                            {c.id}
                          </Badge>
                          <span className="text-[13px] font-medium text-foreground">
                            {c.name}
                          </span>
                          <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                            {c.progress}%
                          </span>
                        </div>
                        <Progress value={c.progress} className="h-1.5" />
                        <div className="space-y-1.5 pt-1">
                          {visible.map((a) => (
                            <ActivityRow
                              key={a.id}
                              activity={a}
                              onOpen={() => confirmActivity(d.id, c.id, a.id)}
                              onQuickToggle={() => {
                                if (a.done) {
                                  onUndo(d.id, c.id, a.id);
                                } else {
                                  confirmActivity(d.id, c.id, a.id);
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
                      Totalt fremdrift
                    </span>
                    <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                      {total > 0 ? Math.round((doneCount / total) * 100) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={total > 0 ? (doneCount / total) * 100 : 0}
                    className="h-2"
                  />
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {!reportReady ? (
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        disabled={!allDone}
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
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                            Sendt til {customerName} – venter godkjenning
                          </div>
                        )}
                      </>
                    )}
                    {allDone && !reportReady && (
                      <span className="text-[11px] text-success flex items-center gap-1">
                        <PartyPopper className="h-3 w-3" />
                        Alle aktiviteter er bekreftet
                      </span>
                    )}
                    {!allDone && (
                      <span className="text-[11px] text-muted-foreground">
                        Fullfør alle aktiviteter for å generere rapport.
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
  if (f === "open") return !a.done;
  if (f === "done") return a.done;
  if (f === "evidence") return (a.evidence?.length ?? 0) > 0;
  return true;
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

const ActivityRow = ({
  activity,
  onToggleConfirm,
  onUpload,
  onView,
}: {
  activity: DeliveryActivity;
  onToggleConfirm: () => void;
  onUpload: () => void;
  onView: () => void;
}) => {
  const done = activity.done;
  const evidenceCount = activity.evidence?.length ?? 0;
  const hasNote = !!activity.note && activity.note.trim().length > 0;
  const hasDetails = done || evidenceCount > 0 || hasNote;
  return (

    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
        done
          ? "bg-success/[0.04] border-success/20"
          : "bg-background border-border hover:bg-muted/30",
      )}
    >
      <button
        type="button"
        onClick={onToggleConfirm}
        className="mt-0.5 shrink-0"
        aria-label={done ? "Angre bekreftelse" : "Bekreft aktivitet"}
      >
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-[13px]",
              done
                ? "text-muted-foreground line-through"
                : "text-foreground font-medium",
            )}
          >
            {activity.label}
          </span>
          {activity.owner && (
            <Badge
              variant="outline"
              className="text-[10px] gap-1 h-5"
            >
              <UserIcon className="h-2.5 w-2.5" />
              {activity.owner}
            </Badge>
          )}
          {activity.date && (
            <span className="text-[11px] text-muted-foreground">
              {activity.date}
            </span>
          )}
          {evidenceCount > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] gap-1 h-5 bg-primary/5 text-primary border-primary/20"
            >
              <Paperclip className="h-2.5 w-2.5" />
              {evidenceCount}
            </Badge>
          )}
          {activity.laraSteps && activity.laraSteps.length > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] gap-1 h-5 bg-primary/5 text-primary border-primary/20"
            >
              <Sparkles className="h-2.5 w-2.5" />
              Lara: {activity.laraSteps.length} steg
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {hasDetails && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[11px] gap-1"
            onClick={onView}
            title={hasNote || evidenceCount > 0 ? "Se notat og vedlegg" : "Se detaljer"}
          >
            <FileText className="h-3 w-3" />
            Vis
          </Button>
        )}
        {!done && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[11px] gap-1"
            onClick={onUpload}
          >
            <Upload className="h-3 w-3" />
            Last opp
          </Button>
        )}
        {done && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[11px] text-muted-foreground"
            onClick={onToggleConfirm}
            title="Angre"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>

    </div>
  );
};
