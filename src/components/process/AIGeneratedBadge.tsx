import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, Server, AlertCircle, Check, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeVariant = "ai-generated" | "from-system" | "requires-input" | "confirmed" | "suggested";

interface AIGeneratedBadgeProps {
  variant: BadgeVariant;
  source?: string;
  className?: string;
  showTooltip?: boolean;
  size?: "sm" | "md";
}

const variantConfig: Record<BadgeVariant, {
  icon: React.ReactNode;
  label: string;
  tooltipText: string;
  className: string;
}> = {
  "ai-generated": {
    icon: <Sparkles className="h-3 w-3" />,
    label: "AI-generert",
    tooltipText: "Dette feltet er automatisk utfylt basert på systemdata",
    className: "bg-accent/10 text-foreground border-accent/20 dark:bg-foreground/30 dark:text-accent dark:border-accent"
  },
  "suggested": {
    icon: <Bot className="h-3 w-3" />,
    label: "Foreslått",
    tooltipText: "AI har foreslått denne verdien basert på analyse",
    className: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/30 dark:text-primary dark:border-primary"
  },
  "from-system": {
    icon: <Server className="h-3 w-3" />,
    label: "Fra system",
    tooltipText: "Hentet fra tilknyttet system",
    className: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/30 dark:text-primary dark:border-primary"
  },
  "requires-input": {
    icon: <AlertCircle className="h-3 w-3" />,
    label: "Krever input",
    tooltipText: "Dette feltet må fylles ut manuelt",
    className: "bg-warning/10 text-warning border-warning/20 dark:bg-warning/30 dark:text-warning dark:border-warning"
  },
  "confirmed": {
    icon: <Check className="h-3 w-3" />,
    label: "Bekreftet",
    tooltipText: "Denne verdien er bekreftet av bruker",
    className: "bg-status-closed/10 text-status-closed border-status-closed/20 dark:bg-status-closed/30 dark:text-status-closed dark:border-status-closed"
  }
};

export function AIGeneratedBadge({ 
  variant, 
  source, 
  className,
  showTooltip = true,
  size = "sm"
}: AIGeneratedBadgeProps) {
  const config = variantConfig[variant];
  
  const tooltipText = source 
    ? `${config.tooltipText} (${source})`
    : config.tooltipText;

  const badge = (
    <Badge 
      variant="outline"
      className={cn(
        "gap-1 font-normal border animate-in fade-in duration-300",
        size === "sm" ? "text-[13px] px-1.5 py-0" : "text-xs px-2 py-0.5",
        config.className,
        className
      )}
    >
      {config.icon}
      <span>{source && variant === "from-system" ? `Fra: ${source}` : config.label}</span>
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Field wrapper component for consistent styling of AI-generated fields
interface AIFieldWrapperProps {
  isAIGenerated?: boolean;
  source?: string;
  children: React.ReactNode;
  className?: string;
  showBadge?: boolean;
  label?: string;
}

export function AIFieldWrapper({
  isAIGenerated = false,
  source,
  children,
  className,
  showBadge = true,
  label
}: AIFieldWrapperProps) {
  return (
    <div className={cn(
      "relative transition-all duration-200",
      isAIGenerated && "pl-3 border-l-2 border-accent dark:border-accent bg-gradient-to-r from-accent/50 to-transparent dark:from-accent/10 rounded-r-md",
      className
    )}>
      {label && (
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {isAIGenerated && showBadge && (
            <AIGeneratedBadge 
              variant="ai-generated" 
              source={source}
              size="sm"
            />
          )}
        </div>
      )}
      {children}
      {!label && isAIGenerated && showBadge && (
        <div className="absolute -top-1 -right-1">
          <AIGeneratedBadge 
            variant="ai-generated" 
            source={source}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}

// Legend component explaining the different badge types
export function AIBadgeLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg text-xs", className)}>
      <div className="flex items-center gap-1">
        <AIGeneratedBadge variant="ai-generated" showTooltip={false} size="sm" />
        <span className="text-muted-foreground">= Auto-utfylt</span>
      </div>
      <div className="flex items-center gap-1">
        <AIGeneratedBadge variant="requires-input" showTooltip={false} size="sm" />
        <span className="text-muted-foreground">= Må fylles ut</span>
      </div>
    </div>
  );
}
