import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type DemoMode = "auto-demo" | "conversational" | null;

export interface AssetData {
  asset_type?: string;
  name?: string;
  description?: string;
  vendor?: string;
  category?: string;
  risk_level?: string;
  criticality?: string;
}

interface DemoSyncState {
  // Demo mode
  demoMode: DemoMode;
  setDemoMode: (mode: DemoMode) => void;
  
  // Active dialog tracking
  activeDialog: string | null;
  setActiveDialog: (dialogId: string | null) => void;
  
  // Asset data being collected/filled
  assetData: AssetData;
  setAssetData: (data: AssetData) => void;
  setFieldValue: (field: keyof AssetData, value: string) => void;
  resetAssetData: () => void;
  
  // Current step in dialog
  currentStep: string | null;
  setCurrentStep: (step: string | null) => void;
  
  // Animation states for typewriter effect
  animatingField: string | null;
  setAnimatingField: (field: string | null) => void;
  
  // Progress tracking
  progress: number;
  setProgress: (progress: number) => void;
  
  // Skip database save in demo mode
  skipSave: boolean;
  
  // Callback when action is completed in conversational mode
  onActionComplete?: (action: string, data: any) => void;
  setOnActionComplete: (callback: ((action: string, data: any) => void) | undefined) => void;

  // Customer request demo flag
  customerRequestDemo: boolean;
  startCustomerRequestDemo: () => void;
  endCustomerRequestDemo: () => void;
}

const DemoSyncContext = createContext<DemoSyncState | null>(null);

export function DemoSyncProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoMode] = useState<DemoMode>(null);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [assetData, setAssetData] = useState<AssetData>({});
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [animatingField, setAnimatingField] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [onActionComplete, setOnActionComplete] = useState<((action: string, data: any) => void) | undefined>();
  const [customerRequestDemo, setCustomerRequestDemo] = useState(false);

  const startCustomerRequestDemo = useCallback(() => setCustomerRequestDemo(true), []);
  const endCustomerRequestDemo = useCallback(() => setCustomerRequestDemo(false), []);

  const setFieldValue = useCallback((field: keyof AssetData, value: string) => {
    setAssetData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetAssetData = useCallback(() => {
    setAssetData({});
    setCurrentStep(null);
    setAnimatingField(null);
    setProgress(0);
  }, []);

  const value: DemoSyncState = {
    demoMode,
    setDemoMode,
    activeDialog,
    setActiveDialog,
    assetData,
    setAssetData,
    setFieldValue,
    resetAssetData,
    currentStep,
    setCurrentStep,
    animatingField,
    setAnimatingField,
    progress,
    setProgress,
    skipSave: demoMode === "auto-demo",
    onActionComplete,
    setOnActionComplete,
    customerRequestDemo,
    startCustomerRequestDemo,
    endCustomerRequestDemo,
  };

  return (
    <DemoSyncContext.Provider value={value}>
      {children}
    </DemoSyncContext.Provider>
  );
}

export function useDemoSync() {
  const context = useContext(DemoSyncContext);
  if (!context) {
    throw new Error("useDemoSync must be used within a DemoSyncProvider");
  }
  return context;
}

// Optional hook that returns null if not in provider (for optional usage)
export function useDemoSyncOptional() {
  return useContext(DemoSyncContext);
}
