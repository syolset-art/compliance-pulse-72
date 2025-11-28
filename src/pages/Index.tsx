import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { CheckCircle2, TrendingUp, Plus, Server, Building, Users, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigationMode } from "@/hooks/useNavigationMode";
import { Button } from "@/components/ui/button";
import mynderLogo from "@/assets/mynder-logo-inverted.png";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { mode, toggleMode } = useNavigationMode();
  const { t } = useTranslation();
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [isAddSystemOpen, setIsAddSystemOpen] = useState(false);
  const [isAddWorkAreaOpen, setIsAddWorkAreaOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [onboardingProgress, setOnboardingProgress] = useState({
    company_info_completed: true,
    systems_added: false,
    work_areas_defined: false,
    roles_assigned: false
  });
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

  useEffect(() => {
    fetchOnboardingProgress();
  }, []);

  const fetchOnboardingProgress = async () => {
    const { data, error } = await supabase
      .from("onboarding_progress")
      .select("*")
      .single();

    if (!error && data) {
      setOnboardingProgress({
        company_info_completed: data.company_info_completed,
        systems_added: data.systems_added,
        work_areas_defined: data.work_areas_defined,
        roles_assigned: data.roles_assigned
      });
    }
  };

  const handleModuleCreated = (moduleData: any) => {
    // Display the created module in the ContentViewer
    const explanation = `# Modul opprettet: ${moduleData.name}

**Type:** ${moduleData.type?.replace("-", " ")}
**Beskrivelse:** ${moduleData.description || "Ingen beskrivelse oppgitt"}
${moduleData.file ? `**Fil:** ${moduleData.file.name}` : ""}
${moduleData.config ? `\n## Konfigurasjon\n\`\`\`\n${moduleData.config}\n\`\`\`` : ""}

Modulen er nå tilgjengelig og kan brukes i AI-agenten. Du kan begynne å samhandle med den via chatten.`;

    handleShowContent("module", undefined, undefined, explanation);
  };

  const handleSystemAdded = () => {
    fetchOnboardingProgress();
  };

  const handleWorkAreaAdded = () => {
    fetchOnboardingProgress();
  };

  const handleRoleAdded = () => {
    fetchOnboardingProgress();
  };

  const calculateProgress = () => {
    const steps = [
      onboardingProgress.company_info_completed,
      onboardingProgress.systems_added,
      onboardingProgress.work_areas_defined,
      onboardingProgress.roles_assigned
    ];
    const completed = steps.filter(Boolean).length;
    return Math.round((completed / steps.length) * 100);
  };

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

          {/* Onboarding Progress Card */}
          <Card className="mb-6 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-primary/20 shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {t("dashboard.onboarding.title")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("dashboard.onboarding.subtitle")}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    {calculateProgress()}%
                  </div>
                  <p className="text-sm text-muted-foreground">{t("dashboard.onboarding.completed")}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-success-foreground shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">{t("dashboard.onboarding.step1")}</h4>
                    <p className="text-sm text-muted-foreground">{t("dashboard.onboarding.step1Desc")}</p>
                  </div>
                </div>
                
                <div 
                  onClick={() => setIsAddSystemOpen(true)}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all cursor-pointer group ${
                    onboardingProgress.systems_added 
                      ? 'bg-success/10 border border-success/20' 
                      : 'bg-background border-2 border-primary hover:shadow-xl hover:scale-[1.02]'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 transition-colors ${
                    onboardingProgress.systems_added
                      ? 'bg-success text-success-foreground'
                      : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                  }`}>
                    {onboardingProgress.systems_added ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Server className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">
                      {t("dashboard.onboarding.step2")} {onboardingProgress.systems_added ? '✓' : '💻'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {onboardingProgress.systems_added 
                        ? t("dashboard.onboarding.step2DescCompleted")
                        : t("dashboard.onboarding.step2Desc")}
                    </p>
                  </div>
                  {!onboardingProgress.systems_added && (
                    <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform shrink-0" />
                  )}
                </div>
                
                <div 
                  onClick={() => setIsAddWorkAreaOpen(true)}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all cursor-pointer group ${
                    onboardingProgress.work_areas_defined
                      ? 'bg-success/10 border border-success/20'
                      : 'bg-muted/30 border border-border hover:bg-muted/50'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                    onboardingProgress.work_areas_defined
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {onboardingProgress.work_areas_defined ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Building className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">
                      {t("dashboard.onboarding.step3")} {onboardingProgress.work_areas_defined ? '✓' : '🏢'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {onboardingProgress.work_areas_defined
                        ? t("dashboard.onboarding.step3DescCompleted")
                        : t("dashboard.onboarding.step3Desc")}
                    </p>
                  </div>
                </div>
                
                <div 
                  onClick={() => setIsAddRoleOpen(true)}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all cursor-pointer group ${
                    onboardingProgress.roles_assigned
                      ? 'bg-success/10 border border-success/20'
                      : 'bg-muted/30 border border-border hover:bg-muted/50'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                    onboardingProgress.roles_assigned
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {onboardingProgress.roles_assigned ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Users className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">
                      {t("dashboard.onboarding.step4")} {onboardingProgress.roles_assigned ? '✓' : '👥'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {onboardingProgress.roles_assigned
                        ? t("dashboard.onboarding.step4DescCompleted")
                        : t("dashboard.onboarding.step4Desc")}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-foreground">
                  {t("dashboard.onboarding.tip")}
                </p>
              </div>
            </div>
          </Card>

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
              value="Høy"
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
      <LaraAgent />

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
        onSystemAdded={handleSystemAdded}
      />
      <AddWorkAreaDialog
        open={isAddWorkAreaOpen}
        onOpenChange={setIsAddWorkAreaOpen}
        onWorkAreaAdded={handleWorkAreaAdded}
      />
      <AddRoleDialog
        open={isAddRoleOpen}
        onOpenChange={setIsAddRoleOpen}
        onRoleAdded={handleRoleAdded}
      />
    </div>
  );
};

export default Index;
