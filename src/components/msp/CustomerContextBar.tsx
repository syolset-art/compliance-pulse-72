import { useNavigate } from "react-router-dom";
import { Building2, ArrowLeft } from "lucide-react";
import { useActiveOrganization } from "@/contexts/ActiveOrganizationContext";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";

/** Vises i toppfeltet når partneren jobber inne i en kundes organisasjon. */
export function CustomerContextBar() {
  const { activeOrg, isCustomerContext, exitCustomerOrg } = useActiveOrganization();
  const { setMode } = useWorkspaceMode();
  const navigate = useNavigate();

  if (!isCustomerContext || !activeOrg) return null;

  const handleExit = () => {
    exitCustomerOrg();
    setMode("partner");
    navigate("/msp-dashboard");
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-semibold min-w-0">
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Jobber hos {activeOrg.name}</span>
      </span>
      <button
        onClick={handleExit}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Tilbake til partneroversikten</span>
      </button>
    </div>
  );
}
