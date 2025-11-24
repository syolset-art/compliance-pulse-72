import { createContext, useContext, useState, ReactNode } from "react";

type NavigationMode = "menu" | "chat";

interface NavigationModeContextType {
  mode: NavigationMode;
  toggleMode: () => void;
  setMode: (mode: NavigationMode) => void;
}

const NavigationModeContext = createContext<NavigationModeContextType | undefined>(undefined);

export function NavigationModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<NavigationMode>("menu");

  const toggleMode = () => {
    setMode(prev => prev === "menu" ? "chat" : "menu");
  };

  return (
    <NavigationModeContext.Provider value={{ mode, toggleMode, setMode }}>
      {children}
    </NavigationModeContext.Provider>
  );
}

export function useNavigationMode() {
  const context = useContext(NavigationModeContext);
  if (context === undefined) {
    throw new Error("useNavigationMode must be used within a NavigationModeProvider");
  }
  return context;
}
