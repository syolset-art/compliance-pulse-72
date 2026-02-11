import { useState, createContext, useContext, ReactNode, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatPanel } from "./ChatPanel";
import { LaraAgent } from "./LaraAgent";
import { AddAssetDialog } from "@/components/dialogs/AddAssetDialog";
import { autoAssignAssetsToWorkAreas } from "@/hooks/useAutoAssignAssets";
import { toast } from "sonner";

interface GlobalChatContextType {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  toggleChat: () => void;
  openChatWithMessage: (message: string) => void;
  pendingMessage: string | null;
  clearPendingMessage: () => void;
  // Callback registration for asset added events
  registerAssetAddedCallback: (callback: () => void) => void;
  unregisterAssetAddedCallback: (callback: () => void) => void;
}

const GlobalChatContext = createContext<GlobalChatContextType | undefined>(undefined);

export function useGlobalChat() {
  const context = useContext(GlobalChatContext);
  if (!context) {
    // Return a safe fallback instead of throwing - prevents crashes during HMR or edge cases
    return {
      isChatOpen: false,
      setIsChatOpen: () => {},
      toggleChat: () => {},
      openChatWithMessage: () => {},
      pendingMessage: null,
      clearPendingMessage: () => {},
      registerAssetAddedCallback: () => {},
      unregisterAssetAddedCallback: () => {},
    } as GlobalChatContextType;
  }
  return context;
}

interface GlobalChatProviderProps {
  children: ReactNode;
}

export function GlobalChatProvider({ children }: GlobalChatProviderProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  
  // Store callbacks for asset added events
  const assetAddedCallbacksRef = useRef<Set<() => void>>(new Set());

  const { data: assetTypeTemplates = [] } = useQuery({
    queryKey: ["asset_type_templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("asset_type_templates").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const toggleChat = () => setIsChatOpen(prev => !prev);

  const openChatWithMessage = (message: string) => {
    setPendingMessage(message);
    setIsChatOpen(true);
  };

  const clearPendingMessage = () => setPendingMessage(null);

  const registerAssetAddedCallback = useCallback((callback: () => void) => {
    assetAddedCallbacksRef.current.add(callback);
  }, []);

  const unregisterAssetAddedCallback = useCallback((callback: () => void) => {
    assetAddedCallbacksRef.current.delete(callback);
  }, []);

  const handleAssetAdded = useCallback(async () => {
    setIsAddAssetOpen(false);
    
    // Auto-assign assets to work areas and create work areas if needed
    const result = await autoAssignAssetsToWorkAreas();
    
    if (result.workAreasCreated && result.suggestedWorkAreas.length > 0) {
      toast.success(`Opprettet ${result.suggestedWorkAreas.length} arbeidsområder`, {
        description: `Eiendelene dine er automatisk plassert i riktige arbeidsområder.`,
        duration: 5000,
      });
    } else if (result.assigned > 0) {
      toast.success(`${result.assigned} eiendeler plassert automatisk`, {
        description: "Eiendelene er tilordnet passende arbeidsområder.",
        duration: 4000,
      });
    }
    
    // Notify all registered callbacks (this will trigger refetchOnboarding in ChatInterface)
    assetAddedCallbacksRef.current.forEach(callback => callback());
  }, []);

  const handleShowContent = () => {
    // Content viewing is handled within ChatPanel
  };

  const handleBackToDashboard = () => {
    // Navigation is handled within pages
  };

  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  return (
    <GlobalChatContext.Provider 
      value={{ 
        isChatOpen, 
        setIsChatOpen, 
        toggleChat, 
        openChatWithMessage,
        pendingMessage,
        clearPendingMessage,
        registerAssetAddedCallback,
        unregisterAssetAddedCallback
      }}
    >
      {children}
      
      {/* Hide Lara and Chat on Auth page */}
      {!isAuthPage && (
        <>
          {/* Global Lara Agent Button */}
          <LaraAgent 
            onOpenAssetDialog={() => setIsAddAssetOpen(true)}
            onToggleChat={toggleChat}
            isChatOpen={isChatOpen}
          />

          {/* Global Chat Panel */}
          <ChatPanel
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            onShowContent={handleShowContent}
            onBackToDashboard={handleBackToDashboard}
          />

          {/* Global Add Asset Dialog - triggered from Lara onboarding */}
          <AddAssetDialog
            open={isAddAssetOpen}
            onOpenChange={setIsAddAssetOpen}
            onAssetAdded={handleAssetAdded}
            assetTypeTemplates={assetTypeTemplates}
          />
        </>
      )}
    </GlobalChatContext.Provider>
  );
}
