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
import { CriticalProcessesWidget } from "@/components/widgets/CriticalProcessesWidget";
import { CriticalDependenciesWidget } from "@/components/widgets/CriticalDependenciesWidget";
import { DashboardWidgetToggle } from "@/components/dashboard/DashboardWidgetToggle";

import { AddAssetDialog } from "@/components/dialogs/AddAssetDialog";
import { AddWorkAreaDialog } from "@/components/dialogs/AddWorkAreaDialog";
import { AddRoleDialog } from "@/components/dialogs/AddRoleDialog";
import { QualityModuleActivationWizard } from "@/components/quality/QualityModuleActivationWizard";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ListTodo, Cpu } from "lucide-react";

// Widget registry for toggle
const WIDGET_REGISTRY = [
  { id: "immediate-attention", label: "Krever oppmerksomhet", labelEn: "Needs attention" },
  { id: "user-actions", label: "Dine oppgaver", labelEn: "Your actions" },
  { id: "critical-processes", label: "Kritiske prosesser", labelEn: "Critical processes" },
  { id: "ai-dependencies", label: "AI Act-avhengigheter", labelEn: "AI Act dependencies" },
  { id: "ai-activity", label: "AI-aktivitet", labelEn: "AI activity" },
  { id: "vendor-requests", label: "Leverandørforespørsler", labelEn: "Vendor requests" },
  { id: "ai-docs", label: "AI-genererte dokumenter", labelEn: "AI-generated docs" },
  { id: "environment", label: "Ditt miljø", labelEn: "Your environment" },
  { id: "nis2", label: "NIS2-beredskap", labelEn: "NIS2 readiness" },
];

const HIDDEN_KEY = "mynder_dashboard_hidden_widgets";

function getHiddenWidgets(): string[] {
  try {
    const stored = localStorage.getItem(HIDDEN_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

const Index = () => {
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(getHiddenWidgets);
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

  const toggleWidget = (id: string, visible: boolean) => {
    const next = visible ? hiddenWidgets.filter(w => w !== id) : [...hiddenWidgets, id];
    setHiddenWidgets(next);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
  };

  const resetWidgets = () => {
    setHiddenWidgets([]);
    localStorage.removeItem(HIDDEN_KEY);
  };

  const show = (id: string) => !hiddenWidgets.includes(id);

  const widgetToggles = WIDGET_REGISTRY.map(w => ({
    id: w.id,
    label: isNb ? w.label : w.labelEn,
    visible: show(w.id),
  }));

  // Quick summary counts (mock)
  const summaryItems = [
    { icon: AlertTriangle, label: isNb ? "Åpne hendelser" : "Open incidents", count: 3, color: "text-destructive" },
    { icon: ListTodo, label: isNb ? "Ventende oppgaver" : "Pending tasks", count: 8, color: "text-warning" },
    { icon: Cpu, label: isNb ? "Høyrisiko AI-systemer" : "High-risk AI systems", count: 2, color: "text-primary" },
  ];

  const dashboardContent = (
    <>
      {/* Header with greeting + toggle */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          {isNb ? `Hei${companyName ? `, ${companyName}` : ""}` : `Hi${companyName ? `, ${companyName}` : ""}`}
        </h1>
        <DashboardWidgetToggle widgets={widgetToggles} onToggle={toggleWidget} onReset={resetWidgets} />
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        {isNb ? "Her er det som trenger din oppmerksomhet." : "Here's what needs your attention."}
      </p>

      {/* Quick summary row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {summaryItems.map(item => (
          <div key={item.label} className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3">
            <item.icon className={`h-4 w-4 ${item.color}`} />
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{item.count}</p>
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 1. Immediate attention + Your actions */}
      {(show("immediate-attention") || show("user-actions")) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {show("immediate-attention") && <ImmediateAttentionWidget />}
          {show("user-actions") && <UserActionsWidget />}
        </div>
      )}

      {/* 2. Critical processes + AI Act dependencies */}
      {(show("critical-processes") || show("ai-dependencies")) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {show("critical-processes") && <CriticalProcessesWidget />}
          {show("ai-dependencies") && <CriticalDependenciesWidget />}
        </div>
      )}

      {/* 3. AI Activity */}
      {show("ai-activity") && (
        <div className="mb-6">
          <AIActivityWidget />
        </div>
      )}

      {/* 4. AI-generated docs + Vendor requests */}
      {(show("ai-docs") || show("vendor-requests")) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {show("ai-docs") && <AIGeneratedDocsWidget />}
          {show("vendor-requests") && <VendorRequestsWidget />}
        </div>
      )}

      {/* 5. Your environment */}
      {show("environment") && (
        <div className="mb-6">
          <EnvironmentOverviewWidget />
        </div>
      )}

      {/* 6. NIS2 readiness */}
      {show("nis2") && (
        <div className="mb-6">
          <NIS2ReadinessWidget />
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-mynder">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background/95 backdrop-blur-sm">
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
      <main className="flex-1 h-screen overflow-y-auto bg-background/95 backdrop-blur-sm">
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
