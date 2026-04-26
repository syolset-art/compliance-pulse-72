import { Bot, Sparkles, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AgentCapability } from "@/lib/complianceRequirementsData";

interface AgentCapabilityBadgeProps {
  capability: AgentCapability;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const capabilityConfig: Record<AgentCapability, {
  icon: typeof Bot;
  label: string;
  labelNo: string;
  description: string;
  colorClass: string;
  bgClass: string;
}> = {
  full: {
    icon: Bot,
    label: 'AI Ready',
    labelNo: 'AI-klar',
    description: 'Agent can complete this requirement autonomously',
    colorClass: 'text-status-closed dark:text-status-closed',
    bgClass: 'bg-status-closed/10 dark:bg-emerald-950/30 border-status-closed/20 dark:border-status-closed'
  },
  assisted: {
    icon: Sparkles,
    label: 'Assisted',
    labelNo: 'Assistert',
    description: 'AI prepares and suggests, human reviews and approves',
    colorClass: 'text-warning dark:text-warning',
    bgClass: 'bg-warning/10 dark:bg-amber-950/30 border-warning/20 dark:border-warning'
  },
  manual: {
    icon: User,
    label: 'Manual',
    labelNo: 'Manuell',
    description: 'Human must complete this requirement, agent advises',
    colorClass: 'text-slate-600 dark:text-slate-400',
    bgClass: 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-700'
  }
};

const sizeConfig = {
  sm: {
    iconSize: 'h-3 w-3',
    textSize: 'text-xs',
    padding: 'px-1.5 py-0.5',
    gap: 'gap-1'
  },
  md: {
    iconSize: 'h-3.5 w-3.5',
    textSize: 'text-xs',
    padding: 'px-2 py-0.5',
    gap: 'gap-1.5'
  },
  lg: {
    iconSize: 'h-4 w-4',
    textSize: 'text-sm',
    padding: 'px-2.5 py-1',
    gap: 'gap-2'
  }
};

export function AgentCapabilityBadge({ 
  capability, 
  showLabel = true, 
  size = 'md',
  className 
}: AgentCapabilityBadgeProps) {
  const config = capabilityConfig[capability];
  const sizeClasses = sizeConfig[size];
  const Icon = config.icon;

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center font-medium border",
        sizeClasses.padding,
        sizeClasses.gap,
        config.bgClass,
        config.colorClass,
        className
      )}
    >
      <Icon className={sizeClasses.iconSize} />
      {showLabel && (
        <span className={sizeClasses.textSize}>{config.label}</span>
      )}
    </Badge>
  );

  if (!showLabel) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}

// Summary component showing all three capability counts
interface AgentCapabilitySummaryProps {
  counts: {
    full: number;
    assisted: number;
    manual: number;
  };
  size?: 'sm' | 'md';
  className?: string;
}

export function AgentCapabilitySummary({ counts, size = 'sm', className }: AgentCapabilitySummaryProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-status-closed dark:text-status-closed">
            <Bot className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            <span className={cn("font-medium", size === 'sm' ? 'text-xs' : 'text-sm')}>{counts.full}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{counts.full} requirements AI can handle autonomously</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-warning dark:text-warning">
            <Sparkles className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            <span className={cn("font-medium", size === 'sm' ? 'text-xs' : 'text-sm')}>{counts.assisted}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{counts.assisted} requirements with AI assistance</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <User className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            <span className={cn("font-medium", size === 'sm' ? 'text-xs' : 'text-sm')}>{counts.manual}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{counts.manual} requirements requiring manual action</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
