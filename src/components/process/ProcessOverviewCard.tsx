import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, BarChart3, User, Check, AlertTriangle } from "lucide-react";

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
  onClick: () => void;
}

export const ProcessOverviewCard = ({
  process,
  stats = { dataTypes: 0, systems: 0, riskScenarios: 0, pendingMitigations: 0 },
  criticality = "medium",
  processOwner = "Ukjent bruker",
  onClick,
}: ProcessOverviewCardProps) => {
  const getCriticalityConfig = (level: string) => {
    switch (level) {
      case "critical":
        return {
          label: "Kritisk",
          bgClass: "bg-red-500/20",
          textClass: "text-red-400",
          borderClass: "border-red-500/30",
        };
      case "high":
        return {
          label: "Høy",
          bgClass: "bg-orange-500/20",
          textClass: "text-orange-400",
          borderClass: "border-orange-500/30",
        };
      case "medium":
        return {
          label: "Moderat",
          bgClass: "bg-yellow-500/20",
          textClass: "text-yellow-400",
          borderClass: "border-yellow-500/30",
        };
      default:
        return {
          label: "Lav",
          bgClass: "bg-green-500/20",
          textClass: "text-green-400",
          borderClass: "border-green-500/30",
        };
    }
  };

  const critConfig = getCriticalityConfig(criticality);

  const getStatDotColor = (value: number, isWarning?: boolean) => {
    if (isWarning) return "bg-orange-400";
    if (value === 0) return "bg-blue-400";
    return "bg-green-400";
  };

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors border-border/50"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-4">
        {/* Title & Description */}
        <div>
          <h4 className="font-semibold text-sm leading-tight line-clamp-2">
            {process.name}
          </h4>
          {process.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3">
              {process.description}
            </p>
          )}
        </div>

        {/* Criticality Badge */}
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-md border ${critConfig.bgClass} ${critConfig.borderClass}`}
        >
          <div className="flex items-center gap-2">
            <Shield className={`h-4 w-4 ${critConfig.textClass}`} />
            <span className="text-xs font-medium">Kritikalitetsnivå</span>
          </div>
          <Badge
            variant="outline"
            className={`${critConfig.bgClass} ${critConfig.textClass} border-0 text-xs`}
          >
            {critConfig.label}
          </Badge>
        </div>

        {/* Process Statistics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="font-medium">Prosessstatistikk</span>
          </div>
          <div className="space-y-1.5 pl-5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${getStatDotColor(stats.dataTypes)}`} />
                <span className="text-muted-foreground">Datatyper</span>
              </div>
              <Badge variant="secondary" className="h-5 min-w-5 justify-center text-xs">
                {stats.dataTypes}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${getStatDotColor(stats.systems)}`} />
                <span className="text-muted-foreground">Systemer</span>
              </div>
              <Badge variant="secondary" className="h-5 min-w-5 justify-center text-xs">
                {stats.systems}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${stats.riskScenarios > 0 ? "bg-orange-400" : "bg-blue-400"}`} />
                <span className="text-muted-foreground">Risikoscenarioer</span>
              </div>
              <Badge variant="secondary" className="h-5 min-w-5 justify-center text-xs">
                {stats.riskScenarios}
              </Badge>
            </div>
            {stats.pendingMitigations > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-orange-400" />
                  <span className="text-orange-400">Tiltak ikke iverksatt</span>
                </div>
                <Badge variant="outline" className="h-5 min-w-5 justify-center text-xs text-orange-400 border-orange-400/50">
                  {stats.pendingMitigations}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Process Owner */}
        <div className="space-y-1.5 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span className="font-medium">Prosessansvarlig</span>
          </div>
          <div className="flex items-center gap-2 pl-5 text-xs">
            <Check className="h-3 w-3 text-green-400" />
            <span>{processOwner}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
