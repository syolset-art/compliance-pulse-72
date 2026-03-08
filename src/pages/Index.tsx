import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ContentViewer } from "@/components/ContentViewer";
import { AIActivityWidget } from "@/components/widgets/AIActivityWidget";
import { ImmediateAttentionWidget } from "@/components/widgets/ImmediateAttentionWidget";
import { UserActionsWidget } from "@/components/widgets/UserActionsWidget";
import { AIGeneratedDocsWidget } from "@/components/widgets/AIGeneratedDocsWidget";
import { VendorRequestsWidget } from "@/components/widgets/VendorRequestsWidget";
import { EnvironmentOverviewWidget } from "@/components/widgets/EnvironmentOverviewWidget";
import { NIS2ReadinessWidget } from "@/components/widgets/NIS2ReadinessWidget";
import { ComplianceStatusHero } from "@/components/widgets/ComplianceStatusHero";

import { AddAssetDialog } from "@/components/dialogs/AddAssetDialog";
import { AddWorkAreaDialog } from "@/components/dialogs/AddWorkAreaDialog";
import { AddRoleDialog } from "@/components/dialogs/AddRoleDialog";
import { QualityModuleActivationWizard } from "@/components/quality/QualityModuleActivationWizard";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";
import { Shield } from "lucide-react";

const Index = () => {
  const isMobile = useIsMobile();

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

  

  const dashboardContent = (
    <>
      {/* 1. Trust & Compliance Overview — hero with score + maturity */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Trust & Compliance Overview
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl mb-4">
          A real-time overview of your organization's security, privacy and compliance.
        </p>
        <ComplianceStatusHero companyName={companyName} />
      </div>

      {/* 2. AI Activity */}
      <div className="mb-6">
        <AIActivityWidget />
      </div>

      {/* 3. Immediate attention + 4. Your actions — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ImmediateAttentionWidget />
        <UserActionsWidget />
      </div>

      {/* 5. AI-generated docs + 6. Vendor requests — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <AIGeneratedDocsWidget />
        <VendorRequestsWidget />
      </div>

      {/* 7. Your environment */}
      <div className="mb-6">
        <EnvironmentOverviewWidget />
      </div>

      {/* 8. NIS2 readiness */}
      <div className="mb-6">
        <NIS2ReadinessWidget />
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
