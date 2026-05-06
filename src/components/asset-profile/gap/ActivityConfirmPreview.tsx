import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Pencil, Check, Clock, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlannedActivity {
  kind: "meeting" | "email" | "task";
  title: string;
  fields: { label: string; value: string }[];
  linkedTo?: string;
  emailPreview?: string;
}

interface Props {
  vendorName: string;
  requirementId: string;
  activities: PlannedActivity[];
  onConfirm: (which: "all" | number) => void;
  onCancel: () => void;
}

type ItemState = "pending" | "confirmed" | "skipped";

export function ActivityConfirmPreview({
  vendorName,
  requirementId,
  activities,
  onConfirm,
  onCancel,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [showFullEmail, setShowFullEmail] = useState<Record<number, boolean>>({});
  const [states, setStates] = useState<ItemState[]>(() => activities.map(() => "pending"));

  const pendingCount = states.filter((s) => s === "pending").length;
  const confirmedCount = states.filter((s) => s === "confirmed").length;

  // When everything is resolved (no pending) and at least one was confirmed, finalize
  useEffect(() => {
    if (pendingCount === 0) {
      if (confirmedCount > 0) onConfirm("all");
      else onCancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCount, confirmedCount]);

  const setOne = (idx: number, val: ItemState) => {
    setStates((prev) => prev.map((s, i) => (i === idx ? val : s)));
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-card p-4 space-y-3 mt-2">
      {/* Lara header */}
      <div className="flex items-start gap-3">
        <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[11px] font-semibold text-primary">L</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">Lara</span>
            <span className="text-xs text-muted-foreground">
              · {isNb
                ? `Klar til å sette opp ${activities.length} ${activities.length === 1 ? "aktivitet" : "aktiviteter"}`
                : `Ready to set up ${activities.length} ${activities.length === 1 ? "activity" : "activities"}`}
            </span>
            <Badge variant="outline" className="ml-auto gap-1 text-warning border-warning/30 bg-warning/5">
              <Clock className="h-3 w-3" />
              {pendingCount > 0
                ? (isNb ? `Venter bekreftelse (${pendingCount})` : `Awaiting confirmation (${pendingCount})`)
                : (isNb ? "Ingen igjen" : "None left")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {isNb
              ? `Knyttet til ${requirementId}. Bekreft hver aktivitet enkeltvis — eller hopp over de du ikke vil opprette.`
              : `Linked to ${requirementId}. Confirm each activity individually — or skip the ones you don't want.`}
          </p>
        </div>
      </div>

      {/* Activities */}
      <div className="space-y-2">
        {activities.map((act, idx) => {
          const state = states[idx];
          const Icon = act.kind === "meeting" ? Calendar : act.kind === "email" ? Mail : FileText;
          const subtitle = act.kind === "meeting"
            ? (isNb ? "Møteinvitasjon sendes via Outlook" : "Meeting invite via Outlook")
            : act.kind === "email"
            ? (isNb ? `E-post sendes til kontakt hos ${vendorName}` : `Email sent to contact at ${vendorName}`)
            : (isNb ? "Oppgave opprettes i aktivitetsloggen" : "Task created in activity log");

          return (
            <Card key={idx} className={cn(
              state === "confirmed" && "border-success/40 bg-success/[0.03]",
              state === "skipped" && "opacity-60",
            )}>
              <CardContent className="p-0">
                {/* Activity header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {isNb ? `Aktivitet ${idx + 1} — ` : `Activity ${idx + 1} — `}
                      {act.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                  </div>
                  {state === "confirmed" ? (
                    <Badge variant="outline" className="gap-1 text-success border-success/30 bg-success/5 text-[11px]">
                      <Check className="h-3 w-3" /> {isNb ? "Bekreftet" : "Confirmed"}
                    </Badge>
                  ) : state === "skipped" ? (
                    <Badge variant="outline" className="gap-1 text-muted-foreground text-[11px]">
                      <X className="h-3 w-3" /> {isNb ? "Hoppet over" : "Skipped"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[11px]">
                      {idx + 1} {isNb ? "av" : "of"} {activities.length}
                    </Badge>
                  )}
                </div>

                {/* Field rows */}
                <div className="divide-y divide-border">
                  {act.fields.map((f, fi) => (
                    <div key={fi} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">
                        {f.label}
                      </span>
                      <span className="text-sm flex-1 min-w-0 break-words">{f.value}</span>
                      {state === "pending" && (
                        <Button variant="outline" size="icon" className="h-7 w-7 shrink-0">
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {act.linkedTo && (
                    <div className="flex items-start gap-3 px-4 py-2.5">
                      <span className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">
                        {isNb ? "Knyttet til" : "Linked to"}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground flex-1">
                        {act.linkedTo}
                      </span>
                    </div>
                  )}
                </div>

                {/* Email preview */}
                {act.emailPreview && (
                  <div className="mx-4 mb-3 mt-2 rounded-md bg-muted/40 p-3 text-xs">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      {isNb ? "Forhåndsvisning av e-post" : "Email preview"}
                    </p>
                    <div className={cn(
                      "whitespace-pre-line text-foreground/90 leading-relaxed",
                      !showFullEmail[idx] && "line-clamp-4"
                    )}>
                      {act.emailPreview}
                    </div>
                    {act.emailPreview.split("\n").length > 4 && (
                      <button
                        className="text-[11px] text-muted-foreground hover:text-foreground mt-1.5"
                        onClick={() => setShowFullEmail((s) => ({ ...s, [idx]: !s[idx] }))}
                      >
                        {showFullEmail[idx]
                          ? (isNb ? "Skjul" : "Hide")
                          : (isNb ? "+ vis hele" : "+ show all")}
                      </button>
                    )}
                  </div>
                )}

                {/* Per-activity action bar */}
                {state === "pending" && (
                  <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-border bg-muted/20">
                    <Button size="sm" className="gap-1.5" onClick={() => setOne(idx, "confirmed")}>
                      <Check className="h-3.5 w-3.5" />
                      {act.kind === "meeting"
                        ? (isNb ? "Bekreft møtet" : "Confirm meeting")
                        : act.kind === "email"
                        ? (isNb ? "Bekreft og send" : "Confirm & send")
                        : (isNb ? "Bekreft oppgaven" : "Confirm task")}
                    </Button>
                    <Button size="sm" variant="outline">
                      {isNb ? "Tilpass" : "Customize"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setOne(idx, "skipped")}>
                      {isNb ? "Hopp over" : "Skip"}
                    </Button>
                    <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {isNb ? "Ikke sendt enda" : "Not sent yet"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cancel-all link only */}
      <div className="flex items-center justify-between pt-1">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {isNb ? "Avbryt alt" : "Cancel all"}
        </Button>
        <span className="text-[11px] text-muted-foreground">
          {isNb
            ? `${confirmedCount} bekreftet · ${pendingCount} venter`
            : `${confirmedCount} confirmed · ${pendingCount} pending`}
        </span>
      </div>
    </div>
  );
}

// Helper: build planned activities from a gap proposal
export function buildPlannedActivities(
  gap: { requirement_id: string; name: string; status: string; signal_key?: string },
  vendorName: string,
  isNb: boolean
): PlannedActivity[] {
  const reqId = gap.requirement_id;
  const meetingDate = isNb ? "Tirsdag 19. mai 2026, 10:00–11:00" : "Tuesday May 19, 2026, 10:00–11:00";
  const dueDate = isNb ? "27. mai 2026 (3 uker)" : "May 27, 2026 (3 weeks)";

  return [
    {
      kind: "meeting",
      title: isNb ? `Oppfølgingsmøte med ${vendorName}` : `Follow-up meeting with ${vendorName}`,
      fields: [
        { label: isNb ? "Tittel" : "Title", value: isNb ? `Halvårlig sikkerhetsgjennomgang — ${vendorName}` : `Semi-annual security review — ${vendorName}` },
        { label: isNb ? "Deltakere" : "Participants", value: isNb ? `Security Contact (${vendorName}), ikke tildelt hos oss` : `Security Contact (${vendorName}), unassigned on our side` },
        { label: isNb ? "Foreslått tid" : "Proposed time", value: meetingDate },
        { label: "Agenda", value: isNb ? "Status sikkerhet · avvik H2 2025 · risikonivå · revisjon" : "Security status · incidents H2 2025 · risk level · audit" },
      ],
      linkedTo: `${reqId} · ${isNb ? "Kontrakt §4.2" : "Contract §4.2"}`,
    },
    {
      kind: "email",
      title: isNb ? "Forespørsel om revisjonsrapport" : "Audit report request",
      fields: [
        { label: isNb ? "Til" : "To", value: `Security Contact <security@${vendorName.toLowerCase()}.no>` },
        { label: isNb ? "Emne" : "Subject", value: isNb ? "Forespørsel om revisjonsrapport H2 2025" : "Request for audit report H2 2025" },
        { label: isNb ? "Frist for svar" : "Reply by", value: dueDate },
      ],
      linkedTo: reqId,
      emailPreview: isNb
        ? `Hei,\n\nI henhold til kontrakt §4.2 ber vi om oversendelse av revisjonsrapport for andre halvår 2025, inkludert sikkerhetshendelser, avvik og oppfølgingstiltak.\n\nVi setter opp oppfølgingsmøte 19. mai der rapporten gjennomgås — fint om dokumentet kan oversendes innen 27. mai.\n\nMed vennlig hilsen\nLeverandøransvarlig`
        : `Hi,\n\nPer contract §4.2 we request the audit report for H2 2025, including security incidents, deviations and follow-up actions.\n\nWe've scheduled a follow-up meeting on May 19 where the report will be reviewed — please send the document by May 27.\n\nBest regards\nVendor Manager`,
    },
  ];
}
