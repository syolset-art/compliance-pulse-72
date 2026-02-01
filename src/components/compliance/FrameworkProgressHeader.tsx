import { Shield, Lock, Bot, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AgentCapabilitySummary } from "./AgentCapabilityBadge";
import { cn } from "@/lib/utils";

interface FrameworkProgressHeaderProps {
  frameworkId: string;
  frameworkName: string;
  frameworkIcon?: 'shield' | 'lock' | 'bot' | 'award';
  total: number;
  completed: number;
  inProgress?: number;
  aiHandling?: number;
  capabilityCounts: {
    full: number;
    assisted: number;
    manual: number;
  };
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconMap = {
  shield: Shield,
  lock: Lock,
  bot: Bot,
  award: Award
};

export function FrameworkProgressHeader({
  frameworkId,
  frameworkName,
  frameworkIcon = 'shield',
  total,
  completed,
  inProgress = 0,
  aiHandling = 0,
  capabilityCounts,
  showDetails = true,
  size = 'md',
  className
}: FrameworkProgressHeaderProps) {
  const Icon = iconMap[frameworkIcon];
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const sizeConfig = {
    sm: {
      iconContainer: 'p-2',
      iconSize: 'h-4 w-4',
      titleSize: 'text-sm',
      subtitleSize: 'text-xs',
      progressHeight: 'h-1.5',
      badgeSize: 'text-xs'
    },
    md: {
      iconContainer: 'p-2.5',
      iconSize: 'h-5 w-5',
      titleSize: 'text-base',
      subtitleSize: 'text-xs',
      progressHeight: 'h-2',
      badgeSize: 'text-xs'
    },
    lg: {
      iconContainer: 'p-3',
      iconSize: 'h-6 w-6',
      titleSize: 'text-lg',
      subtitleSize: 'text-sm',
      progressHeight: 'h-2.5',
      badgeSize: 'text-sm'
    }
  };

  const config = sizeConfig[size];

  // Determine status badge
  const getStatusBadge = () => {
    if (progressPercent === 100) {
      return <Badge variant="action" className={config.badgeSize}>Compliant</Badge>;
    }
    if (progressPercent >= 80) {
      return <Badge variant="default" className={config.badgeSize}>Nearly Ready</Badge>;
    }
    if (progressPercent >= 50) {
      return <Badge variant="secondary" className={config.badgeSize}>In Progress</Badge>;
    }
    if (progressPercent > 0) {
      return <Badge variant="warning" className={config.badgeSize}>Getting Started</Badge>;
    }
    return <Badge variant="outline" className={config.badgeSize}>Not Started</Badge>;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-lg bg-primary/10", config.iconContainer)}>
            <Icon className={cn("text-primary", config.iconSize)} />
          </div>
          <div>
            <h3 className={cn("font-semibold", config.titleSize)}>{frameworkName}</h3>
            <p className={cn("text-muted-foreground", config.subtitleSize)}>
              {completed} of {total} requirements completed
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Completion</span>
          <span className="font-semibold">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className={config.progressHeight} />
      </div>

      {/* Details row */}
      {showDetails && (
        <div className="flex items-center justify-between">
          <AgentCapabilitySummary counts={capabilityCounts} size="sm" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {inProgress > 0 && (
              <span>{inProgress} in progress</span>
            )}
            {aiHandling > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Bot className="h-3 w-3 mr-1" />
                {aiHandling} AI active
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
