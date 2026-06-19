import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { usePageHelpListener } from "@/hooks/usePageHelpListener";
import { ContextualHelpPanel } from "@/components/shared/ContextualHelpPanel";
import { LayoutDashboard, ShieldCheck, BarChart3, Bell, Settings2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";

import { AddAssetDialog } from "@/components/dialogs/AddAssetDialog";
import { AddWorkAreaDialog } from "@/components/dialogs/AddWorkAreaDialog";
import { AddRoleDialog } from "@/components/dialogs/AddRoleDialog";
import { QualityModuleActivationWizard } from "@/components/quality/QualityModuleActivationWizard";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { DashboardLaraRecommendation } from "@/components/dashboard/DashboardLaraRecommendation";
import { DashboardOverallMaturity } from "@/components/dashboard/DashboardOverallMaturity";
import { DashboardFrameworkStatus } from "@/components/dashboard/DashboardFrameworkStatus";
import { DashboardMaturityOverTime } from "@/components/dashboard/DashboardMaturityOverTime";
import { useSubscription } from "@/hooks/useSubscription";

function getGreeting(isNb: boolean) {
  const h = new Date().getHours();
  if (isNb) {
    if (h < 10) return "God morgen";
    if (h < 17) return "God dag";
    return "God kveld";
  }
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(isNb: boolean) {
  const d = new Date();
  return d.toLocaleDateString(isNb ? "nb-NO" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const CoreDashboard = () => {
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const { mode } = useWorkspaceMode();
  const { hasCoreAccess, hasRegistriesAccess, isLoading } = useSubscription();

  const displayName = "Synnøve Olset";

  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isAddWorkAreaOpen, setIsAddWorkAreaOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isQualityWizardOpen, setIsQualityWizardOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  usePageHelpListener(setHelpOpen);
  const [assetTypeTemplates, setAssetTypeTemplates] = useState<Array<{
    asset_type: string; display_name: string; display_name_plural: string; icon: string; color: string;
  }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: templates } = await supabase
        .from("asset_type_templates")
        .select("asset_type, display_name, display_name_plural, icon, color");
      if (templates) setAssetTypeTemplates(templates);
    };
    fetchData();
  }, []);

  if (mode === "partner") return <Navigate to="/msp-partner" replace />;

  // Hvis bruker ikke har Core/Registre aktivert, send dem til Trust-dashbord.
  if (!isLoading && !hasCoreAccess && !hasRegistriesAccess) {
    return <Navigate to="/" replace />;
  }

  const dashboardContent = (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {getGreeting(isNb)}, {displayName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{formatDate(isNb)}</p>
      </div>

      <DashboardLaraRecommendation />
      <DashboardOverallMaturity />
      <DashboardMaturityOverTime />
      <DashboardFrameworkStatus />
    </div>
  );

  const Shell = (
    <>
      <AddAssetDialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen} onAssetAdded={() => {}} assetTypeTemplates={assetTypeTemplates} />
      <AddWorkAreaDialog open={isAddWorkAreaOpen} onOpenChange={setIsAddWorkAreaOpen} onWorkAreaAdded={() => {}} />
      <AddRoleDialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen} onRoleAdded={() => {}} />
      <QualityModuleActivationWizard open={isQualityWizardOpen} onOpenChange={setIsQualityWizardOpen} />
      <ContextualHelpPanel
        open={helpOpen}
        onOpenChange={setHelpOpen}
        icon={LayoutDashboard}
        title={isNb ? "Mynder Core-dashbord" : "Mynder Core dashboard"}
        description={isNb
          ? "Operativt dashbord for arbeidsområder, systemer, avvik og registre."
          : "Operational dashboard for work areas, systems, deviations and registries."}
        items={[
          { icon: ShieldCheck, title: isNb ? "Samlet modenhet" : "Overall maturity", description: isNb ? "Se total score og fordeling per fokusområde." : "See overall score and breakdown per focus area." },
          { icon: BarChart3, title: isNb ? "Rammeverks-status" : "Framework status", description: isNb ? "Modenhetsscore per regelverk." : "Maturity score per framework." },
          { icon: Bell, title: isNb ? "Lara-anbefalinger" : "Lara recommendations", description: isNb ? "AI-forslag til neste handling." : "AI suggestions for next action." },
        ]}
        actions={[
          { icon: Settings2, title: isNb ? "Tilpass dashbordet" : "Customize dashboard", description: isNb ? "Justér seksjoner." : "Adjust sections.", onClick: () => setHelpOpen(false) },
        ]}
      />
    </>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-mynder">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pt-11 bg-background/95 backdrop-blur-sm">
          <div className="container max-w-5xl mx-auto p-4 pt-8">{dashboardContent}</div>
        </main>
        {Shell}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen max-h-screen bg-gradient-mynder overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto pt-11 bg-background/95 backdrop-blur-sm">
        <div className="w-full max-w-5xl mx-auto p-4 md:p-10 pt-8 md:pt-10">{dashboardContent}</div>
      </main>
      {Shell}
    </div>
  );
};

export default CoreDashboard;
