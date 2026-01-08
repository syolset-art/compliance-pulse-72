import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { ContentViewer } from "@/components/ContentViewer";
import { AlertBanner } from "@/components/widgets/AlertBanner";
import { MetricCard } from "@/components/widgets/MetricCard";
import { ROPAStatusWidget } from "@/components/widgets/ROPAStatusWidget";
import { ComplianceCard } from "@/components/widgets/ComplianceCard";
import { ROPAGapWidget } from "@/components/widgets/ROPAGapWidget";
import { ThirdPartyWidget } from "@/components/widgets/ThirdPartyWidget";
import { CriticalProcessesWidget } from "@/components/widgets/CriticalProcessesWidget";
import { DataTransferWidget } from "@/components/widgets/DataTransferWidget";
import { SystemsInUseWidget } from "@/components/widgets/SystemsInUseWidget";
import { ROIWidget } from "@/components/widgets/ROIWidget";
import { LaraAgent } from "@/components/LaraAgent";
import { AddModuleDialog } from "@/components/AddModuleDialog";
import { AddSystemDialog } from "@/components/dialogs/AddSystemDialog";
import { AddWorkAreaDialog } from "@/components/dialogs/AddWorkAreaDialog";
import { AddRoleDialog } from "@/components/dialogs/AddRoleDialog";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { CheckCircle2, TrendingUp, Plus } from "lucide-react";
import { useNavigationMode } from "@/hooks/useNavigationMode";
import { Button } from "@/components/ui/button";
import mynderLogo from "@/assets/mynder-logo-inverted.png";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { mode, toggleMode } = useNavigationMode();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [isAddSystemOpen, setIsAddSystemOpen] = useState(false);
  const [isAddWorkAreaOpen, setIsAddWorkAreaOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
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

  const handleShowContent = (contentType: string, filter?: string, options?: any, explanation?: string) => {
    setContentView({ type: contentType, filter, options, explanation });
  };

  const handleBackToDashboard = () => {
    setContentView(null);
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
        <Sidebar onToggleChat={toggleMode} />
        
        <main className="flex-1 overflow-y-auto bg-background/95 backdrop-blur-sm">
          {contentView && mode === "chat" ? (
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
                    <img src={mynderLogo} alt="Mynder" className="h-8" />
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">{t("dashboard.title")}</span>
                  </div>
                  <Button onClick={() => setIsAddModuleOpen(true)} className="gap-2 bg-primary hover:bg-primary/90" size="sm">
                    <Plus className="h-4 w-4" />
                    {t("dashboard.addModule")}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
              </div>

              {/* Alert Banner */}
              <div className="mb-6">
                <AlertBanner />
              </div>

              {/* ROI Widget */}
              <div className="mb-6">
                <ROIWidget />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <ROPAStatusWidget />
                <SystemsInUseWidget />
              </div>

              {/* Compliance */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">{t("dashboard.compliance.title")}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <ComplianceCard standard="gdpr" title={t("dashboard.compliance.gdpr")} percentage={77} subtitle={t("dashboard.compliance.gdprDesc")} />
                  <ComplianceCard standard="iso" title={t("dashboard.compliance.iso")} percentage={77} subtitle={t("dashboard.compliance.isoDesc")} />
                  <ComplianceCard standard="nis2" title={t("dashboard.compliance.nis2")} percentage={82} subtitle={t("dashboard.compliance.nis2Desc")} />
                  <ComplianceCard standard="cra" title={t("dashboard.compliance.cra")} percentage={82} subtitle={t("dashboard.compliance.craDesc")} />
                </div>
              </div>

              {/* Widgets */}
              <div className="space-y-6">
                <ROPAGapWidget />
                <CriticalProcessesWidget />
                <DataTransferWidget />
                <ThirdPartyWidget />
              </div>
            </div>
          )}
        </main>

        <LaraAgent 
          onOpenSystemDialog={() => setIsAddSystemOpen(true)}
          onOpenRoleDialog={() => setIsAddRoleOpen(true)}
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
          maxSize={40}
          className="min-w-[240px]"
        >
          {mode === "menu" ? (
            <Sidebar onToggleChat={toggleMode} />
          ) : (
            <ChatInterface 
              onToggleMode={toggleMode} 
              onShowContent={handleShowContent}
              onBackToDashboard={handleBackToDashboard}
            />
          )}
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={80}>
          <main className="h-screen overflow-y-auto bg-background/95 backdrop-blur-sm">
            {contentView && mode === "chat" ? (
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
                      <img src={mynderLogo} alt="Mynder" className="h-8 md:h-10" />
                      <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">{t("dashboard.title")}</span>
                    </div>
                    <Button onClick={() => setIsAddModuleOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4" />
                      {t("dashboard.addModule")}
                    </Button>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground">{t("dashboard.subtitle")}</p>
                </div>

                {/* Alert Banner */}
                <div className="mb-6">
                  <AlertBanner />
                </div>

                {/* ROI Widget */}
                <div className="mb-6">
                  <ROIWidget />
                </div>

                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <ROPAStatusWidget />
                  <MetricCard
                    title={t("dashboard.metrics.completedTasks")}
                    value="245"
                    subtitle={t("dashboard.metrics.completedTasksDesc")}
                    icon={CheckCircle2}
                  />
                  <SystemsInUseWidget />
                  <MetricCard
                    title={t("dashboard.metrics.totalRisk")}
                    value={t("dashboard.metrics.high")}
                    subtitle={t("dashboard.metrics.totalRiskDesc")}
                    icon={TrendingUp}
                  />
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

                {/* Information Banner */}
                <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                      <span className="text-xs font-semibold text-primary">i</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {t("dashboard.info.title")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("dashboard.info.description")}
                      </p>
                    </div>
                    <button className="text-sm font-medium text-primary hover:underline whitespace-nowrap">
                      {t("dashboard.info.details")}
                    </button>
                  </div>
                </div>

                {/* Bottom Grid - ROPA & Risk Widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <ROPAGapWidget />
                    <CriticalProcessesWidget />
                    <DataTransferWidget />
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <ThirdPartyWidget />
                    
                    {/* Placeholder for future widgets */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 rounded-lg border border-dashed border-border bg-muted/20">
                        <p className="text-sm text-muted-foreground text-center">
                          {t("widgets.placeholders.systemRiskOverview")}
                        </p>
                      </div>
                      <div className="p-6 rounded-lg border border-dashed border-border bg-muted/20">
                        <p className="text-sm text-muted-foreground text-center">
                          {t("widgets.placeholders.aiAnalysis")}
                        </p>
                      </div>
                    </div>
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
        onOpenRoleDialog={() => setIsAddRoleOpen(true)}
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
