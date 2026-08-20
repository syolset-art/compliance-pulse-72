import { FileText, Inbox, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SaraIcon } from "@/components/agents/SaraIcon";
import { docSourceTooltip, type DocSourceKey } from "@/lib/vendorDocumentSource";
import { cn } from "@/lib/utils";

interface Props {
  source: DocSourceKey;
  isNb: boolean;
  className?: string;
}

/** Lite kildeikon med forklaring – ingen pills, samme stramme stil som regelverkslisten. */
export function DocumentSourceIcon({ source, isNb, className }: Props) {
  const icon =
    source === "agent" ? (
      <SaraIcon size={16} />
    ) : source === "vendor" ? (
      <Inbox className="h-4 w-4 text-warning" />
    ) : source === "trustEngine" ? (
      <ShieldCheck className="h-4 w-4 text-primary" />
    ) : (
      <FileText className="h-4 w-4 text-muted-foreground" />
    );

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex shrink-0 items-center", className)} aria-label={docSourceTooltip(source, isNb)}>
            {icon}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-[12px] leading-relaxed">
          {docSourceTooltip(source, isNb)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
