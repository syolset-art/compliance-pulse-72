import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { ContextualHelpPanelProps } from "@/components/shared/ContextualHelpPanel";

type HelpConfig = Omit<ContextualHelpPanelProps, "open" | "onOpenChange">;

interface HelpContextValue {
  /** Pages call this to register their help content */
  registerHelp: (config: HelpConfig) => void;
  /** Clear when page unmounts */
  clearHelp: () => void;
  /** Open the panel (called from TopBar) */
  openHelp: () => void;
  /** Internal */
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  helpConfig: HelpConfig | null;
}

const HelpContext = createContext<HelpContextValue | null>(null);

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [helpConfig, setHelpConfig] = useState<HelpConfig | null>(null);

  const registerHelp = useCallback((config: HelpConfig) => {
    setHelpConfig(config);
  }, []);

  const clearHelp = useCallback(() => {
    setHelpConfig(null);
  }, []);

  const openHelp = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <HelpContext.Provider value={{ registerHelp, clearHelp, openHelp, isOpen, setIsOpen, helpConfig }}>
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const ctx = useContext(HelpContext);
  if (!ctx) throw new Error("useHelp must be used within HelpProvider");
  return ctx;
}
