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
        <main className="flex-1 overflow-auto flex flex-col">
          <div className="px-4 pt-6 pb-2">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t("resources.title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("resources.subtitle")}</p>
          </div>
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="mx-4 grid grid-cols-3">
              <TabsTrigger value="chat" className="gap-1.5">
                <MessageCircle className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="links" className="gap-1.5">
                <Link2 className="h-4 w-4" />
                {t("resources.quickLinks.title")}
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-1.5">
                <BookOpen className="h-4 w-4" />
                {t("resources.knowledge.title")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
              <SupportChat activeContext={activeContext} onSelectContext={setActiveContext} />
            </TabsContent>
            <TabsContent value="links" className="p-4">
              <QuickLinksPanel onSelectContext={(id) => { setActiveContext(id); }} activeContext={activeContext} />
            </TabsContent>
            <TabsContent value="knowledge" className="p-4">
              <KnowledgePanel />
            </TabsContent>
          </Tabs>
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
