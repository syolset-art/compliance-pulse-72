import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AssetHeader } from "@/components/asset-profile/AssetHeader";
import { AssetMetrics } from "@/components/asset-profile/AssetMetrics";
import { ValidationTab } from "@/components/asset-profile/tabs/ValidationTab";
import { UsageTab } from "@/components/asset-profile/tabs/UsageTab";
import { DataHandlingTab } from "@/components/asset-profile/tabs/DataHandlingTab";
import { RiskManagementTab } from "@/components/asset-profile/tabs/RiskManagementTab";
import { IncidentManagementTab } from "@/components/asset-profile/tabs/IncidentManagementTab";
import { RelationsTab } from "@/components/asset-profile/tabs/RelationsTab";
import { AIUsageTab } from "@/components/asset-profile/tabs/AIUsageTab";
import { DocumentsTab } from "@/components/asset-profile/tabs/DocumentsTab";
import { AnalysisTab } from "@/components/asset-profile/tabs/AnalysisTab";
import { BenchmarkTab } from "@/components/asset-profile/tabs/BenchmarkTab";

const AssetTrustProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  const enabledTabs = template?.enabled_tabs || ['validation', 'usage', 'aiUsage', 'dataHandling', 'riskManagement', 'incidents', 'relations', 'documents', 'analysis', 'benchmark'];

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
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
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

            {/* Tabs section */}
            <Tabs defaultValue="validation" className="w-full">
              <TabsList className="w-full justify-start bg-muted/30 border border-border rounded-xl p-1 h-auto flex-wrap gap-0.5">
                {enabledTabs.includes('validation') && (
                  <TabsTrigger value="validation" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                    {t("trustProfile.tabs.validation")}
                  </TabsTrigger>
                )}
                {enabledTabs.includes('usage') && (
                  <TabsTrigger value="usage" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                    {t("trustProfile.tabs.usage")}
                  </TabsTrigger>
                )}
                {enabledTabs.includes('aiUsage') && (
                  <TabsTrigger value="aiUsage" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                    {t("trustProfile.tabs.aiUsage")}
                  </TabsTrigger>
                )}
                {enabledTabs.includes('dataHandling') && (
                  <TabsTrigger value="dataHandling" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                    {t("trustProfile.tabs.dataHandling")}
                  </TabsTrigger>
                )}
                {enabledTabs.includes('riskManagement') && (
                  <TabsTrigger value="riskManagement" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                    {t("trustProfile.tabs.riskManagement")}
                  </TabsTrigger>
                )}
                {enabledTabs.includes('incidents') && (
                  <TabsTrigger value="incidents" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                    {t("trustProfile.tabs.incidents")}
                  </TabsTrigger>
                )}
                {enabledTabs.includes('relations') && (
                  <TabsTrigger value="relations" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                    {t("trustProfile.tabs.relations")}
                  </TabsTrigger>
                )}
                {enabledTabs.includes('documents') && (
                  <TabsTrigger value="documents" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                    {t("trustProfile.tabs.documents")}
                  </TabsTrigger>
                )}
                {enabledTabs.includes('analysis') && (
                  <TabsTrigger value="analysis" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                    {t("trustProfile.tabs.analysis")}
                  </TabsTrigger>
                )}
                {enabledTabs.includes('benchmark') && (
                  <TabsTrigger value="benchmark" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                    {t("trustProfile.tabs.benchmark")}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="validation" className="mt-6">
                <ValidationTab assetId={asset.id} />
              </TabsContent>

              <TabsContent value="usage" className="mt-6">
                <UsageTab assetId={asset.id} />
              </TabsContent>

              <TabsContent value="aiUsage" className="mt-6">
                <AIUsageTab 
                  assetId={asset.id} 
                  assetCategory={asset.category || undefined}
                  assetVendor={asset.vendor || undefined}
                  assetName={asset.name}
                />
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

              <TabsContent value="documents" className="mt-6">
                <DocumentsTab assetId={asset.id} />
              </TabsContent>

              <TabsContent value="analysis" className="mt-6">
                <AnalysisTab assetId={asset.id} assetName={asset.name} />
              </TabsContent>

              <TabsContent value="benchmark" className="mt-6">
                <BenchmarkTab assetId={asset.id} assetCategory={asset.category || undefined} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AssetTrustProfile;
