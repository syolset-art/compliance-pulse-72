import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
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
import { DomainComplianceWidget } from "@/components/widgets/DomainComplianceWidget";
import { MyRegulationsWidget } from "@/components/widgets/MyRegulationsWidget";
import { ExecutiveSummaryWidget } from "@/components/widgets/ExecutiveSummaryWidget";
import { GDPRHealthWidget } from "@/components/widgets/GDPRHealthWidget";
import { SecurityPostureWidget } from "@/components/widgets/SecurityPostureWidget";
import { AIGovernanceWidget } from "@/components/widgets/AIGovernanceWidget";

import { OnboardingProgressWidget } from "@/components/widgets/OnboardingProgressWidget";

import { AddAssetDialog } from "@/components/dialogs/AddAssetDialog";
import { AddWorkAreaDialog } from "@/components/dialogs/AddWorkAreaDialog";
import { AddRoleDialog } from "@/components/dialogs/AddRoleDialog";
import { QualityModuleActivationWizard } from "@/components/quality/QualityModuleActivationWizard";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { DASHBOARD_LAYOUTS } from "@/lib/dashboardLayouts";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";

const Index = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { primaryRole } = useUserRole();
  const { stats } = useComplianceRequirements({});
  const activeView = primaryRole as AppRole | 'all';
  
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isAddWorkAreaOpen, setIsAddWorkAreaOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isQualityWizardOpen, setIsQualityWizardOpen] = useState(false);
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
            <div className="container max-w-7xl mx-auto p-4 pt-8">
              {/* Premium Header with more whitespace */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
                      {t("dashboard.welcomeBack")}
                    </p>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">{companyName || t("dashboard.title")}</h1>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground max-w-xl">{t("dashboard.subtitle")}</p>
              </div>

              {/* Top Row - Critical Tasks & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
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

              {/* Removed duplicate DomainComplianceWidget */}
            </div>
          )}
        </main>


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
        <QualityModuleActivationWizard
          open={isQualityWizardOpen}
          onOpenChange={setIsQualityWizardOpen}
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
              <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-8 md:pt-10">
                {/* Premium Header with more whitespace */}
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase mb-2">
                        {t("dashboard.welcomeBack")}
                      </p>
                      <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{companyName || t("dashboard.title")}</h1>
                    </div>
                  </div>
                  <p className="text-base text-muted-foreground max-w-2xl">
                    {activeView !== 'all' ? t(`dashboardViews.${activeView}.description`) : t("dashboard.subtitle")}
                  </p>
                </div>

                {/* Onboarding Progress Widget */}
                <OnboardingProgressWidget />


                {/* Role-specific primary widget */}
                {activeView === 'daglig_leder' && <ExecutiveSummaryWidget />}
                {activeView === 'personvernombud' && <GDPRHealthWidget />}
                {activeView === 'sikkerhetsansvarlig' && <SecurityPostureWidget />}
                {activeView === 'ai_governance' && <AIGovernanceWidget />}
                {(activeView === 'compliance_ansvarlig' || activeView === 'all') && <DomainComplianceWidget />}

                {/* Top Row - Critical Tasks & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 mt-8">
                  <CriticalTasksWidget />
                  <StatusOverviewWidget />
                </div>

                {/* SLA Widget */}
                <div className="mb-8">
                  <SLAWidget />
                </div>

                {/* Risk & Controls Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <InherentRiskWidget />
                  <ControlsWidget />
                </div>

                {/* Tasks & Systems Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <UpcomingTasksWidget />
                  <SystemLibraryWidget />
                </div>

                {/* Progress & Third Party Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <TaskProgressWidget />
                  <ThirdPartyManagementWidget />
                </div>

                {/* AI Usage & Regulations Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <AIUsageOverviewWidget />
                  <MyRegulationsWidget />
                </div>

                {/* AI Act Compliance */}
                <div className="mb-8">
                  <AIActComplianceWidget />
                </div>

                {/* Activity Report - Only visible for leaders */}
                <div className="mb-8">
                  <ActivityReportWidget />
                </div>

                {/* CertificationJourney removed duplicate DomainComplianceWidget */}
              </div>
            )}
          </main>



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
      <QualityModuleActivationWizard
        open={isQualityWizardOpen}
        onOpenChange={setIsQualityWizardOpen}
      />
    </div>
  );
};

export default Index;