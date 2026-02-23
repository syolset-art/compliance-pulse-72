import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { QuickLinksPanel } from "@/components/support/QuickLinksPanel";
import { SupportChat } from "@/components/support/SupportChat";
import { KnowledgePanel } from "@/components/support/KnowledgePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Link2, BookOpen } from "lucide-react";

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

  // Desktop: 3-column layout
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">{t("resources.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("resources.subtitle")}</p>
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-[minmax(180px,220px)_1fr_minmax(180px,220px)] gap-4 h-[calc(100vh-180px)]">
            {/* Left: Quick links */}
            <div className="overflow-y-auto">
              <QuickLinksPanel onSelectContext={setActiveContext} activeContext={activeContext} />
            </div>

            {/* Center: Chat */}
            <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden flex flex-col">
              <SupportChat activeContext={activeContext} onSelectContext={setActiveContext} />
            </div>

            {/* Right: Knowledge base */}
            <div className="overflow-y-auto">
              <KnowledgePanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Resources;
