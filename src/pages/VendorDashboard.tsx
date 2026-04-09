import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Inbox, Database, Trash2, Loader2, Plus } from "lucide-react";
import { AddVendorDialog } from "@/components/dialogs/AddVendorDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { VendorOverviewTab } from "@/components/vendor-dashboard/VendorOverviewTab";
import { VendorListTab } from "@/components/vendor-dashboard/VendorListTab";
import { VendorMapView } from "@/components/vendor-dashboard/VendorMapView";
import { SupplyChainTab } from "@/components/vendor-dashboard/SupplyChainTab";
import { VendorCompareTab } from "@/components/vendor-dashboard/VendorCompareTab";
import { useGlobalChat } from "@/components/GlobalChatProvider";
import { seedDemoVendorProfiles, deleteDemoVendorProfiles } from "@/lib/demoVendorProfiles";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function VendorDashboard() {
  const { t } = useTranslation();
  const { openChatWithMessage } = useGlobalChat();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const count = await seedDemoVendorProfiles();
      queryClient.invalidateQueries({ queryKey: ["vendor-assets"] });
      toast.success(`${count} demo-leverandører ble lastet inn`);
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke laste inn demo-data");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeleteDemo = async () => {
    setIsDeleting(true);
    try {
      const count = await deleteDemoVendorProfiles();
      queryClient.invalidateQueries({ queryKey: ["vendor-assets"] });
      toast.success(`${count} demo-leverandører ble fjernet`);
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke fjerne demo-data");
    } finally {
      setIsDeleting(false);
    }
  };

  const { data: totalInboxCount = 0 } = useQuery({
    queryKey: ["lara-inbox-total"],
    queryFn: async () => {
      const { count } = await supabase
        .from("lara_inbox")
        .select("id", { count: "exact", head: true })
        .in("status", ["new", "auto_matched"]);
      return count || 0;
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendor-assets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assets").select("*").eq("asset_type", "vendor");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allAssets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assets").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: relationships = [] } = useQuery({
    queryKey: ["asset_relationships"],
    queryFn: async () => {
      const { data, error } = await supabase.from("asset_relationships").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(t("assets.deleteSuccess"));
    },
    onError: () => {
      toast.error(t("assets.deleteError"));
    },
  });

  const handleDiscoverAI = () => {
    openChatWithMessage(t("vendorDashboard.discoverAI", "Discover with AI"));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16 md:pt-11">
        <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-primary">{t("nav.vendors", "Leverandører")}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsVendorDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("vendorDashboard.addVendor", "Legg til leverandør")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isSeeding || isDeleting}>
                    {(isSeeding || isDeleting) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                    Demo-data
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSeedDemo} disabled={isSeeding}>
                    <Database className="h-4 w-4 mr-2" />
                    Last inn demo-leverandører
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteDemo} disabled={isDeleting} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Fjern demo-leverandører
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all">{t("vendorDashboard.tabs.all")}</TabsTrigger>
              <TabsTrigger value="overview">{t("vendorDashboard.tabs.overview", "Oversikt")}</TabsTrigger>
              <TabsTrigger value="map">{t("vendorDashboard.tabs.map")}</TabsTrigger>
              <TabsTrigger value="supplyChain">{t("vendorDashboard.tabs.supplyChain")}</TabsTrigger>
              <TabsTrigger value="compare">{t("vendorDashboard.tabs.compare")}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <VendorOverviewTab
                vendors={vendors}
                relationships={relationships}
                onAddVendor={() => setIsVendorDialogOpen(true)}
                onDiscoverAI={handleDiscoverAI}
                onDelete={(id) => deleteAsset.mutate(id)}
              />
            </TabsContent>

            <TabsContent value="all">
              <VendorListTab
                vendors={vendors}
                allAssets={allAssets}
                relationships={relationships}
                onDelete={(id) => deleteAsset.mutate(id)}
              />
            </TabsContent>

            <TabsContent value="map">
              <VendorMapView vendors={vendors} />
            </TabsContent>

            <TabsContent value="supplyChain">
              <SupplyChainTab
                vendors={vendors}
                allAssets={allAssets}
                relationships={relationships}
              />
            </TabsContent>

            <TabsContent value="compare">
              <VendorCompareTab vendors={vendors} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AddVendorDialog
        open={isVendorDialogOpen}
        onOpenChange={setIsVendorDialogOpen}
        onVendorAdded={() => {
          queryClient.invalidateQueries({ queryKey: ["vendor-assets"] });
          queryClient.invalidateQueries({ queryKey: ["assets"] });
        }}
      />
    </div>
  );
}
