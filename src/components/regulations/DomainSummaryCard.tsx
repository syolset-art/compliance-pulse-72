import { CheckCircle2, AlertTriangle, Clock, Lock, Sparkles, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DomainSummaryCardProps {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  activeCount: number;
  totalCount: number;
  progress: number;
  status: 'good' | 'attention' | 'notStarted';
  onClick?: () => void;
  compact?: boolean;
  // New subscription-related props
  isIncludedInPlan?: boolean;
  addonPrice?: number | null; // in øre, null means included
  onActivateAddon?: () => void;
}

export function DomainSummaryCard({
  id,
  name,
  icon: Icon,
  color,
  bgColor,
  activeCount,
  totalCount,
  progress,
  status,
  onClick,
  compact = false,
  isIncludedInPlan = true,
  addonPrice = null,
  onActivateAddon
}: DomainSummaryCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'good':
        return {
          label: 'På god vei',
          icon: CheckCircle2,
          textClass: 'text-green-600 dark:text-green-400',
          bgClass: 'bg-green-50 dark:bg-green-950/30'
        };
      case 'attention':
        return {
          label: 'Trenger oppmerksomhet',
          icon: AlertTriangle,
          textClass: 'text-orange-600 dark:text-orange-400',
          bgClass: 'bg-orange-50 dark:bg-orange-950/30'
        };
      case 'notStarted':
      default:
        return {
          label: 'Ikke startet',
          icon: Clock,
          textClass: 'text-muted-foreground',
          bgClass: 'bg-muted/50'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Format price in NOK
  const formatPrice = (priceInOre: number) => {
    return new Intl.NumberFormat('nb-NO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(priceInOre / 100);
  };

  // Calculate SVG circle parameters
  const size = compact ? 48 : 64;
  const strokeWidth = compact ? 4 : 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Get progress color based on status
  const getProgressColor = () => {
    if (progress >= 70) return 'stroke-green-500';
    if (progress >= 40) return 'stroke-orange-500';
    return 'stroke-muted-foreground/30';
  };

  // Handle click - only if included or compact view
  const handleClick = () => {
    if (isIncludedInPlan || compact) {
      onClick?.();
    }
  };

  // Handle activate click
  const handleActivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onActivateAddon?.();
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 p-4 rounded-xl border bg-card cursor-pointer",
          "hover:border-primary/50 hover:shadow-md transition-all duration-200"
        )}
      >
        <div className={cn("p-2.5 rounded-lg", bgColor)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground">{activeCount} aktive</p>
        </div>
      </div>
    );
  }

  // Not included in plan - show locked state
  if (!isIncludedInPlan && addonPrice !== null) {
    return (
      <div
        className={cn(
          "relative p-5 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-card/50 overflow-hidden",
          "group"
        )}
      >
        {/* Locked overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-transparent" />
        
        <div className="relative">
          {/* Header with icon and lock */}
          <div className="flex items-start justify-between mb-4">
            <div className={cn("p-3 rounded-xl relative", bgColor, "opacity-60")}>
              <Icon className={cn("h-6 w-6", color)} />
              <Lock className="absolute -bottom-1 -right-1 h-4 w-4 text-muted-foreground bg-card rounded-full p-0.5" />
            </div>
            
            {/* Price badge */}
            <Badge variant="secondary" className="text-xs">
              +{formatPrice(addonPrice)} kr/mnd
            </Badge>
          </div>

          {/* Domain name */}
          <h3 className="font-semibold text-foreground/70 mb-1">{name}</h3>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4">
            {totalCount} regelverk tilgjengelig
          </p>

          {/* Activate button */}
          <Button
            onClick={handleActivate}
            variant="outline"
            size="sm"
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Aktiver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative p-5 rounded-xl border bg-card cursor-pointer overflow-hidden min-w-0",
        "hover:border-primary/50 hover:shadow-lg transition-all duration-200",
        "group"
      )}
    >
      {/* Subtle gradient background */}
      <div className={cn(
        "absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity",
        bgColor.replace('bg-', 'bg-gradient-to-br from-').replace('/10', ' to-transparent')
      )} />
      
      <div className="relative">
        {/* Header with icon and progress */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className={cn("p-3 rounded-xl shrink-0", bgColor)}>
            <Icon className={cn("h-6 w-6", color)} />
          </div>
          
          {/* Circular progress */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg width={size} height={size} className="-rotate-90">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted/30"
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={cn("transition-all duration-500", getProgressColor())}
              />
            </svg>
            <span className="absolute text-sm font-semibold text-foreground">
              {progress}%
            </span>
          </div>
        </div>

        {/* Included badge - moved below header */}
        {isIncludedInPlan && (
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 mb-3">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Inkludert
          </Badge>
        )}

        {/* Domain name */}
        <h3 className="font-semibold text-foreground mb-1">{name}</h3>
        
        {/* Active count */}
        <p className="text-sm text-muted-foreground mb-3">
          {activeCount} av {totalCount} regelverk
        </p>

        {/* Status badge */}
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          statusConfig.bgClass, statusConfig.textClass
        )}>
          <StatusIcon className="h-3 w-3" />
          {statusConfig.label}
        </div>
      </div>
    </div>
  );
}
