import { useState, useMemo } from "react";
import { usePageHelpListener } from "@/hooks/usePageHelpListener";
import { ContextualHelpPanel } from "@/components/shared/ContextualHelpPanel";
import { Handshake, FileText, Shield, HelpCircle, AlertTriangle, Upload, BarChart3, Send, Share2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Loader2, Plus } from "lucide-react";
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

import { VendorPremiumBanner } from "@/components/vendor-dashboard/VendorPremiumBanner";
import { VendorActivateDialog } from "@/components/vendor-dashboard/VendorActivateDialog";
import { VendorPortfolioActions } from "@/components/vendor-dashboard/VendorPortfolioActions";

const MAX_FREE_VENDORS = 5;

export default function VendorDashboard() {
  const { t } = useTranslation();
  const { openChatWithMessage } = useGlobalChat();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  usePageHelpListener(setHelpOpen);
  const [activateOpen, setActivateOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("vendor_premium_activated") === "true");

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
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-primary">{t("nav.vendors", "Leverandører")}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  if (!isPremium && vendors.length >= MAX_FREE_VENDORS) {
                    setActivateOpen(true);
                  } else {
                    setIsVendorDialogOpen(true);
                  }
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("vendorDashboard.addVendor", "Legg til leverandør")}
              </Button>
            </div>
          </div>

          {/* Premium banner */}
          <VendorPremiumBanner
            vendorCount={vendors.length}
            maxFreeVendors={MAX_FREE_VENDORS}
            isActivated={isPremium}
            onActivate={() => setActivateOpen(true)}
          />

          <Tabs defaultValue="all" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList className="h-9 p-0.5">
                <TabsTrigger value="all" className="text-xs px-3">{t("vendorDashboard.tabs.all")}</TabsTrigger>
                <TabsTrigger value="overview" className="text-xs px-3">{t("vendorDashboard.tabs.overview", "Oversikt")}</TabsTrigger>
                <TabsTrigger value="map" className="text-xs px-3">{t("vendorDashboard.tabs.map")}</TabsTrigger>
                <TabsTrigger value="supplyChain" className="text-xs px-3">{t("vendorDashboard.tabs.supplyChain")}</TabsTrigger>
                <TabsTrigger value="compare" className="text-xs px-3">{t("vendorDashboard.tabs.compare")}</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <VendorPortfolioActions vendors={vendors} />
              </div>
            </div>

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
                newlyAddedId={newlyAddedId}
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
        onVendorAdded={(newId?: string) => {
          queryClient.invalidateQueries({ queryKey: ["vendor-assets"] });
          queryClient.invalidateQueries({ queryKey: ["assets"] });
          if (newId) {
            setNewlyAddedId(newId);
            setTimeout(() => setNewlyAddedId(null), 5500);
          }
        }}
      />

      <VendorActivateDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        onActivated={() => setIsPremium(true)}
      />

      <ContextualHelpPanel
        open={helpOpen}
        onOpenChange={setHelpOpen}
        icon={Handshake}
        title="Hva er leverandørstyring?"
        description="Leverandørstyring gir deg oversikt over alle tredjeparter og databehandlere dere bruker. Du kan vurdere risiko, følge opp dokumentasjon og jobbe strukturert med etterlevelse av krav som GDPR, NIS2 og ISO 27001."
        itemsHeading="Hva kan du gjøre her?"
        items={[
          { icon: FileText, title: "Dokumenter avtaler", description: "Samle, last opp og administrer DPA-er, SLA-er og annen dokumentasjon." },
          { icon: Shield, title: "Analyser dokumenter", description: "La AI-agenter vurdere kvaliteten på dokumenter og oppdatere profilen automatisk med relevant informasjon." },
          { icon: Shield, title: "Vurder risiko", description: "Få oversikt over risiko og compliance-score – basert på dokumentasjon og hva som mangler." },
          { icon: AlertTriangle, title: "Følg opp mangler", description: "Identifiser mangler og send forespørsler med sporbarhet og historikk." },
          { icon: Handshake, title: "Del og samarbeid", description: "Del rapporter og innsikt med relevante parter. Du styrer hva som deles, slik at sensitiv informasjon håndteres trygt." },
        ]}
        whyTitle="Hvorfor er dette viktig?"
        whyDescription="Manglende kontroll på leverandører er en av de største risikofaktorene. Med automatisert analyse og strukturert oppfølging får du bedre oversikt, oppdatert risikobilde og mer effektivt samarbeid."
        stepsHeading="Kom i gang"
        steps={[
          { text: "Legg til leverandører, en og en eller last opp et dokument" },
          { text: "Last opp eller be om dokumentasjon" },
          { text: "Få automatisk analyse og oppdatert risikobilde" },
          { text: "Følg opp mangler, del innsikt og sett påminnelser" },
        ]}
        actions={[
          { icon: Plus, title: "Legg til leverandør", description: "Registrer en ny leverandør eller databehandler.", onClick: () => { setHelpOpen(false); setIsVendorDialogOpen(true); } },
          { icon: Upload, title: "Last opp dokumentasjon", description: "Last opp DPA, SLA eller annen avtale for en leverandør.", onClick: () => { setHelpOpen(false); setIsVendorDialogOpen(true); } },
          { icon: BarChart3, title: "Se risikovurdering", description: "Gå gjennom compliance-score og risikostatus for leverandørene.", onClick: () => { setHelpOpen(false); } },
          { icon: Send, title: "Be om oppdatering", description: "Be en leverandør om manglende dokumentasjon eller oppdateringer.", onClick: () => { setHelpOpen(false); } },
          { icon: Share2, title: "Del rapport", description: "Del leverandøroversikt eller compliance-status med relevante parter.", onClick: () => { setHelpOpen(false); } },
        ]}
        laraSuggestion="Hjelp meg med å få oversikt over leverandørene mine og identifisere de som mangler avtaler"
      />
    </div>
  );
}
