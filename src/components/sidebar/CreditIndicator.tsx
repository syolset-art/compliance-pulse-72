import { useSubscription } from "@/hooks/useSubscription";
import { useTranslation } from "react-i18next";
import { Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { PLAN_TIERS } from "@/lib/planConstants";

/**
 * Sidebar plan indicator (replaces the old credits indicator).
 * Shows the active plan as a clickable badge that links to the subscription page.
 */
export function CreditIndicator() {
  const { currentTier } = useSubscription();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isNb = i18n.language === "nb";
  const planName = PLAN_TIERS[currentTier].displayName;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => navigate("/subscriptions")}
          className="w-full px-4 py-3 border-t border-sidebar-border hover:bg-sidebar-accent/50 transition-colors text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-sidebar-foreground/80">
                {isNb ? "Plan" : "Plan"}
              </span>
            </div>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {planName}
            </span>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p className="text-xs">
          {isNb ? `Aktiv plan: ${planName} · Klikk for å endre` : `Active plan: ${planName} · Click to change`}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
