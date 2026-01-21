import { useState } from "react";
import { X, Sparkles, HelpCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/ChatInterface";
import laraButterfly from "@/assets/lara-butterfly.png";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePageContext, PageContext } from "@/hooks/usePageContext";
import { DemoHighlight, useDemoState } from "@/components/DemoHighlight";
import { DemoAgentPanel, DemoModeType } from "@/components/DemoAgentPanel";
import { DemoSyncProvider } from "@/contexts/DemoSyncContext";
import { DemoModeIndicator } from "@/components/DemoModeIndicator";
import { useDemoController } from "@/hooks/useDemoController";

interface ContentViewOptions {
  viewMode?: "cards" | "table" | "list" | "names-only";
  sortBy?: string;
  filterCriteria?: any;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onShowContent?: (contentType: string, filter?: string, options?: ContentViewOptions, explanation?: string) => void;
  onBackToDashboard?: () => void;
}

function ChatPanelContent({ isOpen, onClose, onShowContent, onBackToDashboard }: ChatPanelProps) {
  const isMobile = useIsMobile();
  const [hasMessages, setHasMessages] = useState(false);
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [activeDemoMode, setActiveDemoMode] = useState<DemoModeType | null>(null);
  const pageContext = usePageContext();
  const demoState = useDemoState();
  const demoController = useDemoController();

  const handleStartDemo = (scenarioId: string, mode: DemoModeType) => {
    setShowDemoPanel(false);
    setActiveDemoMode(mode);
    
    if (mode === "auto-demo") {
      // Start the visual auto-demo
      demoController.startDemo(scenarioId);
    } else {
      // Conversational mode - send a message to Lara
      const scenarioMessages: Record<string, string> = {
        "add-asset": "Hjelp meg legge til en eiendel",
        "gdpr-gap": "Vis meg GDPR gap-analysen",
        "compliance-report": "Generer en compliance-rapport",
        "work-areas": "Hjelp meg organisere arbeidsområder",
        "getting-started": "Vis meg hvordan jeg kommer i gang med Mynder"
      };
      setPendingMessage(scenarioMessages[scenarioId] || `Hjelp meg med ${scenarioId}`);
    }
  };

  const handleAskQuestion = (question: string) => {
    setPendingMessage(question);
    setShowDemoPanel(false);
  };
  
  const handleStopDemo = () => {
    demoController.stopDemo();
    setActiveDemoMode(null);
  };

  // Mobile: use Sheet
  if (isMobile) {
    return (
      <>
        {/* Demo mode indicator */}
        <DemoModeIndicator
          isRunning={demoController.isDemoRunning}
          currentStep={demoController.currentStep}
          totalSteps={demoController.totalSteps}
          narration={demoController.currentNarration}
          onStop={handleStopDemo}
          onSkip={demoController.nextStep}
        />
        
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <SheetContent side="right" className="w-full sm:w-[400px] p-0">
            <div className="flex h-full flex-col relative">
{hasMessages && <ChatPanelHeader onClose={onClose} onShowDemo={() => setShowDemoPanel(true)} showDemoButton pageName={pageContext.pageName} />}
              {!hasMessages && <MinimalHeader onClose={onClose} onShowDemo={() => setShowDemoPanel(true)} pageName={pageContext.pageName} />}
              <div className="flex-1 overflow-hidden">
                <ChatInterface 
                  onShowContent={onShowContent}
                  onBackToDashboard={onBackToDashboard}
                  onMessagesChange={setHasMessages}
                  pageContext={pageContext}
                  pendingMessage={pendingMessage}
                  onPendingMessageSent={() => setPendingMessage(null)}
                  demoMode={activeDemoMode}
                />
              </div>
              <DemoAgentPanel 
                pageContext={pageContext}
                onStartDemo={handleStartDemo}
                onAskQuestion={handleAskQuestion}
                isVisible={showDemoPanel}
                onClose={() => setShowDemoPanel(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
        <DemoHighlight 
          isActive={demoState.isActive}
          scenario={demoState.currentScenario}
          currentStep={demoState.currentStep}
          onNext={demoState.nextStep}
          onPrev={demoState.prevStep}
          onClose={demoState.closeDemo}
          onComplete={demoState.completeDemo}
        />
      </>
    );
  }

  // Desktop: floating panel (compact height, anchored to bottom-right)
  return (
    <>
      {/* Demo mode indicator */}
      <DemoModeIndicator
        isRunning={demoController.isDemoRunning}
        currentStep={demoController.currentStep}
        totalSteps={demoController.totalSteps}
        narration={demoController.currentNarration}
        onStop={handleStopDemo}
        onSkip={demoController.nextStep}
      />
      
      <div 
        className={cn(
          "fixed right-4 bottom-4 w-[400px] bg-card border border-border rounded-2xl shadow-2xl z-40 transition-all duration-300 ease-out flex flex-col overflow-hidden",
          isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95 pointer-events-none",
          hasMessages ? "h-[70vh] max-h-[800px]" : "h-[600px] max-h-[75vh]"
        )}
      >
        <div className="relative flex-1 flex flex-col overflow-hidden">
{hasMessages && <ChatPanelHeader onClose={onClose} onShowDemo={() => setShowDemoPanel(true)} showDemoButton pageName={pageContext.pageName} />}
          {!hasMessages && <MinimalHeader onClose={onClose} onShowDemo={() => setShowDemoPanel(true)} pageName={pageContext.pageName} />}
          <div className="flex-1 overflow-hidden">
            <ChatInterface 
              onShowContent={onShowContent}
              onBackToDashboard={onBackToDashboard}
              onMessagesChange={setHasMessages}
              pageContext={pageContext}
              pendingMessage={pendingMessage}
              onPendingMessageSent={() => setPendingMessage(null)}
              demoMode={activeDemoMode}
            />
          </div>
          <DemoAgentPanel 
            pageContext={pageContext}
            onStartDemo={handleStartDemo}
            onAskQuestion={handleAskQuestion}
            isVisible={showDemoPanel}
            onClose={() => setShowDemoPanel(false)}
          />
        </div>
      </div>
      <DemoHighlight 
        isActive={demoState.isActive}
        scenario={demoState.currentScenario}
        currentStep={demoState.currentStep}
        onNext={demoState.nextStep}
        onPrev={demoState.prevStep}
        onClose={demoState.closeDemo}
        onComplete={demoState.completeDemo}
      />
    </>
  );
}

// Wrap with DemoSyncProvider
export function ChatPanel(props: ChatPanelProps) {
  return (
    <DemoSyncProvider>
      <ChatPanelContent {...props} />
    </DemoSyncProvider>
  );
}

function MinimalHeader({ onClose, onShowDemo, pageName }: { onClose: () => void; onShowDemo: () => void; pageName?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-primary">Snakk med Lara</span>
        {pageName && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            📍 {pageName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary"
          onClick={onShowDemo}
          title="Vis demo-hjelp"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ChatPanelHeader({ onClose, onShowDemo, showDemoButton, pageName }: { onClose: () => void; onShowDemo: () => void; showDemoButton?: boolean; pageName?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        <img 
          src={laraButterfly} 
          alt="Lara" 
          className="w-8 h-8"
        />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground flex items-center gap-1 text-sm">
              Lara
              <Sparkles className="w-3 h-3 text-primary" />
            </h3>
            {pageName && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                📍 {pageName}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">AI-assistent</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {showDemoButton && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-primary"
            onClick={onShowDemo}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="text-xs">Demo</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

