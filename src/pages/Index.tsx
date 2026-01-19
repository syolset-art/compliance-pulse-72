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
import { AIUsageOverviewWidget } from "@/components/widgets/AIUsageOverviewWidget";
import { AIActComplianceWidget } from "@/components/widgets/AIActComplianceWidget";
import { ActivityReportWidget } from "@/components/widgets/ActivityReportWidget";
import { ComplianceCard } from "@/components/widgets/ComplianceCard";
import { MyRegulationsWidget } from "@/components/widgets/MyRegulationsWidget";
import { LaraAgent } from "@/components/LaraAgent";
import { AddModuleDialog } from "@/components/AddModuleDialog";
import { AddAssetDialog } from "@/components/dialogs/AddAssetDialog";
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
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isAddWorkAreaOpen, setIsAddWorkAreaOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [assetTypeTemplates, setAssetTypeTemplates] = useState<Array<{
    asset_type: string;
    display_name: string;
    display_name_plural: string;
    icon: string;
    color: string;
  }>>([]);
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
    const fetchData = async () => {
      // Fetch company name
      const { data: companyData } = await supabase
        .from("company_profile")
        .select("name")
        .limit(1)
        .maybeSingle();
      
      if (companyData?.name) {
        setCompanyName(companyData.name);
      }

      // Fetch asset type templates
      const { data: templates } = await supabase
        .from("asset_type_templates")
        .select("asset_type, display_name, display_name_plural, icon, color");
      
      if (templates) {
        setAssetTypeTemplates(templates);
      }
    };
    fetchData();
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <TaskProgressWidget />
                <ThirdPartyManagementWidget />
              </div>

              {/* AI Usage Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <AIUsageOverviewWidget />
                <MyRegulationsWidget />
              </div>

              {/* AI Act Compliance */}
              <div className="mb-6">
                <AIActComplianceWidget />
              </div>

              {/* Activity Report - Only visible for leaders */}
              <div className="mb-6">
                <ActivityReportWidget />
              </div>

              {/* Compliance Analysis Section */}
              <div className="mb-6 pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-foreground">{t("dashboard.compliance.title")}</h2>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                    <span className="text-xs text-muted-foreground">i</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  {t("dashboard.compliance.subtitle")}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <LaraAgent 
          onOpenAssetDialog={() => setIsAddAssetOpen(true)}
          onToggleChat={handleToggleChat}
          isChatOpen={isChatOpen}
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
        <AddAssetDialog
          open={isAddAssetOpen}
          onOpenChange={setIsAddAssetOpen}
          onAssetAdded={() => {}}
          assetTypeTemplates={assetTypeTemplates}
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

  // Desktop layout with fixed sidebar
  return (
    <div className="flex min-h-screen max-h-screen bg-gradient-mynder overflow-hidden">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      
      <main className="flex-1 h-screen overflow-y-auto bg-background/95 backdrop-blur-sm">
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
              <div className="w-full max-w-7xl p-4 md:p-8 pt-6 md:pt-8">
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

                {/* AI Usage & Regulations Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <AIUsageOverviewWidget />
                  <MyRegulationsWidget />
                </div>

                {/* AI Act Compliance */}
                <div className="mb-6">
                  <AIActComplianceWidget />
                </div>

                {/* Activity Report - Only visible for leaders */}
                <div className="mb-6">
                  <ActivityReportWidget />
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

      {/* Lara AI Agent */}
      <LaraAgent 
        onOpenAssetDialog={() => setIsAddAssetOpen(true)}
        onToggleChat={handleToggleChat}
        isChatOpen={isChatOpen}
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
      <AddAssetDialog
        open={isAddAssetOpen}
        onOpenChange={setIsAddAssetOpen}
        onAssetAdded={() => {}}
        assetTypeTemplates={assetTypeTemplates}
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