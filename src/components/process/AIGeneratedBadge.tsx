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
    className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
  },
  "suggested": {
    icon: <Bot className="h-3 w-3" />,
    label: "Foreslått",
    tooltipText: "AI har foreslått denne verdien basert på analyse",
    className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
  },
  "from-system": {
    icon: <Server className="h-3 w-3" />,
    label: "Fra system",
    tooltipText: "Hentet fra tilknyttet system",
    className: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
  },
  "requires-input": {
    icon: <AlertCircle className="h-3 w-3" />,
    label: "Krever input",
    tooltipText: "Dette feltet må fylles ut manuelt",
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
  },
  "confirmed": {
    icon: <Check className="h-3 w-3" />,
    label: "Bekreftet",
    tooltipText: "Denne verdien er bekreftet av bruker",
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
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
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
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
      isAIGenerated && "pl-3 border-l-2 border-purple-400 dark:border-purple-600 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-900/10 rounded-r-md",
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
