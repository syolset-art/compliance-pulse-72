import { Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Sidebar menu item that links to the plan / modules page.
 * (replaces the old credits indicator and no longer shows the active plan as a badge).
 */
export function CreditMenuItem() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/subscriptions")}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
    >
      <Crown className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 text-left">Moduler</span>
    </button>
  );
}
