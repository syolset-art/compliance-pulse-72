import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bot, Users, User as UserIcon, Check, X, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ProcessAgentRec,
  useProcessAgentRecommendations,
} from "@/hooks/useProcessAgentRecommendations";

interface Props {
  rec: ProcessAgentRec;
  workAreaId: string;
  processName?: string;
}

const config = {
  autonomous: {
    icon: Bot,
    labelNb: "Autonom-klar",
    labelEn: "Autonomous-ready",
  },
  copilot: {
    icon: Users,
    labelNb: "Co-pilot",
    labelEn: "Co-pilot",
  },
  manual: {
    icon: UserIcon,
    labelNb: "Manuell",
    labelEn: "Manual",
  },
} as const;

export function AgentFitChip({ rec, workAreaId, processName }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { setStatus, recruitAgent } = useProcessAgentRecommendations(workAreaId);
  const [open, setOpen] = useState(false);

  const cfg = config[rec.recommendation];
  const Icon = cfg.icon;
  const label = isNb ? cfg.labelNb : cfg.labelEn;
  const isRecruited = rec.status === "recruited";
  const isDismissed = rec.status === "dismissed";

  const handle = (status: "recruited" | "dismissed" | "proposed") => {
    setStatus.mutate(
      { id: rec.id, status },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-colors",
            "border-border bg-muted/40 text-foreground hover:bg-muted",
            isRecruited && "border-foreground/20 bg-foreground/5",
            isDismissed && "opacity-50"
          )}
          title={label}
        >
          <Icon className="h-3 w-3" />
          <span className="hidden sm:inline">{label}</span>
          {isRecruited && <Check className="h-3 w-3 ml-0.5" />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 p-3 space-y-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        {rec.rationale && (
          <p className="text-xs text-muted-foreground">{rec.rationale}</p>
        )}
        {rec.suggested_agent_role && (
          <div className="rounded-md border border-border bg-muted/40 px-2 py-1.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {isNb ? "Foreslått agent-rolle" : "Suggested agent role"}
            </p>
            <p className="text-sm">{rec.suggested_agent_role}</p>
          </div>
        )}
        {rec.estimated_hours_saved_per_month != null &&
          Number(rec.estimated_hours_saved_per_month) > 0 && (
            <p className="text-xs text-muted-foreground">
              {isNb
                ? `Estimert besparelse: ~${Math.round(Number(rec.estimated_hours_saved_per_month))} t/mnd`
                : `Estimated savings: ~${Math.round(Number(rec.estimated_hours_saved_per_month))} h/mo`}
            </p>
          )}

        {rec.status === "proposed" && rec.recommendation !== "manual" && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              className="h-7"
              onClick={() =>
                recruitAgent.mutate(
                  { rec, processName: processName || "" },
                  { onSuccess: () => setOpen(false) }
                )
              }
              disabled={recruitAgent.isPending}
            >
              {recruitAgent.isPending ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              {isNb ? "Rekrutter agent" : "Recruit agent"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={() => handle("dismissed")}
            >
              <X className="h-3 w-3 mr-1" />
              {isNb ? "Avvis" : "Dismiss"}
            </Button>
          </div>
        )}

        {rec.status === "recruited" && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Check className="h-3 w-3" />
              {isNb ? "Rekruttert" : "Recruited"}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={() => handle("proposed")}
            >
              {isNb ? "Angre" : "Undo"}
            </Button>
          </div>
        )}

        {rec.status === "dismissed" && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {isNb ? "Avvist" : "Dismissed"}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={() => handle("proposed")}
            >
              {isNb ? "Vurder igjen" : "Reconsider"}
            </Button>
          </div>
        )}

        {rec.recommendation === "manual" && rec.status === "proposed" && (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {isNb
              ? "Lara anbefaler å holde dette manuelt."
              : "Lara recommends keeping this manual."}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
