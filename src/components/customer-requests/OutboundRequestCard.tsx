import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { FileText, Shield, FileCheck, Clock, Send, AlertTriangle, CheckCircle2, MoreHorizontal, Archive, Trash2, Globe, Lock, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface OutboundRequest {
  id: string;
  vendor_name: string;
  /** Kobling til leverandør-ressursen (settes på nye forespørsler) */
  vendor_id?: string;

  vendor_category?: string;
  request_type: string;
  status: "sent" | "awaiting" | "received" | "overdue" | "archived";
  due_date: string;
  sent_date: string;
  response_date?: string;
  visibility?: "private" | "public";
  /** Set when Lara automatically prepared and sent the message */
  sent_by_lara?: boolean;
  /** Person who approved/wrote the message (for subtitle) */
  approved_by?: string;
  /** Custom subject — overrides the type label in title */
  subject?: string;
}

const TYPE_LABELS_NB: Record<string, string> = {
  vendor_assessment: "Leverandørvurdering",
  dpa: "DPA-forespørsel",
  iso_documentation: "ISO 27001-dokumentasjon",
  soc2: "SOC 2-rapport",
  gdpr_report: "GDPR-rapport",
};

const TYPE_LABELS_EN: Record<string, string> = {
  vendor_assessment: "Vendor assessment",
  dpa: "DPA request",
  iso_documentation: "ISO 27001 documentation",
  soc2: "SOC 2 report",
  gdpr_report: "GDPR report",
};

const TYPE_ICONS: Record<string, typeof FileText> = {
  vendor_assessment: FileText,
  dpa: FileCheck,
  iso_documentation: Shield,
  soc2: FileText,
  gdpr_report: FileText,
};

function getStatusConfig(status: string, isNb: boolean) {
  switch (status) {
    case "received":
      return { label: isNb ? "Mottatt" : "Received", className: "bg-success/15 text-success border-success/30", icon: CheckCircle2 };
    case "awaiting":
    case "sent":
      return { label: isNb ? "Venter på svar" : "Awaiting reply", className: "bg-warning/15 text-warning border-warning/30", icon: Clock };
    case "overdue":
      return { label: isNb ? "Forfalt" : "Overdue", className: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle };
    case "archived":
      return { label: isNb ? "Arkivert" : "Archived", className: "bg-muted text-muted-foreground border-muted", icon: Archive };
    default:
      return { label: isNb ? "Sendt" : "Sent", className: "bg-primary/15 text-primary border-primary/30", icon: Send };
  }
}

interface OutboundRequestCardProps {
  request: OutboundRequest;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onToggleVisibility?: (id: string, isPublic: boolean) => void;
}

export function OutboundRequestCard({ request, onDelete, onArchive, onToggleVisibility }: OutboundRequestCardProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const locale = isNb ? "nb-NO" : "en-US";
  const isPublic = request.visibility === "public";

  const Icon = TYPE_ICONS[request.request_type] || FileText;
  const typeLabel = isNb
    ? TYPE_LABELS_NB[request.request_type] || request.request_type
    : TYPE_LABELS_EN[request.request_type] || request.request_type;
  const statusCfg = getStatusConfig(request.status, isNb);

  const title = request.subject || `${typeLabel}: ${request.vendor_name}`;
  const sentLabel = new Date(request.sent_date).toLocaleDateString(locale, { day: "numeric", month: "short" });
  const dueLabel = request.due_date
    ? new Date(request.due_date).toLocaleDateString(locale, { day: "numeric", month: "short" })
    : null;
  const responseLabel = request.response_date
    ? new Date(request.response_date).toLocaleDateString(locale, { day: "numeric", month: "short" })
    : null;
  const isOverdue = request.status === "overdue";

  // Build subtitle: "[Approver] [verb] [date] · Frist [date]" or "Mottatt [date]"
  const verb = request.sent_by_lara
    ? (isNb ? "Godkjent av" : "Approved by")
    : (isNb ? "Skrevet av" : "Written by");
  const subtitleParts: React.ReactNode[] = [];
  if (request.approved_by) {
    subtitleParts.push(
      <span key="approver">
        {verb} {request.approved_by} {sentLabel}
      </span>
    );
  } else {
    subtitleParts.push(
      <span key="sent">
        {isNb ? "Sendt" : "Sent"} {sentLabel}
      </span>
    );
  }
  if (responseLabel) {
    subtitleParts.push(
      <span key="received" className="text-success">
        {isNb ? "Mottatt" : "Received"} {responseLabel}
      </span>
    );
  } else if (dueLabel) {
    subtitleParts.push(
      <span key="due" className={cn(isOverdue && "text-destructive")}>
        {isNb ? "Frist" : "Due"} {dueLabel}
      </span>
    );
  } else {
    subtitleParts.push(
      <span key="nodue">{isNb ? "Frist —" : "No deadline"}</span>
    );
  }

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 -mx-3 rounded-md hover:bg-muted/40 transition-colors">
      <div className="p-1.5 rounded-md bg-primary/10 flex-shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          {request.sent_by_lara && (
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20 gap-1 text-[11px] py-0 px-1.5 font-normal flex-shrink-0"
              title={isNb ? "Forberedt og sendt automatisk av Lara" : "Prepared and sent automatically by Lara"}
            >
              <Sparkles className="h-2.5 w-2.5" />
              {isNb ? "Sendt av Lara" : "Sent by Lara"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {subtitleParts.map((part, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1.5">·</span>}
              {part}
            </span>
          ))}
        </p>
      </div>

      <Badge className={cn(statusCfg.className, "text-[12px] flex-shrink-0")}>
        {statusCfg.label}
      </Badge>

      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", isPublic ? "text-success" : "text-muted-foreground")}
                onClick={() => onToggleVisibility?.(request.id, !isPublic)}
              >
                {isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{isPublic ? (isNb ? "Offentlig" : "Public") : (isNb ? "Privat" : "Private")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onArchive?.(request.id)}>
              <Archive className="h-3.5 w-3.5 mr-2" />
              {isNb ? "Arkiver" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete?.(request.id)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              {isNb ? "Slett" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
