import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrganization } from "@/contexts/ActiveOrganizationContext";

export type WorkspaceMode = "compliance" | "partner" | "admin";

const ADMIN_ROLES = ["super_admin", "daglig_leder"] as const;
/** Mynder-eide organisasjoner / e-postdomener som alltid har admin-modus. */
const MYNDER_EMAIL_DOMAINS = ["mynder.no", "mynder.ai", "mynder.com"];
const isMynderOrgName = (name?: string | null) =>
  !!name && /(^|\s)mynder(\s|$|\sas\b)/i.test(name.trim());


interface WorkspaceModeContextType {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
  /** Available modes depend on role and flags. */
  availableModes: WorkspaceMode[];
  /** True when the user has more than one mode and can toggle. */
  canSwitch: boolean;
}

const STORAGE_KEY = "workspaceMode";
const PARTNER_ONLY_KEY = "workspaceModePartnerOnly";

const VALID_MODES: WorkspaceMode[] = ["compliance", "partner", "admin"];

const isValidMode = (value: string | null): value is WorkspaceMode =>
  VALID_MODES.includes(value as WorkspaceMode);

const WorkspaceModeContext = createContext<WorkspaceModeContextType>({
  mode: "compliance",
  setMode: () => {},
  availableModes: ["compliance", "partner"],
  canSwitch: true,
});

export const useWorkspaceMode = () => useContext(WorkspaceModeContext);

export function WorkspaceModeProvider({ children }: { children: React.ReactNode }) {
  const { allRoles, isLoading } = useUserRole();
  const { user } = useAuth();
  const { activeOrg, organizations } = useActiveOrganization();

  const hasAdminRole = !isLoading && allRoles.some((r) => ADMIN_ROLES.includes(r as any));
  const email = user?.email?.toLowerCase() ?? "";
  const isMynderEmail = MYNDER_EMAIL_DOMAINS.some((d) => email.endsWith(`@${d}`));
  const isMynderOrg =
    isMynderOrgName(activeOrg?.name) ||
    organizations.some((o) => o.type === "own" && isMynderOrgName(o.name));

  const isAdminUser = hasAdminRole || isMynderEmail || isMynderOrg;

  // Demo: a flag in localStorage can simulate a "partner only" user.
  const partnerOnly = typeof window !== "undefined" && localStorage.getItem(PARTNER_ONLY_KEY) === "1";

  const availableModes = useMemo<WorkspaceMode[]>(() => {
    const modes: WorkspaceMode[] = partnerOnly ? ["partner"] : ["compliance", "partner"];
    if (isAdminUser) modes.push("admin");
    return modes;
  }, [partnerOnly, isAdminUser]);


  const [mode, setModeState] = useState<WorkspaceMode>(() => {
    if (typeof window === "undefined") return "compliance";
    if (partnerOnly) return "partner";
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isValidMode(stored)) return stored;
    return "compliance";
  });

  const setMode = useCallback((next: WorkspaceMode) => {
    setModeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    // Broadcast for other tabs / listeners
    window.dispatchEvent(new CustomEvent("workspace-mode:change", { detail: { mode: next } }));
  }, []);

  // React to mode changes coming from other tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && isValidMode(e.newValue)) {
        setModeState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // If an invalid/disabled mode is active (e.g. admin mode lost after role change), fall back.
  useEffect(() => {
    if (!availableModes.includes(mode)) {
      const fallback: WorkspaceMode = availableModes.includes("compliance") ? "compliance" : availableModes[0] || "compliance";
      setMode(fallback);
    }
  }, [availableModes, mode, setMode]);

  return (
    <WorkspaceModeContext.Provider value={{ mode, setMode, availableModes, canSwitch: availableModes.length > 1 }}>
      {children}
    </WorkspaceModeContext.Provider>
  );
}
