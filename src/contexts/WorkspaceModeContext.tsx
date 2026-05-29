import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type WorkspaceMode = "compliance" | "partner";

interface WorkspaceModeContextType {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
  /** In the demo prototype both modes are always available. */
  availableModes: WorkspaceMode[];
  /** True when the user has more than one mode and can toggle. */
  canSwitch: boolean;
}

const STORAGE_KEY = "workspaceMode";
const PARTNER_ONLY_KEY = "workspaceModePartnerOnly";

const WorkspaceModeContext = createContext<WorkspaceModeContextType>({
  mode: "compliance",
  setMode: () => {},
  availableModes: ["compliance", "partner"],
  canSwitch: true,
});

export const useWorkspaceMode = () => useContext(WorkspaceModeContext);

export function WorkspaceModeProvider({ children }: { children: React.ReactNode }) {
  // Demo: a flag in localStorage can simulate a "partner only" user.
  const partnerOnly = typeof window !== "undefined" && localStorage.getItem(PARTNER_ONLY_KEY) === "1";
  const availableModes: WorkspaceMode[] = partnerOnly ? ["partner"] : ["compliance", "partner"];

  const [mode, setModeState] = useState<WorkspaceMode>(() => {
    if (typeof window === "undefined") return "compliance";
    if (partnerOnly) return "partner";
    const stored = localStorage.getItem(STORAGE_KEY) as WorkspaceMode | null;
    if (stored === "compliance" || stored === "partner") return stored;
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
      if (e.key === STORAGE_KEY && (e.newValue === "compliance" || e.newValue === "partner")) {
        setModeState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <WorkspaceModeContext.Provider value={{ mode, setMode, availableModes, canSwitch: availableModes.length > 1 }}>
      {children}
    </WorkspaceModeContext.Provider>
  );
}
