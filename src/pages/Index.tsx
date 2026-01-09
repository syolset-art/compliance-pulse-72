import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { ContentViewer } from "@/components/ContentViewer";
import { CriticalTasksWidget } from "@/components/widgets/CriticalTasksWidget";
import { StatusOverviewWidget } from "@/components/widgets/StatusOverviewWidget";
import { SLAWidget } from "@/components/widgets/SLAWidget";
import { InherentRiskWidget } from "@/components/widgets/InherentRiskWidget";
import { ControlsWidget } from "@/components/widgets/ControlsWidget";
import { UpcomingTasksWidget } from "@/components/widgets/UpcomingTasksWidget";
import { SystemLibraryWidget } from "@/components/widgets/SystemLibraryWidget";
import { TaskProgressWidget } from "@/components/widgets/TaskProgressWidget";
import { ThirdPartyManagementWidget } from "@/components/widgets/ThirdPartyManagementWidget";
import { ComplianceCard } from "@/components/widgets/ComplianceCard";
import { LaraAgent } from "@/components/LaraAgent";
import { AddModuleDialog } from "@/components/AddModuleDialog";
import { AddSystemDialog } from "@/components/dialogs/AddSystemDialog";
import { AddWorkAreaDialog } from "@/components/dialogs/AddWorkAreaDialog";
import { AddRoleDialog } from "@/components/dialogs/AddRoleDialog";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [isAddSystemOpen, setIsAddSystemOpen] = useState(false);
  const [isAddWorkAreaOpen, setIsAddWorkAreaOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [contentView, setContentView] = useState<{ 
    type: string; 
    filter?: string;
    options?: {
      viewMode?: "cards" | "table" | "list" | "names-only";
      sortBy?: string;
      filterCriteria?: any;
    };
    explanation?: string;
  } | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      const { data } = await supabase
        .from("company_profile")
        .select("name")
        .limit(1)
        .maybeSingle();
      
      if (data?.name) {
        setCompanyName(data.name);
      }
    };
    fetchCompany();
  }, []);

  const handleShowContent = (contentType: string, filter?: string, options?: any, explanation?: string) => {
    setContentView({ type: contentType, filter, options, explanation });
  };

  const handleBackToDashboard = () => {
    setContentView(null);
  };

  const handleToggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  const handleModuleCreated = (moduleData: any) => {
    const explanation = `# Modul opprettet: ${moduleData.name}

**Type:** ${moduleData.type?.replace("-", " ")}
**Beskrivelse:** ${moduleData.description || "Ingen beskrivelse oppgitt"}
${moduleData.file ? `**Fil:** ${moduleData.file.name}` : ""}
${moduleData.config ? `\n## Konfigurasjon\n\`\`\`\n${moduleData.config}\n\`\`\`` : ""}

Modulen er nå tilgjengelig og kan brukes i AI-agenten. Du kan begynne å samhandle med den via chatten.`;

    handleShowContent("module", undefined, undefined, explanation);
  };

  // Mobile layout - simplified without resizable panels
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-mynder">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto bg-background/95 backdrop-blur-sm">
          {contentView ? (
            <ContentViewer 
              contentType={contentView.type} 
              filter={contentView.filter}
              viewMode={contentView.options?.viewMode}
              sortBy={contentView.options?.sortBy}
              filterCriteria={contentView.options?.filterCriteria}
              explanation={contentView.explanation}
            />
          ) : (
            <div className="container max-w-7xl mx-auto p-4 pt-6">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-foreground">{companyName || t("dashboard.title")}</h1>
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">{t("dashboard.title")}</span>
                  </div>
                  <Button onClick={() => setIsAddModuleOpen(true)} className="gap-2 bg-primary hover:bg-primary/90" size="sm">
                    <Plus className="h-4 w-4" />
                    {t("dashboard.addModule")}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
              </div>

              {/* Top Row - Critical Tasks & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <CriticalTasksWidget />
                <StatusOverviewWidget />
              </div>

              {/* SLA Widget */}
              <div className="mb-6">
                <SLAWidget />
              </div>

              {/* Risk & Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <InherentRiskWidget />
                <ControlsWidget />
              </div>

              {/* Tasks & Systems Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <UpcomingTasksWidget />
                <SystemLibraryWidget />
              </div>

              {/* Progress & Third Party Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TaskProgressWidget />
                <ThirdPartyManagementWidget />
              </div>
            </div>
          )}
        </main>

        <LaraAgent 
          onOpenSystemDialog={() => setIsAddSystemOpen(true)}
          onToggleChat={handleToggleChat}
        />

        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onShowContent={handleShowContent}
          onBackToDashboard={handleBackToDashboard}
        />

        <AddModuleDialog 
          open={isAddModuleOpen}
          onOpenChange={setIsAddModuleOpen}
          onModuleCreated={handleModuleCreated}
        />
        <AddSystemDialog
          open={isAddSystemOpen}
          onOpenChange={setIsAddSystemOpen}
          onSystemAdded={() => {}}
        />
        <AddWorkAreaDialog
          open={isAddWorkAreaOpen}
          onOpenChange={setIsAddWorkAreaOpen}
          onWorkAreaAdded={() => {}}
        />
        <AddRoleDialog
          open={isAddRoleOpen}
          onOpenChange={setIsAddRoleOpen}
          onRoleAdded={() => {}}
        />
      </div>
    );
  }

  // Desktop layout with resizable panels
  return (
    <div className="flex min-h-screen max-h-screen bg-gradient-mynder overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel 
          defaultSize={20} 
          minSize={15} 
          maxSize={30}
          className="min-w-[240px]"
        >
          <Sidebar />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={80}>
          <main className="h-screen overflow-y-auto bg-background/95 backdrop-blur-sm">
            {contentView ? (
              <ContentViewer 
                contentType={contentView.type} 
                filter={contentView.filter}
                viewMode={contentView.options?.viewMode}
                sortBy={contentView.options?.sortBy}
                filterCriteria={contentView.options?.filterCriteria}
                explanation={contentView.explanation}
              />
            ) : (
              <div className="container max-w-7xl mx-auto p-4 md:p-8 pt-6 md:pt-8">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground">{companyName || t("dashboard.title")}</h1>
                      <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">{t("dashboard.title")}</span>
                    </div>
                    <Button onClick={() => setIsAddModuleOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4" />
                      {t("dashboard.addModule")}
                    </Button>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground">{t("dashboard.subtitle")}</p>
                </div>

                {/* Top Row - Critical Tasks & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <CriticalTasksWidget />
                  <StatusOverviewWidget />
                </div>

                {/* SLA Widget */}
                <div className="mb-6">
                  <SLAWidget />
                </div>

                {/* Risk & Controls Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <InherentRiskWidget />
                  <ControlsWidget />
                </div>

                {/* Tasks & Systems Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <UpcomingTasksWidget />
                  <SystemLibraryWidget />
                </div>

                {/* Progress & Third Party Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <TaskProgressWidget />
                  <ThirdPartyManagementWidget />
                </div>

                {/* Compliance Analysis Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-semibold text-foreground">{t("dashboard.compliance.title")}</h2>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                      <span className="text-xs text-muted-foreground">i</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t("dashboard.compliance.subtitle")}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ComplianceCard
                      standard="gdpr"
                      title={t("dashboard.compliance.gdpr")}
                      percentage={77}
                      subtitle={t("dashboard.compliance.gdprDesc")}
                    />
                    <ComplianceCard
                      standard="iso"
                      title={t("dashboard.compliance.iso")}
                      percentage={77}
                      subtitle={t("dashboard.compliance.isoDesc")}
                    />
                    <ComplianceCard
                      standard="nis2"
                      title={t("dashboard.compliance.nis2")}
                      percentage={82}
                      subtitle={t("dashboard.compliance.nis2Desc")}
                    />
                    <ComplianceCard
                      standard="cra"
                      title={t("dashboard.compliance.cra")}
                      percentage={82}
                      subtitle={t("dashboard.compliance.craDesc")}
                    />
                  </div>
                </div>
              </div>
            )}
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Lara AI Agent */}
      <LaraAgent 
        onOpenSystemDialog={() => setIsAddSystemOpen(true)}
        onToggleChat={handleToggleChat}
      />

      {/* Chat Panel - Right side */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onShowContent={handleShowContent}
        onBackToDashboard={handleBackToDashboard}
      />

      {/* Add Module Dialog */}
      <AddModuleDialog 
        open={isAddModuleOpen}
        onOpenChange={setIsAddModuleOpen}
        onModuleCreated={handleModuleCreated}
      />

      {/* Onboarding Dialogs */}
      <AddSystemDialog
        open={isAddSystemOpen}
        onOpenChange={setIsAddSystemOpen}
        onSystemAdded={() => {}}
      />
      <AddWorkAreaDialog
        open={isAddWorkAreaOpen}
        onOpenChange={setIsAddWorkAreaOpen}
        onWorkAreaAdded={() => {}}
      />
      <AddRoleDialog
        open={isAddRoleOpen}
        onOpenChange={setIsAddRoleOpen}
        onRoleAdded={() => {}}
      />
    </div>
  );
};

export default Index;