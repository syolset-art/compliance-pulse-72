import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Eye,
  Pencil,
  Users,
  Calendar,
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
  shortLabel: string;
  color: string; 
  bgColor: string;
  icon: React.ReactNode;
}> = {
  unacceptable: {
    label: "Uakseptabel",
    shortLabel: "Uakseptabel",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  high: {
    label: "Høy risiko",
    shortLabel: "Høy",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  limited: {
    label: "Begrenset risiko",
    shortLabel: "Begrenset",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: <Eye className="h-4 w-4" />,
  },
  minimal: {
    label: "Minimal risiko",
    shortLabel: "Minimal",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
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
      <div className="rounded-xl border bg-muted/30 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Ingen AI-bruk</p>
              <p className="text-sm text-muted-foreground">
                Prosessen bruker ikke AI-funksjoner
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            Endre
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="font-medium text-green-700 dark:text-green-300">
            AI-bruk dokumentert
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-1" />
          Rediger
        </Button>
      </div>

      {/* Key metrics in a row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Risk level */}
        {riskConfig && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
            riskConfig.bgColor
          )}>
            <span className={riskConfig.color}>{riskConfig.icon}</span>
            <span className={cn("text-sm font-medium", riskConfig.color)}>
              {riskConfig.shortLabel}
            </span>
          </div>
        )}

        {/* Separator dot */}
        <span className="text-muted-foreground">•</span>

        {/* Purpose (truncated) */}
        {purpose && (
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {purpose}
          </span>
        )}

        {/* Separator dot */}
        {affectedPersons.length > 0 && (
          <>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{affectedPersons.length} berørte</span>
            </div>
          </>
        )}

        {/* Last review date */}
        {lastReviewDate && (
          <>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {format(new Date(lastReviewDate), "d. MMM yyyy", { locale: nb })}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Needs review badge */}
      {complianceStatus === "not_assessed" && (
        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
            Trenger gjennomgang
          </Badge>
        </div>
      )}
    </div>
  );
};
