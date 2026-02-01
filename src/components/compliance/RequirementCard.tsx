import { CheckCircle2, Circle, Clock, MinusCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AgentCapabilityBadge } from "./AgentCapabilityBadge";
import { cn } from "@/lib/utils";
import type { AgentCapability, RequirementPriority } from "@/lib/complianceRequirementsData";

export type RequirementStatus = 'not_started' | 'in_progress' | 'completed' | 'not_applicable';

interface RequirementCardProps {
  requirementId: string;
  name: string;
  description?: string;
  status: RequirementStatus;
  priority: RequirementPriority;
  agentCapability: AgentCapability;
  progressPercent?: number;
  isAiHandling?: boolean;
  onStartTask?: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
  className?: string;
}

const statusConfig: Record<RequirementStatus, {
  icon: typeof CheckCircle2;
  label: string;
  colorClass: string;
  bgClass: string;
}> = {
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30'
  },
  in_progress: {
    icon: Clock,
    label: 'In Progress',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30'
  },
  not_started: {
    icon: Circle,
    label: 'Not Started',
    colorClass: 'text-slate-400 dark:text-slate-500',
    bgClass: 'bg-slate-50 dark:bg-slate-900/30'
  },
  not_applicable: {
    icon: MinusCircle,
    label: 'Not Applicable',
    colorClass: 'text-slate-400 dark:text-slate-500',
    bgClass: 'bg-slate-50 dark:bg-slate-900/30'
  }
};

const priorityConfig: Record<RequirementPriority, {
  label: string;
  variant: 'default' | 'destructive' | 'secondary' | 'outline';
}> = {
  critical: { label: 'Critical', variant: 'destructive' },
  high: { label: 'High', variant: 'default' },
  medium: { label: 'Medium', variant: 'secondary' },
  low: { label: 'Low', variant: 'outline' }
};

export function RequirementCard({
  requirementId,
  name,
  description,
  status,
  priority,
  agentCapability,
  progressPercent = 0,
  isAiHandling = false,
  onStartTask,
  onViewDetails,
  compact = false,
  className
}: RequirementCardProps) {
  const statusInfo = statusConfig[status];
  const priorityInfo = priorityConfig[priority];
  const StatusIcon = statusInfo.icon;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-between py-2 px-3 rounded-lg border transition-colors",
          status === 'completed' ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900' : 'bg-card border-border hover:bg-muted/50',
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <StatusIcon className={cn("h-4 w-4 flex-shrink-0", statusInfo.colorClass)} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">{requirementId}</span>
              <span className={cn("text-sm font-medium truncate", status === 'completed' && 'text-muted-foreground line-through')}>
                {name}
              </span>
            </div>
          </div>
        </div>
        <AgentCapabilityBadge capability={agentCapability} showLabel={false} size="sm" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start justify-between p-4 rounded-lg border transition-all group",
        status === 'completed' 
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900' 
          : 'bg-card border-border hover:border-primary/30 hover:shadow-sm',
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className={cn("p-1.5 rounded-md mt-0.5", statusInfo.bgClass)}>
          {isAiHandling ? (
            <Loader2 className={cn("h-4 w-4 animate-spin", statusInfo.colorClass)} />
          ) : (
            <StatusIcon className={cn("h-4 w-4", statusInfo.colorClass)} />
          )}
        </div>
        
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {requirementId}
            </span>
            <span className={cn(
              "font-medium text-sm",
              status === 'completed' && 'text-muted-foreground'
            )}>
              {name}
            </span>
          </div>
          
          {description && status !== 'completed' && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          
          {status === 'in_progress' && progressPercent > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <Progress value={progressPercent} className="h-1.5 flex-1 max-w-32" />
              <span className="text-xs text-muted-foreground">{progressPercent}%</span>
            </div>
          )}
          
          {isAiHandling && status === 'in_progress' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Agent is working on this...
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {priority !== 'low' && status !== 'completed' && (
          <Badge variant={priorityInfo.variant} className="text-xs">
            {priorityInfo.label}
          </Badge>
        )}
        
        <AgentCapabilityBadge capability={agentCapability} size="sm" />
        
        {status === 'not_started' && onStartTask && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartTask}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Start <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
