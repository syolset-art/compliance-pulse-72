import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Inbox, Database, Trash2, Loader2, Plus } from "lucide-react";
import { AddAssetDialog } from "@/components/dialogs/AddAssetDialog";
import { AddVendorDialog } from "@/components/dialogs/AddVendorDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { VendorOverviewTab } from "@/components/vendor-dashboard/VendorOverviewTab";
import { VendorListTab } from "@/components/vendor-dashboard/VendorListTab";
import { VendorMapView } from "@/components/vendor-dashboard/VendorMapView";
import { SupplyChainTab } from "@/components/vendor-dashboard/SupplyChainTab";
import { VendorCompareTab } from "@/components/vendor-dashboard/VendorCompareTab";
import { DeviceListTab } from "@/components/devices/DeviceListTab";
import { useGlobalChat } from "@/components/GlobalChatProvider";
import { seedDemoVendorProfiles, deleteDemoVendorProfiles } from "@/lib/demoVendorProfiles";
import { seedDemoDevices, deleteDemoDevices } from "@/lib/demoDeviceProfiles";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function Assets() {
  const { t } = useTranslation();
  const { openChatWithMessage } = useGlobalChat();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const count = await seedDemoVendorProfiles();
      queryClient.invalidateQueries({ queryKey: ["assets"] });
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
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(`${count} demo-leverandører ble fjernet`);
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke fjerne demo-data");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSeedDevices = async () => {
    setIsSeeding(true);
    try {
      const count = await seedDemoDevices();
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(`${count} demo-enheter ble lastet inn`);
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke laste inn demo-enheter");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeleteDevices = async () => {
    setIsDeleting(true);
    try {
      const count = await deleteDemoDevices();
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(`${count} demo-enheter ble fjernet`);
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke fjerne demo-enheter");
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch total inbox count
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

  // Fetch assets
  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assets").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch asset type templates
  const { data: assetTypeTemplates = [] } = useQuery({
    queryKey: ["asset_type_templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("asset_type_templates").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch relationships
  const { data: relationships = [] } = useQuery({
    queryKey: ["asset_relationships"],
    queryFn: async () => {
      const { data, error } = await supabase.from("asset_relationships").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Delete asset mutation
  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(t("assets.deleteSuccess"));
    },
    onError: () => {
      toast.error(t("assets.deleteError"));
    },
  });

  // Filter vendor-type assets
  const vendors = useMemo(() => assets.filter(a => a.asset_type === "vendor"), [assets]);
  const devices = useMemo(() => assets.filter(a => a.asset_type === "hardware"), [assets]);

  const handleDiscoverAI = () => {
    openChatWithMessage(t("vendorDashboard.discoverAI", "Discover with AI"));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-primary">{t("assets.title")}</h1>
              <button
                onClick={() => navigate("/lara-inbox")}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors"
                title={t("vendorDashboard.laraInbox", "Lara Inbox")}
              >
                <Inbox className="h-5 w-5 text-muted-foreground" />
                {totalInboxCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {totalInboxCount}
                  </span>
                )}
              </button>
            </div>
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
                 <DropdownMenuItem onClick={handleSeedDevices} disabled={isSeeding}>
                   <Database className="h-4 w-4 mr-2" />
                   Last inn demo-enheter
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={handleDeleteDevices} disabled={isDeleting} className="text-destructive">
                   <Trash2 className="h-4 w-4 mr-2" />
                   Fjern demo-enheter
                 </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tabbed Layout */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all">{t("vendorDashboard.tabs.all")}</TabsTrigger>
              <TabsTrigger value="devices">
                Enheter
                {devices.length > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted-foreground/15 px-1 text-[10px] font-bold">
                    {devices.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="overview">{t("vendorDashboard.tabs.needsAction", "Krever handling")}</TabsTrigger>
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

            <TabsContent value="devices">
              <DeviceListTab devices={devices} />
            </TabsContent>

            <TabsContent value="all">
              <VendorListTab
                vendors={vendors}
                allAssets={assets}
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
                allAssets={assets}
                relationships={relationships}
              />
            </TabsContent>

            <TabsContent value="compare">
              <VendorCompareTab vendors={vendors} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AddAssetDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAssetAdded={() => queryClient.invalidateQueries({ queryKey: ["assets"] })}
        assetTypeTemplates={assetTypeTemplates}
      />

      <AddVendorDialog
        open={isVendorDialogOpen}
        onOpenChange={setIsVendorDialogOpen}
        onVendorAdded={() => queryClient.invalidateQueries({ queryKey: ["assets"] })}
      />
    </div>
  );
}
