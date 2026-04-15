import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

export type EvidenceStatus = "fresh" | "stale" | "expired" | "missing";

interface EvidenceStatusBadgeProps {
  status: EvidenceStatus;
  count?: number;
  compact?: boolean;
}

const STATUS_CONFIG: Record<EvidenceStatus, {
  icon: typeof CheckCircle2;
  colorClass: string;
  variant: "default" | "secondary" | "destructive" | "outline" | "warning" | "action";
  labelEn: string;
  labelNb: string;
  tooltipEn: string;
  tooltipNb: string;
}> = {
  fresh: {
    icon: CheckCircle2,
    colorClass: "text-success",
    variant: "action",
    labelEn: "Verified",
    labelNb: "Verifisert",
    tooltipEn: "All evidence is fresh and up to date",
    tooltipNb: "Alt bevis er oppdatert og gyldig",
  },
  stale: {
    icon: Clock,
    colorClass: "text-warning",
    variant: "warning",
    labelEn: "Expiring soon",
    labelNb: "Utløper snart",
    tooltipEn: "Some evidence is aging or expiring within 30 days",
    tooltipNb: "Noe bevis er foreldet eller utløper innen 30 dager",
  },
  expired: {
    icon: XCircle,
    colorClass: "text-destructive",
    variant: "destructive",
    labelEn: "Expired",
    labelNb: "Utløpt",
    tooltipEn: "Evidence has expired — Trust Score has been downgraded",
    tooltipNb: "Bevis er utløpt — Trust Score er nedgradert",
  },
  missing: {
    icon: AlertTriangle,
    colorClass: "text-muted-foreground",
    variant: "outline",
    labelEn: "Missing",
    labelNb: "Mangler",
    tooltipEn: "No evidence found for this control",
    tooltipNb: "Ingen bevis funnet for denne kontrollen",
  },
};

export function EvidenceStatusBadge({ status, count, compact = false }: EvidenceStatusBadgeProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex ${config.colorClass}`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{isNb ? config.tooltipNb : config.tooltipEn}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="text-[13px] gap-1">
          <Icon className="h-3 w-3" />
          {isNb ? config.labelNb : config.labelEn}
          {count !== undefined && count > 0 && ` (${count})`}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{isNb ? config.tooltipNb : config.tooltipEn}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Derive the worst evidence status for a set of checks.
 */
export function deriveWorstStatus(statuses: EvidenceStatus[]): EvidenceStatus {
  if (statuses.includes("expired")) return "expired";
  if (statuses.includes("missing")) return "missing";
  if (statuses.includes("stale")) return "stale";
  return "fresh";
}
