import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/ChatInterface";
import laraButterfly from "@/assets/lara-butterfly.png";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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

export function ChatPanel({ isOpen, onClose, onShowContent, onBackToDashboard }: ChatPanelProps) {
  const isMobile = useIsMobile();

  // Mobile: use Sheet
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0">
          <div className="flex h-full flex-col">
            <ChatPanelHeader onClose={onClose} />
            <div className="flex-1 overflow-hidden">
              <ChatInterface 
                onShowContent={onShowContent}
                onBackToDashboard={onBackToDashboard}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: sliding panel
  return (
    <div 
      className={cn(
        "fixed right-0 top-0 h-screen w-[400px] bg-card border-l border-border shadow-2xl z-40 transition-transform duration-300 ease-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <ChatPanelHeader onClose={onClose} />
      <div className="flex-1 overflow-hidden">
        <ChatInterface 
          onShowContent={onShowContent}
          onBackToDashboard={onBackToDashboard}
        />
      </div>
    </div>
  );
}

function ChatPanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        <img 
          src={laraButterfly} 
          alt="Lara" 
          className="w-8 h-8"
        />
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-1 text-sm">
            Lara
            <Sparkles className="w-3 h-3 text-primary" />
          </h3>
          <p className="text-xs text-muted-foreground">AI-assistent</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
