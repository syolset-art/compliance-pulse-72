import { useSubscription } from "@/hooks/useSubscription";
import { Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PLAN_TIERS } from "@/lib/planConstants";

/**
 * Sidebar menu item that shows the active plan as a badge
 * (replaces the old credits indicator).
 */
export function CreditMenuItem() {
  const { currentTier } = useSubscription();
  const navigate = useNavigate();
  const planName = PLAN_TIERS[currentTier].displayName;

  return (
    <button
      onClick={() => navigate("/subscriptions")}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
    >
      <Crown className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 text-left">Plan</span>
      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
        {planName}
      </span>
    </button>
  );
}
