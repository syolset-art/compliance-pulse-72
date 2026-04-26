import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Eye,
  Pencil,
  Users,
  Calendar,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface AIDocumentedSummaryProps {
  hasAI: boolean;
  riskLevel: string | null;
  purpose: string | null;
  affectedPersons: string[];
  lastReviewDate: string | null;
  complianceStatus: string | null;
  onEdit: () => void;
}

const RISK_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  unacceptable: {
    label: "Uakseptabel",
    color: "text-destructive dark:text-destructive",
    bgColor: "bg-destructive/10 dark:bg-red-950/50",
    borderColor: "border-destructive/20 dark:border-destructive",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  high: {
    label: "Høy risiko",
    color: "text-warning dark:text-warning",
    bgColor: "bg-warning/10 dark:bg-orange-950/50",
    borderColor: "border-warning/20 dark:border-warning",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  limited: {
    label: "Begrenset",
    color: "text-warning dark:text-warning",
    bgColor: "bg-warning/10 dark:bg-amber-950/50",
    borderColor: "border-warning/20 dark:border-warning",
    icon: <Eye className="h-4 w-4" />,
  },
  minimal: {
    label: "Minimal",
    color: "text-status-closed dark:text-status-closed",
    bgColor: "bg-status-closed/10 dark:bg-emerald-950/50",
    borderColor: "border-status-closed/20 dark:border-status-closed",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
};

export const AIDocumentedSummary = ({
  hasAI,
  riskLevel,
  purpose,
  affectedPersons,
  lastReviewDate,
  complianceStatus,
  onEdit,
}: AIDocumentedSummaryProps) => {
  const { t } = useTranslation();
  
  const riskConfig = riskLevel ? RISK_CONFIG[riskLevel] : null;

  // If process doesn't use AI
  if (!hasAI) {
    return (
      <div className="rounded-2xl border bg-card shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-muted rounded-xl">
              <Bot className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Ingen KI-bruk</p>
              <p className="text-sm text-muted-foreground">
                Prosessen bruker ikke KI-funksjoner
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1.5" />
            Endre
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Success header */}
      <div className="px-5 py-3 bg-status-closed/10 dark:bg-emerald-950/30 border-b border-status-closed/20 dark:border-status-closed flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-status-closed dark:text-status-closed" />
          <span className="text-sm font-medium text-status-closed dark:text-status-closed">
            KI-bruk dokumentert
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 px-3">
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Rediger
        </Button>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Risk badge + purpose */}
        <div className="flex items-start gap-4">
          {riskConfig && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border shrink-0",
              riskConfig.bgColor,
              riskConfig.borderColor
            )}>
              <span className={riskConfig.color}>{riskConfig.icon}</span>
              <span className={cn("text-sm font-medium", riskConfig.color)}>
                {riskConfig.label}
              </span>
            </div>
          )}
          
          {purpose && (
            <p className="text-sm text-muted-foreground leading-relaxed pt-1.5">
              {purpose}
            </p>
          )}
        </div>

        {/* Meta info row */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t">
          {affectedPersons.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{affectedPersons.length} berørte grupper</span>
            </div>
          )}

          {lastReviewDate && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Sist oppdatert {format(new Date(lastReviewDate), "d. MMM yyyy", { locale: nb })}
              </span>
            </div>
          )}

          {complianceStatus === "not_assessed" && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 dark:bg-warning/30 text-warning dark:text-warning text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Trenger gjennomgang
            </div>
          )}
        </div>
      </div>
    </div>
  );
};