import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { FileText, Shield, FileCheck, Clock, AlertTriangle, CheckCircle2, Hourglass, MoreHorizontal, Archive, Trash2, Globe, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const REQUEST_TYPE_ICONS: Record<string, typeof FileText> = {
  vendor_assessment: FileText,
  iso_documentation: Shield,
  dpa: FileCheck,
  soc2: FileText,
  gdpr_report: FileText,
};

const REQUEST_TYPE_LABELS_NB: Record<string, string> = {
  vendor_assessment: "Norsk leverandørvurdering",
  iso_documentation: "ISO 27001 dokumentasjon",
  dpa: "DPA-forespørsel",
  soc2: "SOC 2-rapport",
  gdpr_report: "GDPR-rapport",
};

const REQUEST_TYPE_LABELS_EN: Record<string, string> = {
  vendor_assessment: "Vendor assessment",
  iso_documentation: "ISO 27001 documentation",
  dpa: "DPA request",
  soc2: "SOC 2 report",
  gdpr_report: "GDPR report",
};

interface CustomerRequest {
  id: string;
  customer_name: string;
  customer_email: string | null;
  request_type: string;
  title: string;
  description: string | null;
  status: string;
  progress_percent: number;
  due_date: string | null;
  created_at: string;
  shared_mode?: string | null;
  shared_with_customers?: string[];
}

interface CustomerRequestCardProps {
  request: CustomerRequest;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onToggleVisibility?: (id: string, isPublic: boolean) => void;
}

function getDeadlineInfo(dueDate: string | null, status: string, isNb: boolean) {
  if (status === "completed") {
    return {
      label: isNb ? "Fullført" : "Completed",
      icon: CheckCircle2,
      className: "text-success",
      badgeClass: "bg-success/10 text-success border-success/20",
    };
  }

  if (!dueDate) {
    return {
      label: isNb ? "Ingen frist" : "No deadline",
      icon: Clock,
      className: "text-muted-foreground",
      badgeClass: "bg-muted text-muted-foreground border-border",
    };
  }

  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      label: isNb ? `${overdueDays} ${overdueDays === 1 ? "dag" : "dager"} over frist` : `${overdueDays} ${overdueDays === 1 ? "day" : "days"} overdue`,
      icon: AlertTriangle,
      className: "text-destructive",
      badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    };
  }

  if (diffDays <= 3) {
    return {
      label: isNb ? `${diffDays} ${diffDays === 1 ? "dag" : "dager"} igjen` : `${diffDays} ${diffDays === 1 ? "day" : "days"} left`,
      icon: Hourglass,
      className: "text-orange-600 dark:text-orange-400",
      badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    };
  }

  if (diffDays <= 7) {
    return {
      label: isNb ? `${diffDays} dager igjen` : `${diffDays} days left`,
      icon: Clock,
      className: "text-amber-600 dark:text-amber-400",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
  }

  return {
    label: isNb ? `${diffDays} dager igjen` : `${diffDays} days left`,
    icon: Clock,
    className: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground border-border",
  };
}

function getStatusConfig(status: string, isNb: boolean) {
  const configs: Record<string, { label: string; className: string }> = {
    new: {
      label: isNb ? "Ny" : "New",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    read: {
      label: isNb ? "Lest" : "Read",
      className: "bg-primary/10 text-primary border-primary/20",
    },
    responded: {
      label: isNb ? "Besvart" : "Responded",
      className: "bg-success/10 text-success border-success/20",
    },
    archived: {
      label: isNb ? "Arkivert" : "Archived",
      className: "bg-muted text-muted-foreground border-border",
    },
  };
  return configs[status] || configs.new;
}

export function CustomerRequestCard({ request, onDelete, onArchive, onToggleVisibility }: CustomerRequestCardProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const locale = isNb ? "nb-NO" : "en-US";
  const isPublic = request.shared_mode === "public";

  const Icon = REQUEST_TYPE_ICONS[request.request_type] || FileText;
  const typeLabel = isNb
    ? REQUEST_TYPE_LABELS_NB[request.request_type] || request.title
    : REQUEST_TYPE_LABELS_EN[request.request_type] || request.title;

  const statusInfo = getStatusConfig(request.status, isNb);
  const deadlineInfo = getDeadlineInfo(request.due_date, request.status, isNb);
  const DeadlineIcon = deadlineInfo.icon;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{typeLabel}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{request.customer_name}</p>
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
              <Badge variant="outline" className={`text-[13px] ${statusInfo.className}`}>
                {statusInfo.label}
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

          {/* Deadline indicator */}
          <div className={`flex items-center gap-1.5 text-xs ${deadlineInfo.className}`}>
            <DeadlineIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">{deadlineInfo.label}</span>
            {request.due_date && request.status !== "completed" && (
              <span className="text-muted-foreground font-normal ml-1">
                · {isNb ? "Frist" : "Due"}: {new Date(request.due_date).toLocaleDateString(locale, { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}