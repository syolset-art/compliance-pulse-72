import { useState, useEffect } from "react";
import { usePageHelpListener } from "@/hooks/usePageHelpListener";
import { ContextualHelpPanel } from "@/components/shared/ContextualHelpPanel";
import { LayoutDashboard, ShieldCheck, BarChart3, Bell, Settings2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { ContentViewer } from "@/components/ContentViewer";

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
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrganization } from "@/contexts/ActiveOrganizationContext";

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

const Index = () => {
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const { user } = useAuth();
  const { activeOrg } = useActiveOrganization();

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
  const [contentView] = useState<{
    type: string; filter?: string;
    options?: { viewMode?: "cards" | "table" | "list" | "names-only"; sortBy?: string; filterCriteria?: any; };
    explanation?: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: templates } = await supabase
        .from("asset_type_templates")
        .select("asset_type, display_name, display_name_plural, icon, color");
      if (templates) setAssetTypeTemplates(templates);
    };
    fetchData();
  }, []);

  const dashboardContent = (
    <div className="space-y-5">
      {/* Personal greeting */}
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

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-mynder">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pt-11 bg-background/95 backdrop-blur-sm">
          {contentView ? (
            <ContentViewer contentType={contentView.type} filter={contentView.filter}
              viewMode={contentView.options?.viewMode} sortBy={contentView.options?.sortBy}
              filterCriteria={contentView.options?.filterCriteria} explanation={contentView.explanation} />
          ) : (
            <div className="container max-w-5xl mx-auto p-4 pt-8">{dashboardContent}</div>
          )}
        </main>
        <DashboardDialogs {...{ isAddAssetOpen, setIsAddAssetOpen, isAddWorkAreaOpen, setIsAddWorkAreaOpen,
          isAddRoleOpen, setIsAddRoleOpen, isQualityWizardOpen, setIsQualityWizardOpen, assetTypeTemplates }} />
        <DashboardHelpPanel open={helpOpen} onOpenChange={setHelpOpen} isNb={isNb} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen max-h-screen bg-gradient-mynder overflow-hidden">
      <div className="w-64 flex-shrink-0"><Sidebar /></div>
      <main className="flex-1 h-screen overflow-y-auto pt-11 bg-background/95 backdrop-blur-sm">
        {contentView ? (
          <ContentViewer contentType={contentView.type} filter={contentView.filter}
            viewMode={contentView.options?.viewMode} sortBy={contentView.options?.sortBy}
            filterCriteria={contentView.options?.filterCriteria} explanation={contentView.explanation} />
        ) : (
          <div className="w-full max-w-5xl mx-auto p-4 md:p-10 pt-8 md:pt-10">{dashboardContent}</div>
        )}
      </main>
      <DashboardDialogs {...{ isAddAssetOpen, setIsAddAssetOpen, isAddWorkAreaOpen, setIsAddWorkAreaOpen,
        isAddRoleOpen, setIsAddRoleOpen, isQualityWizardOpen, setIsQualityWizardOpen, assetTypeTemplates }} />
      <DashboardHelpPanel open={helpOpen} onOpenChange={setHelpOpen} isNb={isNb} />
    </div>
  );
};

function DashboardDialogs({
  isAddAssetOpen, setIsAddAssetOpen, isAddWorkAreaOpen, setIsAddWorkAreaOpen,
  isAddRoleOpen, setIsAddRoleOpen, isQualityWizardOpen, setIsQualityWizardOpen, assetTypeTemplates,
}: {
  isAddAssetOpen: boolean; setIsAddAssetOpen: (v: boolean) => void;
  isAddWorkAreaOpen: boolean; setIsAddWorkAreaOpen: (v: boolean) => void;
  isAddRoleOpen: boolean; setIsAddRoleOpen: (v: boolean) => void;
  isQualityWizardOpen: boolean; setIsQualityWizardOpen: (v: boolean) => void;
  assetTypeTemplates: Array<{ asset_type: string; display_name: string; display_name_plural: string; icon: string; color: string }>;
}) {
  return (
    <>
      <AddAssetDialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen} onAssetAdded={() => {}} assetTypeTemplates={assetTypeTemplates} />
      <AddWorkAreaDialog open={isAddWorkAreaOpen} onOpenChange={setIsAddWorkAreaOpen} onWorkAreaAdded={() => {}} />
      <AddRoleDialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen} onRoleAdded={() => {}} />
      <QualityModuleActivationWizard open={isQualityWizardOpen} onOpenChange={setIsQualityWizardOpen} />
    </>
  );
}

function DashboardHelpPanel({ open, onOpenChange, isNb }: { open: boolean; onOpenChange: (v: boolean) => void; isNb: boolean }) {
  return (
    <ContextualHelpPanel
      open={open}
      onOpenChange={onOpenChange}
      icon={LayoutDashboard}
      title={isNb ? "Dashbordet" : "Dashboard"}
      description={isNb
        ? "Dashbordet gir deg en samlet oversikt over organisasjonens modenhet, regelverk og aktivitet som påvirker score."
        : "The dashboard gives you a unified overview of organizational maturity, frameworks and activities affecting your score."}
      items={[
        { icon: ShieldCheck, title: isNb ? "Samlet modenhet" : "Overall maturity", description: isNb ? "Se total score og fordeling per fokusområde." : "See overall score and breakdown per focus area." },
        { icon: BarChart3, title: isNb ? "Rammeverks-status" : "Framework status", description: isNb ? "Modenhetsscore per regelverk basert på dokumenterte kontroller." : "Maturity score per framework based on documented controls." },
        { icon: Bell, title: isNb ? "Lara-anbefalinger" : "Lara recommendations", description: isNb ? "Kontekstuelle forslag til neste handling fra AI-assistenten." : "Contextual suggestions for next action from the AI assistant." },
      ]}
      whyTitle={isNb ? "Hvorfor er dette viktig?" : "Why does this matter?"}
      whyDescription={isNb
        ? "Et godt dashbord gir ledere innsikt uten å måtte grave i detaljer. Du ser umiddelbart hva som trenger oppmerksomhet."
        : "A good dashboard gives leaders insight without having to dig into details. You immediately see what needs attention."}
      steps={[
        { text: isNb ? "Følg opp Lara-anbefalingen øverst." : "Act on Lara's recommendation at the top." },
        { text: isNb ? "Sjekk modenhetsscore og identifiser svake områder." : "Check maturity scores and identify weak areas." },
        { text: isNb ? "Se hvilke aktiviteter som påvirket score." : "Review activities that affected the score." },
      ]}
      stepsHeading={isNb ? "Kom i gang" : "Get started"}
      actions={[
        { icon: Settings2, title: isNb ? "Tilpass dashbordet" : "Customize dashboard", description: isNb ? "Justér hvilke seksjoner som vises." : "Adjust which sections are shown.", onClick: () => onOpenChange(false) },
      ]}
      laraSuggestions={[
        { label: isNb ? "Hva bør jeg prioritere nå?" : "What should I prioritize now?", message: isNb ? "Hva bør jeg prioritere akkurat nå basert på dashbordet mitt?" : "What should I prioritize right now based on my dashboard?" },
        { label: isNb ? "Forklar modenhetsscore" : "Explain maturity scores", message: isNb ? "Forklar hva modenhetsscore betyr og hvordan jeg kan forbedre den" : "Explain what maturity scores mean and how I can improve them" },
      ]}
    />
  );
}

export default Index;
