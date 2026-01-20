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
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-950/50",
    borderColor: "border-red-200 dark:border-red-800",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  high: {
    label: "Høy risiko",
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
    borderColor: "border-orange-200 dark:border-orange-800",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  limited: {
    label: "Begrenset",
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
    borderColor: "border-amber-200 dark:border-amber-800",
    icon: <Eye className="h-4 w-4" />,
  },
  minimal: {
    label: "Minimal",
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
    borderColor: "border-emerald-200 dark:border-emerald-800",
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
              <p className="font-medium">Ingen AI-bruk</p>
              <p className="text-sm text-muted-foreground">
                Prosessen bruker ikke AI-funksjoner
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
      <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            AI-bruk dokumentert
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
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Trenger gjennomgang
            </div>
          )}
        </div>
      </div>
    </div>
  );
};