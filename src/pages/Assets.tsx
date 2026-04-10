import { useState, useMemo } from "react";
import { PageHelpDrawer } from "@/components/shared/PageHelpDrawer";
import { HelpCircle, Shield, Server as ServerIcon, Layers } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Database, Trash2, Loader2, Plus, Monitor, HardDrive } from "lucide-react";
import { AddAssetDialog } from "@/components/dialogs/AddAssetDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DeviceListTab } from "@/components/devices/DeviceListTab";
import { AssetRowActionMenu, type StatusOption } from "@/components/shared/AssetRowActionMenu";
import { seedDemoDevices, deleteDemoDevices } from "@/lib/demoDeviceProfiles";

const ASSET_LIFECYCLE_OPTIONS: StatusOption[] = [
  { value: "active", label: "Aktiv" },
  { value: "in_review", label: "Under evaluering" },
  { value: "quarantine", label: "Karantene" },
  { value: "phase_out", label: "Fases ut" },
  { value: "archived", label: "Arkivert" },
  { value: "rejected", label: "Avvist" },
];
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface WorkArea {
  id: string;
  name: string;
  responsible_person?: string | null;
}

export default function Assets() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  usePageHelpListener(setHelpOpen);

  const handleSeedDevices = async () => {
    setIsSeeding(true);
    try {
      const count = await seedDemoDevices();
      queryClient.invalidateQueries({ queryKey: ["device-assets"] });
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
      queryClient.invalidateQueries({ queryKey: ["device-assets"] });
      toast.success(`${count} demo-enheter ble fjernet`);
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke fjerne demo-enheter");
    } finally {
      setIsDeleting(false);
    }
  };

  const { data: assets = [] } = useQuery({
    queryKey: ["device-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .neq("asset_type", "vendor")
        .neq("asset_type", "self");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: assetTypeTemplates = [] } = useQuery({
    queryKey: ["asset_type_templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("asset_type_templates").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: workAreas = [] } = useQuery({
    queryKey: ["work_areas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_areas").select("*");
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
      queryClient.invalidateQueries({ queryKey: ["device-assets"] });
      toast.success(t("assets.deleteSuccess"));
    },
    onError: () => {
      toast.error(t("assets.deleteError"));
    },
  });

  const assignOwner = useMutation({
    mutationFn: async ({ id, workAreaId }: { id: string; workAreaId: string }) => {
      const workArea = workAreas.find((wa: WorkArea) => wa.id === workAreaId);
      const { error } = await supabase.from("assets").update({
        work_area_id: workAreaId,
        asset_owner: workArea?.responsible_person || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-assets"] });
      toast.success("Eier satt");
    },
  });

  const archiveAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").update({ lifecycle_status: "archived" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-assets"] });
      toast.success("Asset arkivert");
    },
  });

  const changeLifecycle = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("assets").update({ lifecycle_status: status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-assets"] });
      toast.success("Status oppdatert");
    },
  });

  const restoreAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").update({ lifecycle_status: "active" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-assets"] });
      toast.success("Asset gjenopprettet");
    },
  });

  const devices = useMemo(() => assets.filter(a => a.asset_type === "hardware"), [assets]);
  const otherAssets = useMemo(() => assets.filter(a => a.asset_type !== "hardware"), [assets]);

  const getOwnerName = (asset: any) => {
    if (asset.asset_owner) return asset.asset_owner;
    if (asset.work_area_id) {
      const wa = workAreas.find((a: WorkArea) => a.id === asset.work_area_id);
      return wa?.name || null;
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16 md:pt-11">
        <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-primary">
                {t("nav.assetsDevices", "Assets")}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("assets.addAsset", "Legg til asset")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isSeeding || isDeleting}>
                    {(isSeeding || isDeleting) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                    Demo-data
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
          </div>

          <Tabs defaultValue="devices" className="space-y-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="devices" className="gap-1.5">
                <Monitor className="h-4 w-4" />
                {t("assets.devices", "Enheter")}
                {devices.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted-foreground/15 px-1 text-[10px] font-bold">
                    {devices.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="other" className="gap-1.5">
                <HardDrive className="h-4 w-4" />
                {t("assets.otherAssets", "Andre assets")}
                {otherAssets.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted-foreground/15 px-1 text-[10px] font-bold">
                    {otherAssets.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="devices">
              <DeviceListTab
                devices={devices}
                workAreas={workAreas}
                lifecycleOptions={ASSET_LIFECYCLE_OPTIONS}
                onSetOwner={(id, waId) => assignOwner.mutate({ id, workAreaId: waId })}
                onSetStatus={(id, status) => changeLifecycle.mutate({ id, status })}
                onArchive={(id) => archiveAsset.mutate(id)}
                onRestore={(id) => restoreAsset.mutate(id)}
                onDelete={(id) => deleteAsset.mutate(id)}
              />
            </TabsContent>

            <TabsContent value="other">
              {otherAssets.length === 0 ? (
                <div className="rounded-lg border border-border p-12 text-center">
                  <HardDrive className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {t("assets.noOtherAssets", "Ingen andre assets registrert")}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t("assets.addAssetDescription", "Legg til assets som infrastruktur, databaser eller andre ressurser.")}
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t("assets.addAsset", "Legg til asset")}
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_60px] gap-4 px-4 py-3 bg-muted/30 text-sm font-medium text-muted-foreground">
                    <div>{t("assets.name", "Navn")}</div>
                    <div>{t("assets.type", "Type")}</div>
                    <div>{t("systems.owner", "Eier")}</div>
                    <div>{t("assets.riskLevel", "Risiko")}</div>
                    <div></div>
                  </div>
                  {otherAssets.map((asset) => {
                    const ownerName = getOwnerName(asset);
                    return (
                      <div
                        key={asset.id}
                        onClick={() => navigate(`/assets/${asset.id}`)}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_60px] gap-4 px-4 py-3 border-t border-border items-center hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <div className="font-medium text-foreground">{asset.name}</div>
                        <div className="text-muted-foreground text-sm">{asset.asset_type}</div>
                        <div className="text-sm">
                          {ownerName ? (
                            <span className="text-foreground">{ownerName}</span>
                          ) : (
                            <span className="text-muted-foreground/50 italic text-xs">Ikke satt</span>
                          )}
                        </div>
                        <div>
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            asset.risk_level === "high" ? "bg-destructive/20 text-destructive" :
                            asset.risk_level === "medium" ? "bg-yellow-500/20 text-yellow-600" :
                            "bg-green-500/20 text-green-600"
                          }`}>
                            {asset.risk_level || "medium"}
                          </span>
                        </div>
                        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                          <AssetRowActionMenu
                            itemId={asset.id}
                            currentWorkAreaId={asset.work_area_id}
                            currentStatus={asset.lifecycle_status}
                            isArchived={asset.lifecycle_status === "archived"}
                            workAreas={workAreas}
                            statusOptions={ASSET_LIFECYCLE_OPTIONS}
                            onSetOwner={(itemId, waId) => assignOwner.mutate({ id: itemId, workAreaId: waId })}
                            onArchive={(itemId) => archiveAsset.mutate(itemId)}
                            onRestore={(itemId) => restoreAsset.mutate(itemId)}
                            onDelete={(itemId) => deleteAsset.mutate(itemId)}
                            onSetStatus={(itemId, status) => changeLifecycle.mutate({ id: itemId, status })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AddAssetDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAssetAdded={() => queryClient.invalidateQueries({ queryKey: ["device-assets"] })}
        assetTypeTemplates={assetTypeTemplates}
      />

      <PageHelpDrawer
        open={helpOpen}
        onOpenChange={setHelpOpen}
        icon={ServerIcon}
        title="Hva er enheter og assets?"
        description="Her får du oversikt over fysiske enheter, servere og andre eiendeler i organisasjonen. Du kan spore eierskap, livssyklus-status og knytte dem til arbeidsområder for bedre risikostyring."
        itemsHeading="Hva kan du gjøre her?"
        items={[
          { icon: Layers, title: "Organiser eiendeler", description: "Kategoriser enheter etter type og knytt dem til arbeidsområder." },
          { icon: Shield, title: "Spor livssyklus", description: "Hold oversikt over status — aktiv, under evaluering, fases ut eller arkivert." },
        ]}
        whyTitle="Hvorfor er dette viktig?"
        whyDescription="Oversikt over fysiske og digitale eiendeler er sentralt for informasjonssikkerhet og risikostyring. Det sikrer at alt utstyr har en eier og følges opp."
        stepsHeading="Kom i gang"
        steps={[
          { text: "Legg til enheter og andre eiendeler" },
          { text: "Knytt hver eiendel til et arbeidsområde" },
          { text: "Sett livssyklus-status og eierskap" },
        ]}
        laraSuggestion="Hjelp meg med å kartlegge enheter og eiendeler i organisasjonen"
      />
    </div>
  );
}
