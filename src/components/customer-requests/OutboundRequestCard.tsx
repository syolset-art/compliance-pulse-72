import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { FileText, Shield, FileCheck, Clock, Send, AlertTriangle, CheckCircle2, Building2, MoreHorizontal, Archive, Trash2, Globe, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface OutboundRequest {
  id: string;
  vendor_name: string;
  vendor_category?: string;
  request_type: string;
  status: "sent" | "awaiting" | "received" | "overdue";
  due_date: string;
  sent_date: string;
  response_date?: string;
  visibility?: "private" | "public";
}

const TYPE_LABELS_NB: Record<string, string> = {
  vendor_assessment: "Leverandørvurdering",
  dpa: "DPA-fornyelse",
  iso_documentation: "ISO 27001 dokumentasjon",
  soc2: "SOC 2-rapport",
  gdpr_report: "GDPR-rapport",
};

const TYPE_LABELS_EN: Record<string, string> = {
  vendor_assessment: "Vendor Assessment",
  dpa: "DPA Renewal",
  iso_documentation: "ISO 27001 Documentation",
  soc2: "SOC 2 Report",
  gdpr_report: "GDPR Report",
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
      return { label: isNb ? "Mottatt" : "Received", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", icon: CheckCircle2 };
    case "awaiting":
      return { label: isNb ? "Venter på svar" : "Awaiting reply", className: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: Clock };
    case "overdue":
      return { label: isNb ? "Forfalt" : "Overdue", className: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle };
    case "sent":
    default:
      return { label: isNb ? "Sendt" : "Sent", className: "bg-blue-500/15 text-blue-700 border-blue-500/30", icon: Send };
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
  const isOverdue = request.status === "overdue";

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{typeLabel}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Building2 className="h-3 w-3" />
                <span>{request.vendor_name}</span>
                {request.vendor_category && (
                  <>
                    <span>·</span>
                    <span className="capitalize">{request.vendor_category}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${isPublic ? "text-emerald-600" : "text-muted-foreground"}`}
                      onClick={() => onToggleVisibility?.(request.id, !isPublic)}
                    >
                      {isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">{isPublic ? (isNb ? "Offentlig — klikk for privat" : "Public — click to make private") : (isNb ? "Privat — klikk for offentlig" : "Private — click to make public")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Badge className={`${statusCfg.className} text-xs`}>
                {statusCfg.label}
              </Badge>
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

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Send className="h-3 w-3" />
              {isNb ? "Sendt" : "Sent"}: {new Date(request.sent_date).toLocaleDateString(locale)}
            </span>
            <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : ""}`}>
              <Clock className="h-3 w-3" />
              {isNb ? "Frist" : "Due"}: {new Date(request.due_date).toLocaleDateString(locale)}
            </span>
            {request.response_date && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                {isNb ? "Mottatt" : "Received"}: {new Date(request.response_date).toLocaleDateString(locale)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
