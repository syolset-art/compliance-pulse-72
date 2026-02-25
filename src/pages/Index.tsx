import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ContentViewer } from "@/components/ContentViewer";
import { StatusOverviewWidget } from "@/components/widgets/StatusOverviewWidget";
import { SLAWidget } from "@/components/widgets/SLAWidget";
import { DomainComplianceWidget } from "@/components/widgets/DomainComplianceWidget";
import { ExecutiveSummaryWidget } from "@/components/widgets/ExecutiveSummaryWidget";
import { GDPRHealthWidget } from "@/components/widgets/GDPRHealthWidget";
import { SecurityPostureWidget } from "@/components/widgets/SecurityPostureWidget";
import { AIGovernanceWidget } from "@/components/widgets/AIGovernanceWidget";
import { OnboardingProgressWidget } from "@/components/widgets/OnboardingProgressWidget";
import { ActionPriorityWidget } from "@/components/widgets/ActionPriorityWidget";
import { ComplianceSummaryCards } from "@/components/widgets/ComplianceSummaryCards";


import { RecentActivityWidget } from "@/components/widgets/RecentActivityWidget";
import { SupplyChainChangesWidget } from "@/components/widgets/SupplyChainChangesWidget";
import { MonthlyTasksWidget } from "@/components/widgets/MonthlyTasksWidget";
import { TrustProfileViewsWidget } from "@/components/widgets/TrustProfileViewsWidget";

import { AddAssetDialog } from "@/components/dialogs/AddAssetDialog";
import { AddWorkAreaDialog } from "@/components/dialogs/AddWorkAreaDialog";
import { AddRoleDialog } from "@/components/dialogs/AddRoleDialog";
import { QualityModuleActivationWizard } from "@/components/quality/QualityModuleActivationWizard";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole, AppRole } from "@/hooks/useUserRole";

const Index = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { primaryRole } = useUserRole();
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
      const { data: companyData } = await supabase
        .from("company_profile")
        .select("name")
        .limit(1)
        .maybeSingle();
      
      if (companyData?.name) {
        setCompanyName(companyData.name);
      }

      const { data: templates } = await supabase
        .from("asset_type_templates")
        .select("asset_type, display_name, display_name_plural, icon, color");
      
      if (templates) {
        setAssetTypeTemplates(templates);
      }
    };
    fetchData();
  }, []);

  const handleBackToDashboard = () => {
    setContentView(null);
  };

  const dashboardContent = (
    <>
      {/* Premium Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground tracking-wide uppercase mb-2">
              {t("dashboard.welcomeBack")}
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              {companyName || t("dashboard.title")}
            </h1>
          </div>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
          {activeView !== 'all' ? t(`dashboardViews.${activeView}.description`) : t("dashboard.subtitle")}
        </p>
      </div>

      {/* ── SONE 1: Status ── */}
      <OnboardingProgressWidget />

      {/* Role-specific primary widget */}
      {activeView === 'daglig_leder' && <ExecutiveSummaryWidget />}
      {activeView === 'personvernombud' && <GDPRHealthWidget />}
      {activeView === 'sikkerhetsansvarlig' && <SecurityPostureWidget />}
      {activeView === 'ai_governance' && <AIGovernanceWidget />}
      {(activeView === 'compliance_ansvarlig' || activeView === 'all') && <DomainComplianceWidget />}

      <div className="mt-8 mb-8">
        <StatusOverviewWidget />
      </div>

      {/* ── SONE 2: Hva må jeg gjøre nå? ── */}
      <div className="mb-8">
        <ActionPriorityWidget />
      </div>

      {/* SLA Widget */}
      <div className="mb-8">
        <SLAWidget />
      </div>

      {/* ── Mini-widgets 2x2 grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <RecentActivityWidget />
        <SupplyChainChangesWidget />
        <MonthlyTasksWidget />
        <TrustProfileViewsWidget />
      </div>

      {/* ── SONE 3: Overblikk & årskalender ── */}
      <div className="mb-8">
        <ComplianceSummaryCards />
      </div>

    </>
  );

  // Mobile layout
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
              {dashboardContent}
            </div>
          )}
        </main>
        <DashboardDialogs
          isAddAssetOpen={isAddAssetOpen}
          setIsAddAssetOpen={setIsAddAssetOpen}
          isAddWorkAreaOpen={isAddWorkAreaOpen}
          setIsAddWorkAreaOpen={setIsAddWorkAreaOpen}
          isAddRoleOpen={isAddRoleOpen}
          setIsAddRoleOpen={setIsAddRoleOpen}
          isQualityWizardOpen={isQualityWizardOpen}
          setIsQualityWizardOpen={setIsQualityWizardOpen}
          assetTypeTemplates={assetTypeTemplates}
        />
      </div>
    );
  }

  // Desktop layout
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
            {dashboardContent}
          </div>
        )}
      </main>
      <DashboardDialogs
        isAddAssetOpen={isAddAssetOpen}
        setIsAddAssetOpen={setIsAddAssetOpen}
        isAddWorkAreaOpen={isAddWorkAreaOpen}
        setIsAddWorkAreaOpen={setIsAddWorkAreaOpen}
        isAddRoleOpen={isAddRoleOpen}
        setIsAddRoleOpen={setIsAddRoleOpen}
        isQualityWizardOpen={isQualityWizardOpen}
        setIsQualityWizardOpen={setIsQualityWizardOpen}
        assetTypeTemplates={assetTypeTemplates}
      />
    </div>
  );
};

// Extracted dialog components to reduce duplication
function DashboardDialogs({
  isAddAssetOpen, setIsAddAssetOpen,
  isAddWorkAreaOpen, setIsAddWorkAreaOpen,
  isAddRoleOpen, setIsAddRoleOpen,
  isQualityWizardOpen, setIsQualityWizardOpen,
  assetTypeTemplates,
}: {
  isAddAssetOpen: boolean; setIsAddAssetOpen: (v: boolean) => void;
  isAddWorkAreaOpen: boolean; setIsAddWorkAreaOpen: (v: boolean) => void;
  isAddRoleOpen: boolean; setIsAddRoleOpen: (v: boolean) => void;
  isQualityWizardOpen: boolean; setIsQualityWizardOpen: (v: boolean) => void;
  assetTypeTemplates: Array<{ asset_type: string; display_name: string; display_name_plural: string; icon: string; color: string }>;
}) {
  return (
    <>
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
    </>
  );
}

export default Index;
