import { useState } from "react";
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
import { AssetHeader } from "@/components/asset-profile/AssetHeader";
import { AssetMetrics } from "@/components/asset-profile/AssetMetrics";
import { TrustProfilePublishing } from "@/components/asset-profile/TrustProfilePublishing";
import { ValidationTab } from "@/components/asset-profile/tabs/ValidationTab";
import { UsageTab } from "@/components/asset-profile/tabs/UsageTab";
import { DataHandlingTab } from "@/components/asset-profile/tabs/DataHandlingTab";
import { RiskManagementTab } from "@/components/asset-profile/tabs/RiskManagementTab";
import { IncidentManagementTab } from "@/components/asset-profile/tabs/IncidentManagementTab";
import { RelationsTab } from "@/components/asset-profile/tabs/RelationsTab";
import { CertificatesTab } from "@/components/asset-profile/tabs/CertificatesTab";
import { DocumentsTab } from "@/components/asset-profile/tabs/DocumentsTab";
import { LaraInboxTab } from "@/components/asset-profile/tabs/LaraInboxTab";
import { AnalysisTab } from "@/components/asset-profile/tabs/AnalysisTab";
import { BenchmarkTab } from "@/components/asset-profile/tabs/BenchmarkTab";
import { CustomerRequestsTab } from "@/components/asset-profile/tabs/CustomerRequestsTab";
import { SecurityServicesSection } from "@/components/asset-profile/tabs/SecurityServicesSection";
import { DeviceComplianceTab } from "@/components/devices/DeviceComplianceTab";

const AssetTrustProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  // Fetch asset
  const { data: asset, isLoading } = useQuery({
    queryKey: ["asset", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
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

  // Fetch asset type template
  const { data: template } = useQuery({
    queryKey: ["asset_type_template", asset?.asset_type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_type_templates")
        .select("*")
        .eq("asset_type", asset?.asset_type)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!asset?.asset_type,
  });

  // Fetch tasks related to this asset
  const { data: tasks } = useQuery({
    queryKey: ["asset-tasks", id],
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

  // Fetch inbox count for badge
  const { data: inboxCount = 0 } = useQuery({
    queryKey: ["lara-inbox-count", id],
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

  const isSelf = asset?.asset_type === 'self';
  const isHardware = asset?.asset_type === 'hardware';
  const enabledTabs = isHardware
    ? ['compliance', 'riskManagement', 'incidents', 'documents']
    : (template?.enabled_tabs || ['validation', 'usage', 'dataHandling', 'riskManagement', 'incidents', 'relations', 'certificates', 'documents', 'analysis', 'benchmark']);

  const [activeTab, setActiveTab] = useState(isHardware ? "compliance" : "validation");

  // Primary tabs (always visible) and overflow tabs (in dropdown)
  const primaryTabDefs = [
    { value: 'compliance', label: 'ISO 27001 Samsvar', show: enabledTabs.includes('compliance') },
    { value: 'validation', label: t("trustProfile.tabs.validation"), show: enabledTabs.includes('validation') },
    { value: 'usage', label: t("trustProfile.tabs.usage"), show: enabledTabs.includes('usage') },
    { value: 'dataHandling', label: t("trustProfile.tabs.dataHandling"), show: enabledTabs.includes('dataHandling') },
    { value: 'riskManagement', label: t("trustProfile.tabs.riskManagement"), show: enabledTabs.includes('riskManagement') },
    { value: 'incidents', label: t("trustProfile.tabs.incidents"), show: enabledTabs.includes('incidents') },
    { value: 'relations', label: t("trustProfile.tabs.relations"), show: enabledTabs.includes('relations') },
    { value: 'certificates', label: t("trustProfile.tabs.certificates"), show: enabledTabs.includes('certificates') },
    { value: 'documents', label: t("trustProfile.tabs.documents"), show: enabledTabs.includes('documents') },
  ].filter(t => t.show);

  const overflowTabDefs = [
    { value: 'inbox', label: 'Innboks', show: true, badge: inboxCount },
    { value: 'analysis', label: t("trustProfile.tabs.analysis"), show: enabledTabs.includes('analysis') },
    { value: 'benchmark', label: t("trustProfile.tabs.benchmark"), show: enabledTabs.includes('benchmark') },
    { value: 'security-services', label: isNb ? 'Sikkerhetstjenester' : 'Security Services', show: isSelf },
    { value: 'requests', label: isNb ? 'Forespørsler' : 'Requests', show: isSelf },
  ].filter(t => t.show);

  const activeOverflowTab = overflowTabDefs.find(t => t.value === activeTab);

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

  if (!asset) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 p-6">
            <Button variant="ghost" onClick={() => navigate("/assets")} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
            <p className="text-muted-foreground">{t("trustProfile.notFound")}</p>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Back button */}
            <Button variant="ghost" onClick={() => navigate("/assets")} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>

            {/* Header section */}
            <AssetHeader asset={asset} template={template} />

            {/* Metrics section */}
            <AssetMetrics 
              asset={asset} 
              tasksCount={tasks?.length || 0} 
            />

            {/* Publishing section for self-type */}
            {isSelf && (
              <TrustProfilePublishing
                assetId={asset.id}
                publishMode={(asset as any).publish_mode || 'private'}
                publishToCustomers={(asset as any).publish_to_customers || []}
              />
            )}

            {/* Tabs section */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
              <div className="flex items-center gap-1">
                <TabsList className="flex bg-muted/30 border border-border rounded-xl p-1 h-auto gap-0.5 flex-1 min-w-0 overflow-hidden">
                  {primaryTabDefs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap flex-none"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Overflow dropdown for additional tabs */}
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
                        {'badge' in tab && (tab as any).badge > 0 && (
                          <Badge className="ml-2 h-4 min-w-4 px-1 text-[9px] bg-primary text-primary-foreground">
                            {(tab as any).badge}
                          </Badge>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {isHardware && (
                <TabsContent value="compliance" className="mt-6">
                  <DeviceComplianceTab
                    assetId={asset.id}
                    metadata={(asset.metadata as Record<string, any>) || {}}
                    asset={asset}
                  />
                </TabsContent>
              )}

              <TabsContent value="validation" className="mt-6">
                <ValidationTab assetId={asset.id} />
              </TabsContent>

              <TabsContent value="usage" className="mt-6">
                <UsageTab assetId={asset.id} />
              </TabsContent>

              <TabsContent value="dataHandling" className="mt-6">
                <DataHandlingTab assetId={asset.id} />
              </TabsContent>

              <TabsContent value="riskManagement" className="mt-6">
                <RiskManagementTab assetId={asset.id} />
              </TabsContent>

              <TabsContent value="incidents" className="mt-6">
                <IncidentManagementTab assetId={asset.id} />
              </TabsContent>

              <TabsContent value="relations" className="mt-6">
                <RelationsTab assetId={asset.id} />
              </TabsContent>

              <TabsContent value="certificates" className="mt-6">
                <CertificatesTab assetId={asset.id} />
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <DocumentsTab assetId={asset.id} assetName={asset.name} vendorName={asset.vendor || undefined} />
              </TabsContent>

              <TabsContent value="inbox" className="mt-6">
                <LaraInboxTab assetId={asset.id} assetName={asset.name} />
              </TabsContent>

              <TabsContent value="analysis" className="mt-6">
                <AnalysisTab assetId={asset.id} assetName={asset.name} />
              </TabsContent>

              <TabsContent value="benchmark" className="mt-6">
                <BenchmarkTab assetId={asset.id} assetCategory={asset.category || undefined} />
              </TabsContent>

              {isSelf && (
                <TabsContent value="security-services" className="mt-6">
                  <SecurityServicesSection isSelfProfile={true} />
                </TabsContent>
              )}
              {isSelf && (
                <TabsContent value="requests" className="mt-6">
                  <CustomerRequestsTab />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AssetTrustProfile;
