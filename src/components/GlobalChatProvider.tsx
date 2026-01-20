import { useState, createContext, useContext, ReactNode } from "react";
import { ChatPanel } from "./ChatPanel";
import { LaraAgent } from "./LaraAgent";

interface GlobalChatContextType {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  toggleChat: () => void;
  openChatWithMessage: (message: string) => void;
  pendingMessage: string | null;
  clearPendingMessage: () => void;
}

const GlobalChatContext = createContext<GlobalChatContextType | undefined>(undefined);

export function useGlobalChat() {
  const context = useContext(GlobalChatContext);
  if (!context) {
    throw new Error("useGlobalChat must be used within GlobalChatProvider");
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

  const toggleChat = () => setIsChatOpen(prev => !prev);

  const openChatWithMessage = (message: string) => {
    setPendingMessage(message);
    setIsChatOpen(true);
  };

  const clearPendingMessage = () => setPendingMessage(null);

  const handleShowContent = () => {
    // Content viewing is handled within ChatPanel
  };

  const handleBackToDashboard = () => {
    // Navigation is handled within pages
  };

  return (
    <GlobalChatContext.Provider 
      value={{ 
        isChatOpen, 
        setIsChatOpen, 
        toggleChat, 
        openChatWithMessage,
        pendingMessage,
        clearPendingMessage
      }}
    >
      {children}
      
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
    </GlobalChatContext.Provider>
  );
}
