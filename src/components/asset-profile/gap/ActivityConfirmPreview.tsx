import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Pencil, Check, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
              {isNb ? "Venter bekreftelse" : "Awaiting confirmation"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {isNb
              ? `Knyttet til ${requirementId}. Se gjennom og bekreft, eller juster detaljene før jeg oppretter dem.`
              : `Linked to ${requirementId}. Review and confirm, or adjust details before I create them.`}
          </p>
        </div>
      </div>

      {/* Activities */}
      <div className="space-y-2">
        {activities.map((act, idx) => {
          const Icon = act.kind === "meeting" ? Calendar : act.kind === "email" ? Mail : FileText;
          const subtitle = act.kind === "meeting"
            ? (isNb ? "Møteinvitasjon sendes via Outlook" : "Meeting invite via Outlook")
            : act.kind === "email"
            ? (isNb ? `E-post sendes til kontakt hos ${vendorName}` : `Email sent to contact at ${vendorName}`)
            : (isNb ? "Oppgave opprettes i aktivitetsloggen" : "Task created in activity log");

          return (
            <Card key={idx}>
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
                  <Badge variant="secondary" className="text-[11px]">
                    {idx + 1} {isNb ? "av" : "of"} {activities.length}
                  </Badge>
                </div>

                {/* Field rows */}
                <div className="divide-y divide-border">
                  {act.fields.map((f, fi) => (
                    <div key={fi} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">
                        {f.label}
                      </span>
                      <span className="text-sm flex-1 min-w-0 break-words">{f.value}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7 shrink-0">
                        <Pencil className="h-3 w-3" />
                      </Button>
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom action bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button size="sm" className="gap-1.5" onClick={() => onConfirm("all")}>
          <Check className="h-3.5 w-3.5" />
          {activities.length === 1
            ? (isNb ? "Bekreft" : "Confirm")
            : (isNb ? "Bekreft begge" : `Confirm all (${activities.length})`)}
        </Button>
        {activities.length > 1 && activities.map((a, i) => (
          <Button key={i} size="sm" variant="outline" onClick={() => onConfirm(i)}>
            {isNb ? `Bare ${a.kind === "meeting" ? "møtet" : a.kind === "email" ? "e-posten" : "oppgaven"}` : `Only the ${a.kind}`}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {isNb ? "Avbryt" : "Cancel"}
        </Button>
        <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {isNb ? "Ingen er sendt enda" : "Nothing sent yet"}
        </span>
      </div>

      {/* Lara footnote */}
      <div className="text-xs text-muted-foreground space-y-2 pt-1 border-t border-border/60">
        <p className="pt-2">
          {isNb
            ? "Jeg har klargjort aktivitetene, men ikke sendt noe enda. Du ser hva som faktisk vil skje før du bekrefter — det er kjernen i assistert modus."
            : "I've prepared the activities but haven't sent anything yet. You see exactly what will happen before confirming — that's the core of assisted mode."}
        </p>
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
