import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SystemHeader } from "@/components/system-profile/SystemHeader";
import { SystemMetrics } from "@/components/system-profile/SystemMetrics";
import { ValidationTab } from "@/components/system-profile/tabs/ValidationTab";
import { SystemUsageTab } from "@/components/system-profile/tabs/SystemUsageTab";
import { DataHandlingTab } from "@/components/system-profile/tabs/DataHandlingTab";
import { RiskManagementTab } from "@/components/system-profile/tabs/RiskManagementTab";
import { IncidentManagementTab } from "@/components/system-profile/tabs/IncidentManagementTab";
import { ControlsTab } from "@/components/asset-profile/tabs/ControlsTab";
import { DocumentsTab } from "@/components/asset-profile/tabs/DocumentsTab";
import { LaraInboxTab } from "@/components/asset-profile/tabs/LaraInboxTab";

const SystemTrustProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const [activeTab, setActiveTab] = useState("validation");
  const [trustMetrics, setTrustMetrics] = useState<{ trustScore: number; confidenceScore: number; lastUpdated: string } | null>(null);

  const handleTrustMetrics = useCallback((metrics: { trustScore: number; confidenceScore: number; lastUpdated: string }) => {
    setTrustMetrics(prev => {
      if (prev && prev.trustScore === metrics.trustScore && prev.confidenceScore === metrics.confidenceScore) return prev;
      return metrics;
    });
  }, []);

  const { data: system, isLoading } = useQuery({
    queryKey: ["system", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("systems")
        .select(`
          *,
          work_areas (
            id,
            name,
            responsible_person
          )
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: tasks } = useQuery({
    queryKey: ["system-tasks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .contains("relevant_for", [id]);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: inboxCount = 0 } = useQuery({
    queryKey: ["lara-inbox-count-system", id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("lara_inbox")
        .select("*", { count: "exact", head: true })
        .eq("matched_asset_id", id)
        .in("status", ["new", "auto_matched"]);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  const primaryTabDefs = [
    { value: "validation", label: isNb ? "Veiledning fra Mynder" : "Guidance from Mynder" },
    { value: "controls", label: isNb ? "Kontroller" : "Controls" },
    { value: "dataHandling", label: isNb ? "Datahåndtering" : "Data Handling" },
    { value: "riskManagement", label: isNb ? "Revisjon og risiko" : "Audit & Risk Management" },
    { value: "incidents", label: isNb ? "Avvik og hendelser" : "Deviations & Incidents" },
    { value: "documents", label: isNb ? "Dokumenter" : "Documents" },
    { value: "usage", label: isNb ? "Bruk" : "Usage" },
  ];

  const overflowTabDefs = [
    { value: "inbox", label: isNb ? "Innboks" : "Inbox", badge: inboxCount },
  ];

  const activeOverflowTab = overflowTabDefs.find(tab => tab.value === activeTab);

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!system) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 p-6">
            <Button variant="ghost" onClick={() => navigate("/systems")} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
            <p className="text-muted-foreground">{t("trustProfile.notFound")}</p>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Map system to an asset-like object for TrustControlsPanel compatibility
  const systemAsAsset = {
    id: system.id,
    name: system.name,
    vendor: system.vendor,
    risk_level: system.risk_level,
    compliance_score: system.compliance_score,
    next_review_date: system.next_review_date,
    criticality: "medium" as const,
    work_area_id: system.work_area_id,
    asset_manager: system.system_manager,
    asset_owner: null,
    description: system.description,
    gdpr_role: null,
    contact_person: system.contact_person,
    contact_email: system.contact_email,
    updated_at: system.updated_at,
    asset_type: "system",
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-11">
          <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-5">
            <Button variant="ghost" onClick={() => navigate("/systems")} className="mb-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>

            <SystemHeader system={system} trustMetrics={trustMetrics} />

            <SystemMetrics
              systemAsAsset={systemAsAsset}
              tasksCount={tasks?.length || 0}
              onTrustMetrics={handleTrustMetrics}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
              <nav aria-label={isNb ? "Trust Profile-faner" : "Trust Profile tabs"}>
                <div className="flex items-center gap-1">
                  <TabsList className="flex bg-muted/30 border border-border rounded-xl p-1 h-auto gap-0.5 flex-1 min-w-0 overflow-hidden" role="tablist">
                    {primaryTabDefs.map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap flex-none"
                        role="tab"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {overflowTabDefs.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant={activeOverflowTab ? "default" : "outline"}
                          size="sm"
                          className="h-9 gap-1.5 shrink-0 text-xs"
                        >
                          {activeOverflowTab ? activeOverflowTab.label : (
                            <>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="hidden sm:inline">{isNb ? "Mer" : "More"}</span>
                            </>
                          )}
                          {!activeOverflowTab && inboxCount > 0 && (
                            <Badge className="h-4 min-w-4 px-1 text-[9px] bg-primary text-primary-foreground">{inboxCount}</Badge>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[180px]">
                        {overflowTabDefs.map((tab) => (
                          <DropdownMenuItem
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={activeTab === tab.value ? "bg-accent font-medium" : ""}
                          >
                            <span className="flex-1">{tab.label}</span>
                            {tab.badge > 0 && (
                              <Badge className="ml-2 h-4 min-w-4 px-1 text-[9px] bg-primary text-primary-foreground">
                                {tab.badge}
                              </Badge>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </nav>

              <TabsContent value="validation" className="mt-6">
                <ValidationTab systemId={system.id} />
              </TabsContent>

              <TabsContent value="controls" className="mt-6">
                <ControlsTab assetId={system.id} />
              </TabsContent>

              <TabsContent value="dataHandling" className="mt-6">
                <DataHandlingTab systemId={system.id} />
              </TabsContent>

              <TabsContent value="riskManagement" className="mt-6">
                <RiskManagementTab systemId={system.id} />
              </TabsContent>

              <TabsContent value="incidents" className="mt-6">
                <IncidentManagementTab systemId={system.id} />
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <DocumentsTab assetId={system.id} assetName={system.name} vendorName={system.vendor || undefined} />
              </TabsContent>

              <TabsContent value="usage" className="mt-6">
                <SystemUsageTab systemId={system.id} />
              </TabsContent>

              <TabsContent value="inbox" className="mt-6">
                <LaraInboxTab assetId={system.id} assetName={system.name} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SystemTrustProfile;
