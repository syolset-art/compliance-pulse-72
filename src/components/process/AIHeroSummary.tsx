import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Check,
  ShieldAlert,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Loader2,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIHeroSummaryProps {
  riskLevel: string | null;
  purpose: string | null;
  confidence: "high" | "medium" | "low";
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAccept: () => void;
  onAdjust: () => void;
  isAccepting?: boolean;
}

const RISK_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string; 
  borderColor: string;
  ringColor: string;
  headerBg: string;
  icon: React.ReactNode;
}> = {
  unacceptable: {
    label: "Uakseptabel risiko",
    color: "text-red-700 dark:text-red-200",
    bgColor: "bg-red-100 dark:bg-red-900/60",
    borderColor: "border-red-300 dark:border-red-700",
    ringColor: "ring-red-500/30",
    headerBg: "bg-red-500/10 dark:bg-red-900/40",
    icon: <ShieldAlert className="h-7 w-7" />,
  },
  high: {
    label: "Høy risiko",
    color: "text-red-600 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-900/40",
    borderColor: "border-red-200 dark:border-red-800",
    ringColor: "ring-red-500/25",
    headerBg: "bg-red-500/10 dark:bg-red-900/30",
    icon: <AlertTriangle className="h-7 w-7" />,
  },
  limited: {
    label: "Begrenset risiko",
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
    borderColor: "border-amber-200 dark:border-amber-800",
    ringColor: "ring-amber-500/20",
    headerBg: "bg-muted/40",
    icon: <Eye className="h-7 w-7" />,
  },
  minimal: {
    label: "Minimal risiko",
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    ringColor: "ring-emerald-500/20",
    headerBg: "bg-muted/40",
    icon: <CheckCircle2 className="h-7 w-7" />,
  },
};

export const AIHeroSummary = ({
  riskLevel,
  purpose,
  confidence,
  isExpanded,
  onToggleExpand,
  onAccept,
  onAdjust,
  isAccepting = false,
}: AIHeroSummaryProps) => {
  const { t } = useTranslation();
  
  const riskConfig = riskLevel ? RISK_CONFIG[riskLevel] : RISK_CONFIG.minimal;

  const isHighRisk = riskLevel === 'high' || riskLevel === 'unacceptable';

  return (
    <div className={cn(
      "rounded-2xl border bg-card shadow-sm overflow-hidden",
      isHighRisk && "border-red-200 dark:border-red-800"
    )}>
      {/* Header bar - use risk-appropriate color for high risk */}
      <div className={cn(
        "px-5 py-3 border-b flex items-center justify-between",
        riskConfig.headerBg
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full animate-pulse",
            isHighRisk ? "bg-red-500" : "bg-primary"
          )} />
          <span className={cn(
            "text-sm font-medium",
            isHighRisk ? "text-red-700 dark:text-red-300" : "text-muted-foreground"
          )}>
            {isHighRisk ? "⚠️ Viktig vurdering kreves" : "AI-analyse klar"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {confidence === "high" ? "Høy" : confidence === "medium" ? "Middels" : "Lav"} sikkerhet
        </span>
      </div>

      {/* Main content */}
      <div className="p-6 space-y-5">
        {/* Risk indicator - centered and prominent */}
        <div className="flex flex-col items-center text-center">
          <div className={cn(
            "inline-flex items-center gap-3 px-5 py-3 rounded-xl border ring-4 mb-3",
            riskConfig.bgColor,
            riskConfig.borderColor,
            riskConfig.ringColor
          )}>
            <span className={riskConfig.color}>
              {riskConfig.icon}
            </span>
            <span className={cn("text-lg font-semibold", riskConfig.color)}>
              {riskConfig.label}
            </span>
          </div>
          
          {/* Purpose description */}
          {purpose && (
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mt-2">
              {purpose}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-1">
          <Button 
            onClick={onAccept} 
            className="flex-1 h-11"
            disabled={isAccepting}
          >
            {isAccepting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Bekreft og lagre
          </Button>
          <Button 
            variant="outline" 
            onClick={onAdjust}
            className="flex-1 h-11"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Juster
          </Button>
        </div>
      </div>

      {/* Expand toggle - subtle footer */}
      <button
        onClick={onToggleExpand}
        className="w-full px-5 py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 border-t transition-colors"
      >
        {isExpanded ? (
          <>
            <span>Skjul detaljer</span>
            <ChevronUp className="h-4 w-4" />
          </>
        ) : (
          <>
            <span>Vis detaljer</span>
            <ChevronDown className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
};