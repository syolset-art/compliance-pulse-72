import { useSubscription } from "./useSubscription";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";

export type DashboardVariant = "core" | "trust-only" | "partner";

/**
 * Decides which dashboard variant to render on "/".
 * - "partner": user is in partner workspace mode (handled by Index redirect).
 * - "trust-only": no Mynder Core (Systems/Vendors modules) active. Trust Center is the main surface.
 * - "core": default Mynder Core dashboard.
 */
export function useDashboardVariant(): { variant: DashboardVariant; isLoading: boolean } {
  const { mode } = useWorkspaceMode();
  const { hasCoreAccess, hasRegistriesAccess, isLoading } = useSubscription();

  if (mode === "partner") return { variant: "partner", isLoading: false };
  if (isLoading) return { variant: "core", isLoading: true };

  const trustOnly = !hasCoreAccess && !hasRegistriesAccess;
  return { variant: trustOnly ? "trust-only" : "core", isLoading: false };
}
