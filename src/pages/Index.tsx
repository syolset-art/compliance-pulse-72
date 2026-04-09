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
import { DashboardWidgetToggle } from "@/components/dashboard/DashboardWidgetToggle";
import { DashboardGrid, DashboardTile, TileSize } from "@/components/dashboard/DashboardGrid";

import { AddAssetDialog } from "@/components/dialogs/AddAssetDialog";
import { AddWorkAreaDialog } from "@/components/dialogs/AddWorkAreaDialog";
import { AddRoleDialog } from "@/components/dialogs/AddRoleDialog";
import { QualityModuleActivationWizard } from "@/components/quality/QualityModuleActivationWizard";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHeroCards } from "@/components/dashboard/DashboardHeroCards";

// Widget definitions with size and component mapping
const WIDGET_DEFS: { id: string; label: string; labelEn: string; size: TileSize }[] = [
  { id: "security-foundations", label: "Security Foundations", labelEn: "Security Foundations", size: "full" },
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

const Index = () => {
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(() => loadFromStorage(HIDDEN_KEY, []));
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => loadFromStorage(ORDER_KEY, DEFAULT_ORDER));
  const [editMode, setEditMode] = useState(false);

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
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          {isNb ? `Hei${companyName ? `, ${companyName}` : ""}` : `Hi${companyName ? `, ${companyName}` : ""}`}
        </h1>
        <div className="flex items-center gap-1.5">
          <Button
            variant={editMode ? "default" : "ghost"}
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? (
              <><Check className="h-3.5 w-3.5" />{isNb ? "Ferdig" : "Done"}</>
            ) : (
              <><LayoutGrid className="h-3.5 w-3.5" />{isNb ? "Tilpass" : "Customize"}</>
            )}
          </Button>
          <DashboardWidgetToggle widgets={widgetToggles} onToggle={toggleWidget} onReset={resetWidgets} />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        {isNb
          ? editMode
            ? "Dra flisene for å endre rekkefølge, eller fjern de du ikke trenger."
            : "Her er det som trenger din oppmerksomhet."
          : editMode
            ? "Drag tiles to reorder, or remove the ones you don't need."
            : "Here's what needs your attention."}
      </p>

      {/* Graphical hero cards – max 2 wide */}
      {!editMode && <DashboardHeroCards />}

      {/* Widget grid */}
      <DashboardGrid
        tiles={tiles}
        order={normalizedOrder}
        hiddenIds={hiddenWidgets}
        onReorder={handleReorder}
        onHide={hideWidget}
        editMode={editMode}
      />
    </>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-mynder">
        <Sidebar />
        <main className="flex-1 overflow-y-auto md:pt-11 bg-background/95 backdrop-blur-sm">
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
      <main className="flex-1 h-screen overflow-y-auto md:pt-11 bg-background/95 backdrop-blur-sm">
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
