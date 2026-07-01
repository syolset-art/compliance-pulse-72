import { useTranslation } from "react-i18next";
import type { AuditEvent } from "@/lib/evidenceStatus";
import { CheckCircle2, FileUp, Pencil, ShieldCheck, Sparkles, UserCheck, XCircle } from "lucide-react";

const ICON_MAP: Record<AuditEvent["action"], typeof CheckCircle2> = {
  uploaded: FileUp,
  ai_classified: Sparkles,
  manually_classified: Pencil,
  edited: Pencil,
  confirmed: CheckCircle2,
  attested: UserCheck,
  verified: ShieldCheck,
  rejected: XCircle,
};

const LABELS: Record<AuditEvent["action"], { nb: string; en: string }> = {
  uploaded: { nb: "Lastet opp", en: "Uploaded" },
  ai_classified: { nb: "Klassifisert av Lara", en: "Classified by Lara" },
  manually_classified: { nb: "Klassifisert manuelt", en: "Classified manually" },
  edited: { nb: "Endret", en: "Edited" },
  confirmed: { nb: "Plassering bekreftet", en: "Placement confirmed" },
  attested: { nb: "Attestert", en: "Attested" },
  verified: { nb: "Verifisert", en: "Verified" },
  rejected: { nb: "Avvist", en: "Rejected" },
};


interface Props {
  trail: AuditEvent[];
  compact?: boolean;
}

export function EvidenceAuditTrail({ trail, compact }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  if (!trail?.length) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {isNb ? "Ingen aktivitet ennå." : "No activity yet."}
      </p>
    );
  }

  return (
    <ol className="relative space-y-3 border-l border-border/70 pl-4">
      {trail.map((event, idx) => {
        const Icon = ICON_MAP[event.action] ?? Pencil;
        const label = LABELS[event.action]?.[isNb ? "nb" : "en"] ?? event.action;
        const date = new Date(event.timestamp);
        return (
          <li key={idx} className="relative">
            <span className="absolute -left-[21px] flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border">
              <Icon className="h-2.5 w-2.5 text-muted-foreground" />
            </span>
            <div className={compact ? "text-xs" : "text-sm"}>
              <p className="font-medium text-foreground">
                {label}
                {event.actor && (
                  <span className="ml-1 font-normal text-muted-foreground">
                    · {event.actor}
                    {event.actor_role ? ` (${event.actor_role})` : ""}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {date.toLocaleString(isNb ? "nb-NO" : "en-US")}
                {event.note ? ` · ${event.note}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
