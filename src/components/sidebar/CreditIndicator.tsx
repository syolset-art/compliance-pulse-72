import { useCredits } from "@/hooks/useCredits";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

export function CreditIndicator() {
  const { balance, monthlyAllowance, percentRemaining, isLow, isExhausted, isLoading } = useCredits();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isNb = i18n.language === "nb";

  if (isLoading) return null;

  const barColor = isExhausted
    ? "bg-destructive"
    : isLow
      ? "bg-warning"
      : "bg-primary";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => navigate("/subscriptions")}
          className="w-full px-4 py-3 border-t border-sidebar-border hover:bg-sidebar-accent/50 transition-colors text-left"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-sidebar-foreground/60" />
              <span className="text-xs font-medium text-sidebar-foreground/80">Credits</span>
            </div>
            <span className={cn(
              "text-xs font-semibold",
              isExhausted ? "text-destructive" : isLow ? "text-warning" : "text-sidebar-foreground/70"
            )}>
              {balance}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-sidebar-accent overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${Math.max(percentRemaining, 2)}%` }}
            />
          </div>
          {isExhausted && (
            <p className="text-[10px] text-destructive mt-1 font-medium">
              {isNb ? "Kjøp flere credits" : "Buy more credits"}
            </p>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p className="text-xs">
          {isNb
            ? `${balance} credits tilgjengelig · Klikk for å kjøpe flere`
            : `${balance} credits available · Click to buy more`}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
