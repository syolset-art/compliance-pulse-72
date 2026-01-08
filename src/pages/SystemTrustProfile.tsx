import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { SystemHeader } from "@/components/system-profile/SystemHeader";
import { SystemMetrics } from "@/components/system-profile/SystemMetrics";
import { ValidationTab } from "@/components/system-profile/tabs/ValidationTab";
import { SystemUsageTab } from "@/components/system-profile/tabs/SystemUsageTab";
import { DataHandlingTab } from "@/components/system-profile/tabs/DataHandlingTab";
import { RiskManagementTab } from "@/components/system-profile/tabs/RiskManagementTab";
import { IncidentManagementTab } from "@/components/system-profile/tabs/IncidentManagementTab";

const SystemTrustProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar onToggleChat={() => {}} />
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
          <Sidebar onToggleChat={() => {}} />
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar onToggleChat={() => {}} />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Back button */}
            <Button variant="ghost" onClick={() => navigate("/systems")} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>

            {/* Header section */}
            <SystemHeader system={system} />

            {/* Metrics section */}
            <SystemMetrics 
              system={system} 
              tasksCount={tasks?.length || 0} 
            />

            {/* Tabs section */}
            <Tabs defaultValue="validation" className="w-full">
              <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap gap-1">
                <TabsTrigger value="validation" className="data-[state=active]:bg-background">
                  {t("trustProfile.tabs.validation")}
                </TabsTrigger>
                <TabsTrigger value="usage" className="data-[state=active]:bg-background">
                  {t("trustProfile.tabs.usage")}
                </TabsTrigger>
                <TabsTrigger value="dataHandling" className="data-[state=active]:bg-background">
                  {t("trustProfile.tabs.dataHandling")}
                </TabsTrigger>
                <TabsTrigger value="riskManagement" className="data-[state=active]:bg-background">
                  {t("trustProfile.tabs.riskManagement")}
                </TabsTrigger>
                <TabsTrigger value="incidents" className="data-[state=active]:bg-background">
                  {t("trustProfile.tabs.incidents")}
                </TabsTrigger>
                <Button variant="ghost" size="sm" className="ml-auto">
                  <Plus className="h-4 w-4 mr-1" />
                  {t("trustProfile.tabs.components")}
                </Button>
              </TabsList>

              <TabsContent value="validation" className="mt-6">
                <ValidationTab systemId={system.id} />
              </TabsContent>

              <TabsContent value="usage" className="mt-6">
                <SystemUsageTab systemId={system.id} />
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
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SystemTrustProfile;
