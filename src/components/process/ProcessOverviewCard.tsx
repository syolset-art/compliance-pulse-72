import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, BarChart3, User, Check, AlertTriangle, Bot, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentFitChip } from "./AgentFitChip";
import type { ProcessAgentRec } from "@/hooks/useProcessAgentRecommendations";

interface AIUsageInfo {
  hasAI: boolean;
  riskCategory?: string | null;
  complianceStatus?: string | null;
}

interface ProcessOverviewCardProps {
  process: {
    id: string;
    name: string;
    description?: string | null;
  };
  stats?: {
    dataTypes: number;
    systems: number;
    riskScenarios: number;
    pendingMitigations: number;
  };
  criticality?: "low" | "medium" | "high" | "critical";
  processOwner?: string;
  aiUsage?: AIUsageInfo;
  agentRec?: ProcessAgentRec;
  workAreaId?: string;
  onClick: () => void;
}

const getAIRiskConfig = (riskCategory?: string | null, complianceStatus?: string | null) => {
  if (riskCategory === "unacceptable") {
    return {
      label: "Uakseptabel",
      icon: ShieldAlert,
      bgClass: "bg-destructive/15",
      textClass: "text-destructive dark:text-destructive",
      borderClass: "border-destructive/30",
      dotClass: "bg-destructive",
    };
  }
  if (riskCategory === "high") {
    return {
      label: "Høy risiko",
      icon: ShieldAlert,
      bgClass: "bg-warning/15",
      textClass: "text-warning dark:text-warning",
      borderClass: "border-warning/30",
      dotClass: "bg-warning",
    };
  }
  if (riskCategory === "limited") {
    return {
      label: "Begrenset",
      icon: ShieldCheck,
      bgClass: "bg-warning/15",
      textClass: "text-warning dark:text-warning",
      borderClass: "border-warning/30",
      dotClass: "bg-warning",
    };
  }
  if (riskCategory === "minimal") {
    return {
      label: "Minimal",
      icon: ShieldCheck,
      bgClass: "bg-status-closed/15",
      textClass: "text-status-closed dark:text-status-closed",
      borderClass: "border-status-closed/30",
      dotClass: "bg-status-closed",
    };
  }
  // Not assessed yet
  return {
    label: "Ikke vurdert",
    icon: ShieldQuestion,
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    borderClass: "border-border",
    dotClass: "bg-muted-foreground",
  };
};

export const ProcessOverviewCard = ({
  process,
  stats = { dataTypes: 0, systems: 0, riskScenarios: 0, pendingMitigations: 0 },
  criticality = "medium",
  processOwner = "Ukjent bruker",
  aiUsage,
  agentRec,
  workAreaId,
  onClick,
}: ProcessOverviewCardProps) => {
  const getCriticalityConfig = (level: string) => {
    switch (level) {
      case "critical":
        return {
          label: "Kritisk",
          bgClass: "bg-destructive/20",
          textClass: "text-destructive",
          borderClass: "border-destructive/30",
        };
      case "high":
        return {
          label: "Høy",
          bgClass: "bg-warning/20",
          textClass: "text-warning",
          borderClass: "border-warning/30",
        };
      case "medium":
        return {
          label: "Moderat",
          bgClass: "bg-warning/20",
          textClass: "text-warning",
          borderClass: "border-warning/30",
        };
      default:
        return {
          label: "Lav",
          bgClass: "bg-status-closed/20",
          textClass: "text-status-closed",
          borderClass: "border-status-closed/30",
        };
    }
  };

  const critConfig = getCriticalityConfig(criticality);

  const getStatDotColor = (value: number, isWarning?: boolean) => {
    if (isWarning) return "bg-warning";
    if (value === 0) return "bg-primary";
    return "bg-status-closed";
  };

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors border-border/50 active:scale-[0.99]"
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Title & AI Badge */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2">
              {process.name}
            </h4>
            {aiUsage?.hasAI && (
              <div className={cn(
                "flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[13px] font-medium",
                getAIRiskConfig(aiUsage.riskCategory, aiUsage.complianceStatus).bgClass,
                getAIRiskConfig(aiUsage.riskCategory, aiUsage.complianceStatus).borderClass,
                getAIRiskConfig(aiUsage.riskCategory, aiUsage.complianceStatus).textClass
              )}>
                <Bot className="h-3 w-3" />
                <span className="hidden sm:inline">AI</span>
              </div>
            )}
          </div>
          {process.description && (
            <p className="text-[13px] sm:text-xs text-muted-foreground line-clamp-2 sm:line-clamp-3">
              {process.description}
            </p>
          )}
        </div>

        {/* AI Risk Badge - Only shown if process has AI */}
        {aiUsage?.hasAI && (() => {
          const riskConfig = getAIRiskConfig(aiUsage.riskCategory, aiUsage.complianceStatus);
          const RiskIcon = riskConfig.icon;
          const isHighRisk = aiUsage.riskCategory === "high" || aiUsage.riskCategory === "unacceptable";
          
          return (
            <div
              className={cn(
                "flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border",
                riskConfig.bgClass,
                riskConfig.borderClass,
                isHighRisk && "animate-pulse"
              )}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <RiskIcon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", riskConfig.textClass)} />
                <span className="text-[13px] sm:text-xs font-medium">AI-risiko</span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "border-0 text-[13px] sm:text-xs",
                  riskConfig.bgClass,
                  riskConfig.textClass
                )}
              >
                {riskConfig.label}
              </Badge>
            </div>
          );
        })()}

        {/* Criticality Badge - Compact on mobile */}
        <div
          className={`flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border ${critConfig.bgClass} ${critConfig.borderClass}`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Shield className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${critConfig.textClass}`} />
            <span className="text-[13px] sm:text-xs font-medium">Kritikalitet</span>
          </div>
          <Badge
            variant="outline"
            className={`${critConfig.bgClass} ${critConfig.textClass} border-0 text-[13px] sm:text-xs`}
          >
            {critConfig.label}
          </Badge>
        </div>

        {/* Process Statistics - More compact on mobile */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[13px] sm:text-xs text-muted-foreground">
            <BarChart3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="font-medium">Statistikk</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:space-y-1.5 sm:block sm:pl-5">
            <div className="flex items-center justify-between text-[13px] sm:text-xs bg-muted/30 sm:bg-transparent rounded px-1.5 py-1 sm:p-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${getStatDotColor(stats.dataTypes)}`} />
                <span className="text-muted-foreground">Datatyper</span>
              </div>
              <Badge variant="secondary" className="h-4 sm:h-5 min-w-4 sm:min-w-5 justify-center text-[13px] sm:text-xs">
                {stats.dataTypes}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-[13px] sm:text-xs bg-muted/30 sm:bg-transparent rounded px-1.5 py-1 sm:p-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${getStatDotColor(stats.systems)}`} />
                <span className="text-muted-foreground">Systemer</span>
              </div>
              <Badge variant="secondary" className="h-4 sm:h-5 min-w-4 sm:min-w-5 justify-center text-[13px] sm:text-xs">
                {stats.systems}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-[13px] sm:text-xs bg-muted/30 sm:bg-transparent rounded px-1.5 py-1 sm:p-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${stats.riskScenarios > 0 ? "bg-warning" : "bg-primary"}`} />
                <span className="text-muted-foreground">Risikoer</span>
              </div>
              <Badge variant="secondary" className="h-4 sm:h-5 min-w-4 sm:min-w-5 justify-center text-[13px] sm:text-xs">
                {stats.riskScenarios}
              </Badge>
            </div>
            {stats.pendingMitigations > 0 && (
              <div className="flex items-center justify-between text-[13px] sm:text-xs bg-warning/10 dark:bg-orange-950/30 sm:bg-transparent rounded px-1.5 py-1 sm:p-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-warning" />
                  <span className="text-warning truncate">Tiltak mangler</span>
                </div>
                <Badge variant="outline" className="h-4 sm:h-5 min-w-4 sm:min-w-5 justify-center text-[13px] sm:text-xs text-warning border-warning/50">
                  {stats.pendingMitigations}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Process Owner - Compact on mobile */}
        <div className="space-y-1 sm:space-y-1.5 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[13px] sm:text-xs text-muted-foreground">
            <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="font-medium">Ansvarlig</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 pl-4 sm:pl-5 text-[13px] sm:text-xs">
            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-status-closed" />
            <span className="truncate">{processOwner}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
