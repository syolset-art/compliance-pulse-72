import { useCredits } from "@/hooks/useCredits";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export function CreditMenuItem() {
  const { balance, percentRemaining, isLow, isExhausted, isLoading } = useCredits();
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
    <button
      onClick={() => navigate("/subscriptions")}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 text-left">{isNb ? "Credits" : "Credits"}</span>
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-1.5 w-12 rounded-full bg-sidebar-accent overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${Math.max(percentRemaining, 2)}%` }}
          />
        </div>
        <span className={cn(
          "text-xs font-semibold tabular-nums min-w-[2ch] text-right",
          isExhausted ? "text-destructive" : isLow ? "text-warning" : "text-sidebar-foreground/60"
        )}>
          {balance}
        </span>
      </div>
    </button>
  );
}
