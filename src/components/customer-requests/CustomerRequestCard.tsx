import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Shield, FileCheck, Send, Clock } from "lucide-react";

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
}

interface CustomerRequestCardProps {
  request: CustomerRequest;
  onShare?: (id: string) => void;
}

export function CustomerRequestCard({ request, onShare }: CustomerRequestCardProps) {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const locale = isNb ? "nb-NO" : "en-US";

  const Icon = REQUEST_TYPE_ICONS[request.request_type] || FileText;
  const typeLabel = isNb
    ? REQUEST_TYPE_LABELS_NB[request.request_type] || request.title
    : REQUEST_TYPE_LABELS_EN[request.request_type] || request.title;

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: typeof Clock }> = {
    pending: { label: t("customerRequests.status.pending", "Avventer"), variant: "secondary", icon: Clock },
    in_progress: { label: t("customerRequests.status.inProgress", "Under arbeid"), variant: "outline", icon: Send },
    completed: { label: t("customerRequests.status.completed", "Fullført"), variant: "default", icon: FileCheck },
    archived: { label: t("customerRequests.status.archived", "Arkivert"), variant: "secondary", icon: FileText },
  };

  const statusInfo = statusConfig[request.status] || statusConfig.pending;
  const isOverdue = request.due_date && new Date(request.due_date) < new Date() && request.status !== "completed";

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
              <p className="text-xs text-muted-foreground mt-0.5">
                {request.customer_name}
                {request.due_date && (
                  <span className={isOverdue ? "text-destructive ml-2 font-medium" : "ml-2"}>
                    · {isOverdue ? "⚠ " : ""}{t("customerRequests.due", "Frist")}: {new Date(request.due_date).toLocaleDateString(locale)}
                  </span>
                )}
              </p>
            </div>
            <Badge variant={statusInfo.variant} className="flex-shrink-0 text-xs">
              {statusInfo.label}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("customerRequests.progress", "Fremdrift")}</span>
              <span className="font-medium">{request.progress_percent}%</span>
            </div>
            <Progress value={request.progress_percent} className="h-2" />
          </div>

          <div className="flex items-center gap-2 pt-1">
            {request.status !== "completed" && request.status !== "archived" && (
              <Button size="sm" className="h-7 text-xs" onClick={() => onShare?.(request.id)}>
                <Send className="h-3 w-3 mr-1" />
                {t("customerRequests.share", "Del ferdig")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
