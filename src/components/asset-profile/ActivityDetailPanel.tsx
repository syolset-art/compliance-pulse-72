import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Users, Paperclip, Calendar, Tag, Layers, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorActivity, ActivityLevel } from "@/utils/vendorActivityData";
import { PHASE_CONFIG, ACTIVITY_STATUS_CONFIG, LEVEL_CONFIG } from "@/utils/vendorActivityData";

interface Props {
  activity: VendorActivity;
  onUpdate?: (patch: Partial<VendorActivity>) => void;
}

const LEVELS: ActivityLevel[] = ["operasjonelt", "taktisk", "strategisk"];

export function ActivityDetailPanel({ activity: act, onUpdate }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const phaseConf = PHASE_CONFIG[act.phase];
  const statusConf = ACTIVITY_STATUS_CONFIG[act.outcomeStatus];
  const [showAllHistory, setShowAllHistory] = useState(false);

  const desc = isNb ? act.descriptionNb : act.descriptionEn;
  const createdAt = act.createdAt ?? act.date;

  // Generate initials for avatar
  const initials = (act.actor ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="pl-11 pb-2 animate-in slide-in-from-top-1 fade-in-0 duration-200">
      <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
        {/* Description */}
        {desc && (
          <p className="text-sm text-foreground leading-relaxed">{desc}</p>
        )}

        {/* Creator block — prominent */}
        <div className="rounded-md border bg-background/60 p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {isNb ? "Opprettet av" : "Created by"}
            </p>
            <p className="text-sm font-medium text-foreground truncate">
              {act.actor ?? (isNb ? "Ukjent" : "Unknown")}
              {act.actorRole && (
                <span className="text-muted-foreground font-normal"> · {act.actorRole}</span>
              )}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground shrink-0">
            <p>{createdAt.toLocaleDateString(isNb ? "nb-NO" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
            <p>{createdAt.toLocaleTimeString(isNb ? "nb-NO" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>

        {/* Level selector — editable */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Layers className="h-3 w-3" />
            {isNb ? "Nivå" : "Level"}
          </div>
          <div className="flex gap-1.5" role="radiogroup" aria-label={isNb ? "Nivå" : "Level"}>
            {LEVELS.map(lvl => {
              const conf = LEVEL_CONFIG[lvl];
              const selected = act.level === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!onUpdate}
                  onClick={() => onUpdate?.({ level: lvl })}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all",
                    selected
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    !onUpdate && "cursor-default opacity-80"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", conf.dot)} />
                  {isNb ? conf.nb : conf.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* People row */}
        {(act.contactPerson || act.participants) && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {act.contactPerson && (
                <div className="flex items-center gap-1.5 text-xs">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{isNb ? "Kontakt:" : "Contact:"}</span>
                  <span className="font-medium text-foreground">{act.contactPerson}</span>
                </div>
              )}
              {act.participants && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{isNb ? "Deltakere:" : "Participants:"}</span>
                  <span className="font-medium text-foreground">{act.participants}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Metadata row */}
        <Separator />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {act.date.toLocaleDateString(isNb ? "nb-NO" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            <Badge variant="outline" className={`text-[13px] px-1.5 py-0 border-0 ${phaseConf.color}`}>
              {isNb ? phaseConf.nb : phaseConf.en}
            </Badge>
          </div>
          <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", statusConf.pill)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", statusConf.dot)} />
            {isNb ? statusConf.nb : statusConf.en}
          </div>
        </div>

        {/* Attachment note */}
        {act.attachmentNote && (
          <>
            <Separator />
            <div className="flex items-center gap-1.5 text-xs">
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{isNb ? "Vedlegg:" : "Attachment:"}</span>
              <span className="font-medium text-foreground">{act.attachmentNote}</span>
            </div>
          </>
        )}

        {/* Manual badge */}
        {act.isManual && (
          <div className="pt-1">
            <Badge variant="outline" className="text-[13px] border-dashed text-muted-foreground">
              {isNb ? "Manuelt registrert" : "Manually registered"}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
