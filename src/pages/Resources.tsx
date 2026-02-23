import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { QuickLinksPanel } from "@/components/support/QuickLinksPanel";
import { SupportChat } from "@/components/support/SupportChat";
import { KnowledgePanel } from "@/components/support/KnowledgePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Link2, BookOpen, Sparkles } from "lucide-react";

const Resources = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeContext, setActiveContext] = useState<string | null>(null);

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="px-4 pb-6 space-y-4">
            {/* Quick topic cards — horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
              {[
                { id: "mynder-help", emoji: "🧭", label: "Mynder" },
                { id: "lara", emoji: "🦋", label: "Lara" },
                { id: "iso", emoji: "🏅", label: "ISO" },
                { id: "faq", emoji: "💬", label: "FAQ" },
                { id: "regulatory", emoji: "📚", label: t("resources.chat.contextTraining") },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveContext(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    activeContext === item.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border/50 text-foreground/70 hover:bg-accent"
                  }`}
                >
                  <span>{item.emoji}</span>
                  {item.label}
                </button>
              ))}
            </div>

            {/* Chat panel */}
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
              <SupportChat activeContext={activeContext} onSelectContext={setActiveContext} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Desktop: elegant 3-column layout
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with subtle accent */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t("resources.title")}</h1>
                <p className="text-sm text-muted-foreground">{t("resources.subtitle")}</p>
              </div>
            </div>
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-[220px_1fr_220px] gap-5 h-[calc(100vh-200px)]">
            {/* Left: Quick links */}
            <div className="overflow-y-auto rounded-2xl border border-border/50 bg-card/50 p-4 shadow-sm">
              <QuickLinksPanel onSelectContext={setActiveContext} activeContext={activeContext} />
            </div>

            {/* Center: Chat */}
            <div className="border border-border/50 rounded-2xl bg-card shadow-md overflow-hidden flex flex-col ring-1 ring-primary/5">
              <SupportChat activeContext={activeContext} onSelectContext={setActiveContext} />
            </div>

            {/* Right: Knowledge base */}
            <div className="overflow-y-auto rounded-2xl border border-border/50 bg-card/50 p-4 shadow-sm">
              <KnowledgePanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Resources;
