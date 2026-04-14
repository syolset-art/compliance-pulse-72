import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ContentViewer } from "@/components/ContentViewer";
import { AIActivityWidget } from "@/components/widgets/AIActivityWidget";
import { SecurityFoundationsWidget } from "@/components/widgets/SecurityFoundationsWidget";
import { AIGeneratedDocsWidget } from "@/components/widgets/AIGeneratedDocsWidget";
import { VendorRequestsWidget } from "@/components/widgets/VendorRequestsWidget";
import { EnvironmentOverviewWidget } from "@/components/widgets/EnvironmentOverviewWidget";
import { NIS2ReadinessWidget } from "@/components/widgets/NIS2ReadinessWidget";
import { DataGeographyWidget } from "@/components/widgets/DataGeographyWidget";
import { CriticalProcessesWidget } from "@/components/widgets/CriticalProcessesWidget";
import { CriticalDependenciesWidget } from "@/components/widgets/CriticalDependenciesWidget";
import { BusinessRiskExposureWidget } from "@/components/widgets/BusinessRiskExposureWidget";
import { VulnerabilityMapWidget } from "@/components/widgets/VulnerabilityMapWidget";

import { DashboardGrid, DashboardTile, TileSize } from "@/components/dashboard/DashboardGrid";

import { AddAssetDialog } from "@/components/dialogs/AddAssetDialog";
import { AddWorkAreaDialog } from "@/components/dialogs/AddWorkAreaDialog";
import { AddRoleDialog } from "@/components/dialogs/AddRoleDialog";
import { QualityModuleActivationWizard } from "@/components/quality/QualityModuleActivationWizard";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { DashboardHeroCards } from "@/components/dashboard/DashboardHeroCards";
import { DashboardCriticalTasks } from "@/components/dashboard/DashboardCriticalTasks";
import { DashboardCompact } from "@/components/dashboard/DashboardCompact";
import { useUserRole } from "@/hooks/useUserRole";
import { ROLE_WIDGET_DEFAULTS } from "@/lib/roleContentConfig";
import { ROLE_LABELS } from "@/hooks/useUserRole";

// Widget definitions with size and component mapping
const WIDGET_DEFS: { id: string; label: string; labelEn: string; size: TileSize }[] = [
  { id: "security-foundations", label: "Modenhet per kontrollområde", labelEn: "Maturity by control areas", size: "full" },
  { id: "business-risk-exposure", label: "Forretningsrisiko (FAIR)", labelEn: "Business Risk (FAIR)", size: "half" },
  { id: "vulnerability-map", label: "Sårbarhetskart", labelEn: "Vulnerability Map", size: "half" },
  { id: "critical-processes", label: "Kritiske prosesser", labelEn: "Critical processes", size: "half" },
  { id: "ai-dependencies", label: "AI Act-avhengigheter", labelEn: "AI Act dependencies", size: "half" },
  { id: "ai-activity", label: "AI-aktivitet", labelEn: "AI activity", size: "full" },
  { id: "ai-docs", label: "AI-genererte dokumenter", labelEn: "AI-generated docs", size: "half" },
  { id: "vendor-requests", label: "Leverandørforespørsler", labelEn: "Vendor requests", size: "half" },
  { id: "environment", label: "Ditt miljø", labelEn: "Your environment", size: "full" },
  { id: "data-geography", label: "Datageografi", labelEn: "Data geography", size: "full" },
  { id: "nis2", label: "NIS2-beredskap", labelEn: "NIS2 readiness", size: "full" },
];

const DEFAULT_ORDER = WIDGET_DEFS.map(w => w.id);
const HIDDEN_KEY = "mynder_dashboard_hidden_widgets";
const ORDER_KEY = "mynder_dashboard_widget_order";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

// Widget component map
const WIDGET_COMPONENTS: Record<string, React.ReactNode> = {
  "security-foundations": <SecurityFoundationsWidget />,
  "business-risk-exposure": <BusinessRiskExposureWidget />,
  "vulnerability-map": <VulnerabilityMapWidget />,
  "critical-processes": <CriticalProcessesWidget />,
  "ai-dependencies": <CriticalDependenciesWidget />,
  "ai-activity": <AIActivityWidget />,
  "ai-docs": <AIGeneratedDocsWidget />,
  "vendor-requests": <VendorRequestsWidget />,
  "environment": <EnvironmentOverviewWidget />,
  "data-geography": <DataGeographyWidget />,
  "nis2": <NIS2ReadinessWidget />,
};

const ROLE_HIDDEN_KEY = "mynder_dashboard_role_initialized";

const Index = () => {
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { primaryRole } = useUserRole();

  // Initialize hidden widgets from role defaults if user hasn't customized
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(() => {
    const customized = localStorage.getItem(HIDDEN_KEY);
    const roleInit = localStorage.getItem(ROLE_HIDDEN_KEY);
    if (customized && roleInit === primaryRole) return JSON.parse(customized);
    // Apply role defaults
    const defaults = ROLE_WIDGET_DEFAULTS[primaryRole]?.hidden || [];
    return defaults;
  });
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => loadFromStorage(ORDER_KEY, DEFAULT_ORDER));

  // Re-apply role defaults when role changes
  useEffect(() => {
    const roleInit = localStorage.getItem(ROLE_HIDDEN_KEY);
    if (roleInit !== primaryRole) {
      const defaults = ROLE_WIDGET_DEFAULTS[primaryRole]?.hidden || [];
      setHiddenWidgets(defaults);
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(defaults));
      localStorage.setItem(ROLE_HIDDEN_KEY, primaryRole);
    }
  }, [primaryRole]);

  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isAddWorkAreaOpen, setIsAddWorkAreaOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isQualityWizardOpen, setIsQualityWizardOpen] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [assetTypeTemplates, setAssetTypeTemplates] = useState<Array<{
    asset_type: string; display_name: string; display_name_plural: string; icon: string; color: string;
  }>>([]);
  const [contentView, setContentView] = useState<{
    type: string; filter?: string;
    options?: { viewMode?: "cards" | "table" | "list" | "names-only"; sortBy?: string; filterCriteria?: any; };
    explanation?: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: companyData } = await supabase
        .from("company_profile").select("name").limit(1).maybeSingle();
      if (companyData?.name) setCompanyName(companyData.name);
      const { data: templates } = await supabase
        .from("asset_type_templates")
        .select("asset_type, display_name, display_name_plural, icon, color");
      if (templates) setAssetTypeTemplates(templates);
    };
    fetchData();
  }, []);

  // Ensure order contains all widget IDs (in case new ones added)
  const normalizedOrder = useMemo(() => {
    const missing = DEFAULT_ORDER.filter(id => !widgetOrder.includes(id));
    return [...widgetOrder, ...missing];
  }, [widgetOrder]);

  const toggleWidget = (id: string, visible: boolean) => {
    const next = visible ? hiddenWidgets.filter(w => w !== id) : [...hiddenWidgets, id];
    setHiddenWidgets(next);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
  };

  const hideWidget = (id: string) => {
    toggleWidget(id, false);
  };

  const resetWidgets = () => {
    setHiddenWidgets([]);
    setWidgetOrder(DEFAULT_ORDER);
    localStorage.removeItem(HIDDEN_KEY);
    localStorage.removeItem(ORDER_KEY);
  };

  const handleReorder = (newOrder: string[]) => {
    setWidgetOrder(newOrder);
    localStorage.setItem(ORDER_KEY, JSON.stringify(newOrder));
  };

  const widgetToggles = WIDGET_DEFS.map(w => ({
    id: w.id,
    label: isNb ? w.label : w.labelEn,
    visible: !hiddenWidgets.includes(w.id),
  }));

  const tiles: DashboardTile[] = WIDGET_DEFS.map(w => ({
    id: w.id,
    label: isNb ? w.label : w.labelEn,
    size: w.size,
    component: WIDGET_COMPONENTS[w.id],
  }));

  const dashboardContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {isNb ? `Hei${companyName ? `, ${companyName}` : ""}` : `Hi${companyName ? `, ${companyName}` : ""}`}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ROLE_LABELS[primaryRole]}
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {isNb ? "Her er det som trenger din oppmerksomhet." : "Here's what needs your attention."}
      </p>

      <DashboardCompact />

      <DashboardCriticalTasks />
      <DashboardHeroCards />
      <DashboardGrid
        tiles={tiles}
        order={normalizedOrder}
        hiddenIds={hiddenWidgets}
        onReorder={handleReorder}
        onHide={hideWidget}
        editMode={false}
      />
    </>
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
            <div className="container max-w-7xl mx-auto p-4 pt-8">{dashboardContent}</div>
          )}
        </main>
        <DashboardDialogs {...{ isAddAssetOpen, setIsAddAssetOpen, isAddWorkAreaOpen, setIsAddWorkAreaOpen,
          isAddRoleOpen, setIsAddRoleOpen, isQualityWizardOpen, setIsQualityWizardOpen, assetTypeTemplates }} />
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
          <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-8 md:pt-10">{dashboardContent}</div>
        )}
      </main>
      <DashboardDialogs {...{ isAddAssetOpen, setIsAddAssetOpen, isAddWorkAreaOpen, setIsAddWorkAreaOpen,
        isAddRoleOpen, setIsAddRoleOpen, isQualityWizardOpen, setIsQualityWizardOpen, assetTypeTemplates }} />
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

export default Index;
