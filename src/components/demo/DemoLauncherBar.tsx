import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Play, ArrowLeft } from "lucide-react";
import laraButterfly from "@/assets/lara-butterfly.png";
import { DEMO_SCENARIOS, useDemoState } from "@/components/DemoHighlight";
import { DemoHighlight } from "@/components/DemoHighlight";

/**
 * Listens for `sessionStorage("pending-demo")` and shows a floating bar
 * offering to start the demo. Mounts at app level (e.g. in GlobalChatProvider
 * or a layout wrapper).
 */
export function DemoLauncherBar() {
  const navigate = useNavigate();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const demo = useDemoState();

  // Check for pending demo on mount and route changes
  useEffect(() => {
    const check = () => {
      const id = sessionStorage.getItem("pending-demo");
      if (id && DEMO_SCENARIOS[id]) {
        setPendingId(id);
      }
    };
    check();
    // Re-check after short delay (navigation may set it)
    const t = setTimeout(check, 600);
    return () => clearTimeout(t);
  }, []);

  const handleStart = () => {
    if (!pendingId) return;
    sessionStorage.removeItem("pending-demo");
    demo.startDemo(pendingId);
    setPendingId(null);
  };

  const handleDismiss = () => {
    sessionStorage.removeItem("pending-demo");
    setPendingId(null);
  };

  const scenario = pendingId ? DEMO_SCENARIOS[pendingId] : null;

  return (
    <>
      {/* Pending bar */}
      {scenario && !demo.isActive && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[90%] max-w-lg">
          <div className="bg-card border border-border rounded-xl shadow-2xl px-5 py-4 flex items-center gap-4">
            <img src={laraButterfly} alt="" className="w-8 h-8 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{scenario.title}</p>
              <p className="text-xs text-muted-foreground truncate">{scenario.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={handleStart} className="gap-1.5">
                <Play className="h-3.5 w-3.5" />
                Start demo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active demo overlay */}
      <DemoHighlight
        isActive={demo.isActive}
        scenario={demo.currentScenario}
        currentStep={demo.currentStep}
        onNext={demo.nextStep}
        onPrev={demo.prevStep}
        onClose={demo.closeDemo}
        onComplete={demo.completeDemo}
      />
    </>
  );
}
