import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Loader2,
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
  icon: React.ReactNode;
}> = {
  unacceptable: {
    label: "Uakseptabel risiko",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    borderColor: "border-red-300 dark:border-red-700",
    icon: <ShieldAlert className="h-8 w-8" />,
  },
  high: {
    label: "Høy risiko",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    borderColor: "border-orange-300 dark:border-orange-700",
    icon: <AlertTriangle className="h-8 w-8" />,
  },
  limited: {
    label: "Begrenset risiko",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    borderColor: "border-yellow-300 dark:border-yellow-700",
    icon: <Eye className="h-8 w-8" />,
  },
  minimal: {
    label: "Minimal risiko",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-300 dark:border-green-700",
    icon: <CheckCircle2 className="h-8 w-8" />,
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
  
  const confidenceLabel = {
    high: "Høy sikkerhet",
    medium: "Middels sikkerhet",
    low: "Lav sikkerhet",
  }[confidence];

  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 space-y-5">
      {/* Header with Lara badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Lara</span>
        </div>
        <span className="text-sm text-muted-foreground">har analysert prosessen</span>
      </div>

      {/* Main visual risk indicator */}
      <div className="flex flex-col items-center text-center py-4">
        <div className={cn(
          "p-6 rounded-2xl border-2 mb-4 transition-all",
          riskConfig.bgColor,
          riskConfig.borderColor
        )}>
          <div className={riskConfig.color}>
            {riskConfig.icon}
          </div>
        </div>
        
        <h3 className={cn("text-xl font-semibold", riskConfig.color)}>
          {riskConfig.label}
        </h3>
        
        <Badge variant="outline" className="mt-2 text-xs">
          {confidenceLabel}
        </Badge>
      </div>

      {/* Short purpose description */}
      {purpose && (
        <p className="text-center text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
          "{purpose}"
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button 
          onClick={onAccept} 
          className="flex-1"
          disabled={isAccepting}
        >
          {isAccepting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Bekreft
        </Button>
        <Button 
          variant="outline" 
          onClick={onAdjust}
          className="flex-1"
        >
          Juster og fullfør
        </Button>
      </div>

      {/* Expand details toggle */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pt-2"
      >
        {isExpanded ? (
          <>
            <span>Skjul detaljer</span>
            <ChevronUp className="h-4 w-4" />
          </>
        ) : (
          <>
            <span>Se detaljer</span>
            <ChevronDown className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
};
