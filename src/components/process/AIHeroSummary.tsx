import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  iconBg: string;
  glowClass: string;
  isHighRisk: boolean;
  icon: React.ReactNode;
}> = {
  unacceptable: {
    label: "Uakseptabel",
    color: "text-destructive dark:text-destructive",
    iconBg: "bg-destructive/10 dark:bg-red-950/50 border-destructive/20 dark:border-destructive",
    glowClass: "",
    isHighRisk: true,
    icon: <ShieldAlert className="h-10 w-10" />,
  },
  high: {
    label: "Høy risiko",
    color: "text-destructive dark:text-destructive",
    iconBg: "bg-destructive/10 dark:bg-red-950/50 border-destructive/20 dark:border-destructive",
    glowClass: "",
    isHighRisk: true,
    icon: <AlertTriangle className="h-10 w-10" />,
  },
  limited: {
    label: "Begrenset",
    color: "text-warning dark:text-warning",
    iconBg: "bg-warning/10 dark:bg-amber-950/50 border-warning/20 dark:border-warning",
    glowClass: "animate-glow-pulse",
    isHighRisk: false,
    icon: <Eye className="h-10 w-10" />,
  },
  minimal: {
    label: "Minimal",
    color: "text-status-closed dark:text-status-closed",
    iconBg: "bg-status-closed/10 dark:bg-emerald-950/50 border-status-closed/20 dark:border-status-closed",
    glowClass: "animate-glow-pulse",
    isHighRisk: false,
    icon: <CheckCircle2 className="h-10 w-10" />,
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

  return (
    <div className={cn(
      "rounded-2xl border bg-card shadow-luxury overflow-hidden animate-float-in",
      riskConfig.isHighRisk && "border-destructive/20 dark:border-destructive"
    )}>
      {/* Main content - asymmetric layout */}
      <div className="p-8">
        {/* Status pill - minimalistisk */}
        <div className="flex items-center gap-2 mb-6">
          <div className={cn(
            "h-2 w-2 rounded-full animate-pulse",
            riskConfig.isHighRisk ? "bg-destructive" : "bg-primary"
          )} />
          {riskConfig.isHighRisk ? (
            <span className="text-sm font-medium text-destructive dark:text-destructive">
              Viktig vurdering kreves
            </span>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm font-medium text-muted-foreground cursor-help hover:text-foreground transition-colors">
                    Forslag fra Lara
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">
                    Lara er din KI-agent som analyserer prosesser og foreslår AI-risikokategorier basert på tilgjengelig informasjon.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span className="text-xs text-muted-foreground/60 ml-auto">
            {confidence === "high" ? "Høy" : confidence === "medium" ? "Middels" : "Lav"} sikkerhet
          </span>
        </div>

        {/* Risk indicator - large, left-aligned with glassmorphism */}
        <div className={cn(
          "inline-flex flex-col items-center gap-2 p-6 rounded-2xl border mb-6",
          "glass-card transition-silk animate-scale-in",
          riskConfig.iconBg,
          riskConfig.glowClass
        )}>
          <span className={riskConfig.color}>
            {riskConfig.icon}
          </span>
          <span className={cn("text-xl font-bold tracking-tight", riskConfig.color)}>
            {riskConfig.label}
          </span>
        </div>

        {/* Purpose description */}
        {purpose && (
          <p className="text-muted-foreground text-base leading-relaxed max-w-lg mb-8">
            {purpose}
          </p>
        )}

        {/* Action buttons - asymmetric */}
        <div className="flex flex-wrap gap-4">
          <Button 
            onClick={onAccept} 
            variant="luxury"
            className="h-12 px-8 hover-lift"
            disabled={isAccepting}
          >
            {isAccepting ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Check className="h-5 w-5 mr-2" />
            )}
            Bekreft og lagre
          </Button>
          <Button 
            variant="outline" 
            onClick={onAdjust}
            className="h-12 px-6 hover-lift"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Juster
          </Button>
        </div>
      </div>

      {/* Expand toggle - subtle footer */}
      <button
        onClick={onToggleExpand}
        className="w-full px-8 py-4 flex items-center justify-between text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 border-t transition-silk"
      >
        <span className="font-medium">
          {isExpanded ? "Skjul detaljer" : "Vis detaljer"}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};
