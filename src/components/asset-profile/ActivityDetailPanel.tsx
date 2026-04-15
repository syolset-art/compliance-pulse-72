import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Users, Paperclip, Calendar, Tag } from "lucide-react";
import type { VendorActivity } from "@/utils/vendorActivityData";
import { PHASE_CONFIG, OUTCOME_COLORS, formatRelativeDate } from "@/utils/vendorActivityData";

interface Props {
  activity: VendorActivity;
}

export function ActivityDetailPanel({ activity: act }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const phaseConf = PHASE_CONFIG[act.phase];
  const outcomeColor = OUTCOME_COLORS[act.outcomeStatus];

  const desc = isNb ? act.descriptionNb : act.descriptionEn;

  return (
    <div className="pl-11 pb-2 animate-in slide-in-from-top-1 fade-in-0 duration-200">
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        {/* Description */}
        {desc && (
          <p className="text-sm text-foreground leading-relaxed">{desc}</p>
        )}

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
          <div className={`flex items-center gap-1 font-medium ${outcomeColor}`}>
            {isNb ? act.outcomeNb : act.outcomeEn}
          </div>
          {act.actor && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="font-medium text-foreground/80">{act.actor}</span>
              {act.actorRole && <span>, {act.actorRole}</span>}
            </div>
          )}
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
